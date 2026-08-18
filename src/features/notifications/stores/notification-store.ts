"use client";

import { create } from "zustand";

import { showDesktopNotification } from "@/features/notifications/services/browser-notification";
import { soundSynthesizer } from "@/features/notifications/services/sound-synthesizer";
import { tabAttentionManager } from "@/features/notifications/services/tab-attention";
import type { AppNotification, NotificationPreferences } from "@/features/notifications/types/notification";

const STORAGE_KEY_NOTIFS = "ticket_app_notifications";
const STORAGE_KEY_PREFS = "ticket_app_notif_prefs";

interface NotificationStoreState {
  notifications: AppNotification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  activeToast: AppNotification | null;
  /** The ticket ID currently being viewed in the chat. Null when not in any chat. */
  activeTicketId: number | null;

  // Actions
  addNotification: (notif: Omit<AppNotification, "id" | "createdAt" | "isRead">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  dismissToast: () => void;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  loadFromStorage: () => void;
  setActiveTicketId: (ticketId: number | null) => void;
}

const defaultPreferences: NotificationPreferences = {
  soundEnabled: true,
  desktopEnabled: true,
};

export const useNotificationStore = create<NotificationStoreState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  preferences: defaultPreferences,
  activeToast: null,
  activeTicketId: null,

  loadFromStorage: () => {
    if (typeof window === "undefined") return;
    try {
      const storedNotifs = localStorage.getItem(STORAGE_KEY_NOTIFS);
      const storedPrefs = localStorage.getItem(STORAGE_KEY_PREFS);

      const notifs: AppNotification[] = storedNotifs ? JSON.parse(storedNotifs) : [];
      const prefs: NotificationPreferences = storedPrefs
        ? { ...defaultPreferences, ...JSON.parse(storedPrefs) }
        : defaultPreferences;

      const unreadCount = notifs.filter((n) => !n.isRead).length;

      set({
        notifications: notifs,
        unreadCount,
        preferences: prefs,
      });
    } catch {
      // Ignore localStorage read errors
    }
  },

  addNotification: (incoming) => {
    const state = get();

    // Deduplicate: skip if exact same type+ticketId+actorId was received in the last 1.5 seconds.
    // This prevents duplicate sound/toast when both the global SignalR listener
    // and the chat thread's dedicated subscription receive the same message.
    const now = Date.now();
    const isDuplicate = state.notifications.some((n) => {
      if (n.type !== incoming.type) return false;
      if (n.ticketId !== incoming.ticketId) return false;
      if (n.actorId !== incoming.actorId) return false;
      const age = now - new Date(n.createdAt).getTime();
      return age < 1500;
    });
    if (isDuplicate) return;

    const isViewingThisTicket =
      incoming.ticketId != null &&
      state.activeTicketId != null &&
      incoming.ticketId === state.activeTicketId;

    const newNotif: AppNotification = {
      ...incoming,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      isRead: isViewingThisTicket, // Automatically marked read if user is actively in the chat
    };

    const updatedNotifs = [newNotif, ...state.notifications].slice(0, 50); // Keep last 50
    const unreadCount = updatedNotifs.filter((n) => !n.isRead).length;

    // Persist to storage
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(updatedNotifs));
      } catch {
        // Ignore localStorage write errors
      }
    }

    set({
      notifications: updatedNotifs,
      unreadCount,
      activeToast: isViewingThisTicket ? state.activeToast : newNotif,
    });

    // 1. ALWAYS play sound when sound is enabled (both when in chat AND outside chat)
    if (state.preferences.soundEnabled) {
      soundSynthesizer.playChime().catch(() => {});
    }

    // 2. Extra alerts when user is NOT in the ticket chat:
    if (!isViewingThisTicket) {
      // Desktop notification
      if (state.preferences.desktopEnabled) {
        showDesktopNotification(newNotif);
      }

      // Tab attention flashing
      tabAttentionManager.flash(newNotif.title);
    }
  },

  markAsRead: (id: string) => {
    const state = get();
    const updated = state.notifications.map((n) =>
      n.id === id ? { ...n, isRead: true } : n,
    );
    const unreadCount = updated.filter((n) => !n.isRead).length;

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(updated));
      } catch {
        // Ignore storage write error
      }
    }

    set({
      notifications: updated,
      unreadCount,
    });
  },

  markAllAsRead: () => {
    const state = get();
    const updated = state.notifications.map((n) => ({ ...n, isRead: true }));

    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(updated));
      } catch {
        // Ignore storage write error
      }
    }

    set({
      notifications: updated,
      unreadCount: 0,
    });
  },

  clearAll: () => {
    if (typeof window !== "undefined") {
      try {
        localStorage.removeItem(STORAGE_KEY_NOTIFS);
      } catch {
        // Ignore storage removal error
      }
    }

    set({
      notifications: [],
      unreadCount: 0,
    });
  },

  dismissToast: () => {
    set({ activeToast: null });
  },

  updatePreferences: (prefs) => {
    const updated = { ...get().preferences, ...prefs };
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY_PREFS, JSON.stringify(updated));
      } catch {
        // Ignore storage write error
      }
    }
    if (prefs.soundEnabled) {
      soundSynthesizer.unlock();
    }
    set({ preferences: updated });
  },

  setActiveTicketId: (ticketId) => {
    set({ activeTicketId: ticketId });
  },
}));
