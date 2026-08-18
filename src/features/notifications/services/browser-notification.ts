"use client";

import type { AppNotification } from "@/features/notifications/types/notification";

export function getBrowserNotificationPermission(): NotificationPermission | "unsupported" {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "denied";
  }
  try {
    return await Notification.requestPermission();
  } catch {
    return "denied";
  }
}

export function showDesktopNotification(notification: AppNotification): void {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return;
  }

  if (Notification.permission !== "granted") {
    return;
  }

  try {
    const notif = new Notification(notification.title, {
      body: notification.message,
      icon: "/favicon.ico",
      badge: "/favicon.ico",
      tag: `ticket_${notification.ticketId ?? notification.id}_${notification.type}`,
      requireInteraction: true, // Forces notification to stay pinned on screen until clicked
      silent: false,
    });

    notif.onclick = () => {
      window.focus();
      if (notification.ticketId) {
        // eslint-disable-next-line @next/next/no-location-assign-relative-destination
        window.location.href = `/fa/tickets/${notification.ticketId}`;
      }
      notif.close();
    };
  } catch {
    // Fallback if Notification constructor fails in certain environments
  }
}
