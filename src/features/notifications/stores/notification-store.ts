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

  // Actions
  addNotification: (notif: Omit<AppNotification, "id" | "createdAt" | "isRead">) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearAll: () => void;
  dismissToast: () => void;
  updatePreferences: (prefs: Partial<NotificationPreferences>) => void;
  loadFromStorage: () => void;
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
    const newNotif: AppNotification = {
      ...incoming,
      id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      createdAt: new Date().toISOString(),
      isRead: false,
    };

    const state = get();
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
      activeToast: newNotif,
    });

    // Sound alert
    if (state.preferences.soundEnabled) {
      soundSynthesizer.playChime().catch(() => {});
    }

    // Desktop notification
    if (state.preferences.desktopEnabled) {
      showDesktopNotification(newNotif);
    }

    // Tab attention flashing
    tabAttentionManager.flash(newNotif.title);
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
    set({ preferences: updated });
  },
}));
