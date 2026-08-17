"use client";

import type { NotificationItem } from "@/features/notifications/types/notification";

let swRegistration: ServiceWorkerRegistration | null = null;

/**
 * Register local service worker for notifications
 */
export async function registerNotificationServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === "undefined" || !("serviceWorker" in navigator)) {
    return null;
  }

  try {
    if (!swRegistration) {
      swRegistration = await navigator.serviceWorker.register("/sw-notifications.js", {
        scope: "/",
      });
    }
    return swRegistration;
  } catch (error) {
    console.debug("Service Worker registration skipped or failed:", error);
    return null;
  }
}

/**
 * Check if the browser supports notifications
 */
export function isNotificationSupported(): boolean {
  return typeof window !== "undefined" && "Notification" in window;
}

/**
 * Get current browser notification permission
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return "denied";
  return Notification.permission;
}

/**
 * Request notification permission from the user
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return "denied";

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      await registerNotificationServiceWorker();
    }
    return permission;
  } catch {
    return "denied";
  }
}

/**
 * Show a native desktop browser notification
 * Uses requireInteraction: true to ensure the notification stays on screen until dismissed.
 */
export async function showDesktopNotification(
  item: NotificationItem,
  onClick?: (ticketId: number) => void,
): Promise<void> {
  if (!isNotificationSupported() || Notification.permission !== "granted") {
    return;
  }

  const title = item.title;
  const options: NotificationOptions = {
    body: item.message,
    icon: "/favicon.ico",
    badge: "/favicon.ico",
    tag: `ticket_${item.ticketId}_${item.type}`,
    requireInteraction: true, // Forces the browser notification to stay visible until user acts
    silent: false,
    data: {
      url: `/tickets/${item.ticketId}`,
      ticketId: item.ticketId,
    },
  };

  try {
    const reg = swRegistration || (await registerNotificationServiceWorker());
    if (reg && "showNotification" in reg) {
      await reg.showNotification(title, options);
      return;
    }

    // Fallback if Service Worker is not available
    const notification = new Notification(title, options);
    notification.onclick = () => {
      window.focus();
      if (onClick) {
        onClick(item.ticketId);
      } else {
        window.open(`/tickets/${item.ticketId}`, "_self");
      }
      notification.close();
    };
  } catch (error) {
    console.debug("Failed to display desktop notification:", error);
  }
}
