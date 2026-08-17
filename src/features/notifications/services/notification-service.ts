import type {
  NotificationItem,
  NotificationPreferences,
} from "@/features/notifications/types/notification";

export async function fetchNotifications(options: {
  page?: number;
  pageSize?: number;
  unreadOnly?: boolean;
} = {}): Promise<{ items: NotificationItem[]; total: number; unreadCount: number }> {
  const { page = 1, pageSize = 20, unreadOnly = false } = options;
  const params = new URLSearchParams({
    page: String(page),
    pageSize: String(pageSize),
    unreadOnly: String(unreadOnly),
  });

  const res = await fetch(`/api/notifications?${params.toString()}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`Failed to load notifications (${res.status})`);
  }

  return res.json();
}

export async function fetchUnreadCount(): Promise<number> {
  const res = await fetch("/api/notifications/unread-count", {
    method: "GET",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    return 0;
  }

  const data = await res.json();
  return data.unreadCount ?? 0;
}

export async function markNotificationAsRead(id: string): Promise<boolean> {
  const res = await fetch(`/api/notifications/${id}/read`, {
    method: "PATCH",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    return false;
  }

  const data = await res.json();
  return Boolean(data.success);
}

export async function markAllNotificationsAsRead(): Promise<boolean> {
  const res = await fetch("/api/notifications/read-all", {
    method: "PATCH",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    return false;
  }

  const data = await res.json();
  return Boolean(data.success);
}

export async function fetchNotificationPreferences(): Promise<NotificationPreferences | null> {
  try {
    const res = await fetch("/api/notifications/preferences", {
      method: "GET",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function saveNotificationPreferences(
  prefs: Partial<NotificationPreferences>,
): Promise<NotificationPreferences | null> {
  try {
    const res = await fetch("/api/notifications/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(prefs),
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}
