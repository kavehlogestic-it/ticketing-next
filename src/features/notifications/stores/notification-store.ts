"use client";

import { create } from "zustand";

import {
  NOTIFICATION_CHANNELS,
  NOTIFICATION_STORAGE_KEYS,
} from "@/constants/notification-events";
import { showDesktopNotification } from "@/features/notifications/services/browser-notification";
import {
  fetchNotificationPreferences,
  fetchNotifications,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  saveNotificationPreferences,
} from "@/features/notifications/services/notification-service";
import { playNotificationChime } from "@/features/notifications/services/sound-synthesizer";
import { startTabTitleFlash } from "@/features/notifications/services/tab-attention";
import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationItem,
  type NotificationPreferences,
  type RealtimeConnectionStatus,
} from "@/features/notifications/types/notification";

interface NotificationStoreState {
  notifications: NotificationItem[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  connectionStatus: RealtimeConnectionStatus;
  preferences: NotificationPreferences;
  isSettingsOpen: boolean;
  receivedIds: Set<string>;

  // Actions
  loadInitialData: () => Promise<void>;
  addRealtimeNotification: (item: NotificationItem) => void;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => Promise<void>;
  setConnectionStatus: (status: RealtimeConnectionStatus) => void;
  setSettingsOpen: (open: boolean) => void;
}

let broadcastChannel: BroadcastChannel | null = null;

function getBroadcastChannel(): BroadcastChannel | null {
  if (typeof window === "undefined" || !("BroadcastChannel" in window)) {
    return null;
  }
  if (!broadcastChannel) {
    try {
      broadcastChannel = new BroadcastChannel(NOTIFICATION_CHANNELS.MULTI_TAB);
    } catch {
      return null;
    }
  }
  return broadcastChannel;
}

export const useNotificationStore = create<NotificationStoreState>((set, get) => {
  // Setup multi-tab message listener on client
  if (typeof window !== "undefined") {
    const channel = getBroadcastChannel();
    if (channel) {
      channel.onmessage = (event) => {
        const msg = event.data;
        if (!msg || typeof msg !== "object") return;

        if (msg.type === "NOTIFICATION_RECEIVED" && msg.item) {
          get().addRealtimeNotification(msg.item);
        } else if (msg.type === "NOTIFICATION_READ" && msg.id) {
          set((state) => {
            const updated = state.notifications.map((n) =>
              n.id === msg.id ? { ...n, isRead: true } : n,
            );
            return {
              notifications: updated,
              unreadCount: Math.max(0, updated.filter((n) => !n.isRead).length),
            };
          });
        } else if (msg.type === "NOTIFICATIONS_ALL_READ") {
          set((state) => ({
            notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
            unreadCount: 0,
          }));
        } else if (msg.type === "PREFERENCES_UPDATED" && msg.preferences) {
          set({ preferences: msg.preferences });
        }
      };
    }
  }

  return {
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    error: null,
    connectionStatus: "disconnected",
    preferences: DEFAULT_NOTIFICATION_PREFERENCES,
    isSettingsOpen: false,
    receivedIds: new Set<string>(),

    setConnectionStatus: (status) => set({ connectionStatus: status }),

    setSettingsOpen: (open) => set({ isSettingsOpen: open }),

    loadInitialData: async () => {
      set({ isLoading: true, error: null });
      try {
        const [notifsData, prefs] = await Promise.all([
          fetchNotifications({ page: 1, pageSize: 50 }),
          fetchNotificationPreferences(),
        ]);

        const ids = new Set(notifsData.items.map((n) => n.id));

        // Load local preferences if server didn't provide custom ones
        let initialPrefs = prefs || DEFAULT_NOTIFICATION_PREFERENCES;
        if (typeof window !== "undefined") {
          try {
            const local = localStorage.getItem(NOTIFICATION_STORAGE_KEYS.PREFERENCES);
            if (local) {
              initialPrefs = { ...initialPrefs, ...JSON.parse(local) };
            }
          } catch {
            // Local storage access issue fallback
          }
        }

        set({
          notifications: notifsData.items,
          unreadCount: notifsData.unreadCount,
          preferences: initialPrefs,
          receivedIds: ids,
          isLoading: false,
        });
      } catch (err) {
        set({
          isLoading: false,
          error: err instanceof Error ? err.message : "خطا در دریافت اعلان‌ها",
        });
      }
    },

    addRealtimeNotification: (item: NotificationItem) => {
      const state = get();

      // Deduplicate: avoid processing the exact same notification ID twice
      if (state.receivedIds.has(item.id)) {
        return;
      }

      const nextReceivedIds = new Set(state.receivedIds);
      nextReceivedIds.add(item.id);

      // Check category preferences
      const prefs = state.preferences;
      let allowedByCategory = true;

      switch (item.type) {
        case "ticket.created":
          allowedByCategory = prefs.newTickets;
          break;
        case "ticket.assigned":
          allowedByCategory = prefs.ticketAssignments;
          break;
        case "ticket.reply.created":
          allowedByCategory = prefs.newReplies;
          break;
        case "ticket.status.changed":
          allowedByCategory = prefs.statusChanges;
          break;
        case "ticket.closed":
          allowedByCategory = prefs.closedTickets;
          break;
        case "ticket.group.created":
          allowedByCategory = prefs.groupNotifications;
          break;
      }

      if (!allowedByCategory) {
        return;
      }

      // Update in-app state
      set((prev) => {
        const exists = prev.notifications.some((n) => n.id === item.id);
        if (exists) return prev;

        return {
          notifications: [item, ...prev.notifications].slice(0, 100),
          unreadCount: prev.unreadCount + (item.isRead ? 0 : 1),
          receivedIds: nextReceivedIds,
        };
      });

      // Play sound if enabled
      if (prefs.soundEnabled) {
        playNotificationChime();
      }

      // Flash browser tab title to alert user if in another tab
      startTabTitleFlash(item.title);

      // Show native desktop notification if permitted
      if (prefs.desktopNotifications) {
        showDesktopNotification(item);
      }

      // Broadcast to other open browser tabs so they don't duplicate sound but stay in sync
      const channel = getBroadcastChannel();
      if (channel) {
        channel.postMessage({
          type: "NOTIFICATION_RECEIVED",
          item,
        });
      }
    },

    markAsRead: async (id: string) => {
      // Optimistic UI update
      set((state) => {
        const updated = state.notifications.map((n) =>
          n.id === id ? { ...n, isRead: true } : n,
        );
        return {
          notifications: updated,
          unreadCount: Math.max(0, updated.filter((n) => !n.isRead).length),
        };
      });

      // Broadcast to other tabs
      const channel = getBroadcastChannel();
      if (channel) {
        channel.postMessage({ type: "NOTIFICATION_READ", id });
      }

      // Persist on server
      await markNotificationAsRead(id);
    },

    markAllAsRead: async () => {
      // Optimistic UI update
      set((state) => ({
        notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));

      // Broadcast to other tabs
      const channel = getBroadcastChannel();
      if (channel) {
        channel.postMessage({ type: "NOTIFICATIONS_ALL_READ" });
      }

      // Persist on server
      await markAllNotificationsAsRead();
    },

    updatePreferences: async (partial: Partial<NotificationPreferences>) => {
      const updated = { ...get().preferences, ...partial };
      set({ preferences: updated });

      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            NOTIFICATION_STORAGE_KEYS.PREFERENCES,
            JSON.stringify(updated),
          );
        } catch {
          // Ignore local storage error
        }
      }

      // Broadcast to other tabs
      const channel = getBroadcastChannel();
      if (channel) {
        channel.postMessage({
          type: "PREFERENCES_UPDATED",
          preferences: updated,
        });
      }

      // Persist to server
      await saveNotificationPreferences(partial);
    },
  };
});
