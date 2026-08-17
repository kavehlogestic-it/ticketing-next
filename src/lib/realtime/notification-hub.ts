import "server-only";

import {
  DEFAULT_NOTIFICATION_PREFERENCES,
  type NotificationItem,
  type NotificationPreferences,
  type NotificationType,
} from "@/features/notifications/types/notification";

interface SseClient {
  id: string;
  userId: number;
  roleId: number;
  userGroupId: number;
  controller: ReadableStreamDefaultController;
  connectedAt: number;
}

// Global in-process storage container to survive Next.js module reloads in dev & production runtime
interface NotificationHubGlobal {
  notifications: NotificationItem[];
  preferences: Map<number, NotificationPreferences>;
  clients: Map<string, SseClient>;
}

const globalForHub = globalThis as unknown as {
  __ticketingNotificationHub?: NotificationHubGlobal;
};

const hubState: NotificationHubGlobal =
  globalForHub.__ticketingNotificationHub ?? {
    notifications: [],
    preferences: new Map(),
    clients: new Map(),
  };

if (!globalForHub.__ticketingNotificationHub) {
  globalForHub.__ticketingNotificationHub = hubState;
}

export class NotificationHub {
  /**
   * Register a new SSE streaming client
   */
  static registerClient(client: SseClient): () => void {
    hubState.clients.set(client.id, client);

    // Send immediate initial handshake and connection confirmation
    try {
      const handshake = JSON.stringify({
        type: "system.connected",
        clientId: client.id,
        timestamp: Date.now(),
      });
      client.controller.enqueue(new TextEncoder().encode(`data: ${handshake}\n\n`));
    } catch {
      hubState.clients.delete(client.id);
    }

    return () => {
      hubState.clients.delete(client.id);
    };
  }

  /**
   * Create and publish a real-time event to authorized recipients on the LAN
   */
  static publishEvent(event: {
    type: NotificationType;
    title: string;
    message: string;
    ticketId: number;
    groupId?: number | null;
    actorId?: number | null;
    actorName?: string | null;
    metadata?: Record<string, unknown> | null;
    recipientUserIds?: number[];
    recipientGroupIds?: number[];
    targetRoles?: number[];
  }): NotificationItem[] {
    const createdAt = new Date().toISOString();
    const createdItems: NotificationItem[] = [];

    // Determine target users
    const allRecipients = new Set<number>(event.recipientUserIds || []);

    // Also match any connected clients or users who belong to target roles/groups
    for (const client of hubState.clients.values()) {
      if (
        (event.targetRoles && event.targetRoles.includes(client.roleId)) ||
        (event.recipientGroupIds && event.groupId && event.recipientGroupIds.includes(client.userGroupId))
      ) {
        allRecipients.add(client.userId);
      }
    }

    // Filter out the actor themselves (do not notify the user of their own actions)
    if (event.actorId) {
      allRecipients.delete(event.actorId);
    }

    // Persist a notification record for each recipient
    for (const userId of allRecipients) {
      const item: NotificationItem = {
        id: `${event.type}_${event.ticketId}_${userId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        userId,
        type: event.type,
        title: event.title,
        message: event.message,
        ticketId: event.ticketId,
        groupId: event.groupId ?? null,
        actorId: event.actorId ?? null,
        actorName: event.actorName ?? null,
        isRead: false,
        createdAt,
        metadata: event.metadata ?? null,
      };

      hubState.notifications.unshift(item);
      createdItems.push(item);
    }

    // Cap in-memory history to prevent unbounded memory growth (e.g. latest 2000 notifications)
    if (hubState.notifications.length > 2000) {
      hubState.notifications = hubState.notifications.slice(0, 2000);
    }

    // Broadcast in real-time to active LAN SSE clients with strict authorization checks
    for (const client of hubState.clients.values()) {
      const isDirectRecipient = allRecipients.has(client.userId);
      const isRoleRecipient = event.targetRoles && event.targetRoles.includes(client.roleId);
      const isGroupRecipient =
        event.recipientGroupIds && event.groupId && event.recipientGroupIds.includes(client.userGroupId);

      if ((isDirectRecipient || isRoleRecipient || isGroupRecipient) && client.userId !== event.actorId) {
        try {
          const userItem =
            createdItems.find((i) => i.userId === client.userId) ||
            createdItems[0] || {
              id: `evt_${Date.now()}`,
              userId: client.userId,
              type: event.type,
              title: event.title,
              message: event.message,
              ticketId: event.ticketId,
              groupId: event.groupId,
              actorId: event.actorId,
              actorName: event.actorName,
              isRead: false,
              createdAt,
              metadata: event.metadata,
            };

          const payload = JSON.stringify({
            type: "notification.created",
            data: userItem,
            timestamp: Date.now(),
          });

          client.controller.enqueue(new TextEncoder().encode(`data: ${payload}\n\n`));
        } catch {
          hubState.clients.delete(client.id);
        }
      }
    }

    return createdItems;
  }

  /**
   * Get paginated notifications for a specific user
   */
  static getUserNotifications(
    userId: number,
    options: { page?: number; pageSize?: number; unreadOnly?: boolean } = {},
  ): { items: NotificationItem[]; total: number; unreadCount: number } {
    const { page = 1, pageSize = 20, unreadOnly = false } = options;

    let userItems = hubState.notifications.filter((n) => n.userId === userId);
    const unreadCount = userItems.filter((n) => !n.isRead).length;

    if (unreadOnly) {
      userItems = userItems.filter((n) => !n.isRead);
    }

    const total = userItems.length;
    const startIndex = (page - 1) * pageSize;
    const items = userItems.slice(startIndex, startIndex + pageSize);

    return { items, total, unreadCount };
  }

  /**
   * Get unread notification count for a user
   */
  static getUnreadCount(userId: number): number {
    return hubState.notifications.filter((n) => n.userId === userId && !n.isRead).length;
  }

  /**
   * Mark a notification as read
   */
  static markAsRead(userId: number, notificationId: string): boolean {
    const item = hubState.notifications.find(
      (n) => n.id === notificationId && n.userId === userId,
    );
    if (item) {
      item.isRead = true;
      return true;
    }
    return false;
  }

  /**
   * Mark all notifications as read for a user
   */
  static markAllAsRead(userId: number): number {
    let count = 0;
    for (const item of hubState.notifications) {
      if (item.userId === userId && !item.isRead) {
        item.isRead = true;
        count++;
      }
    }
    return count;
  }

  /**
   * Get notification preferences for a user
   */
  static getUserPreferences(userId: number): NotificationPreferences {
    return hubState.preferences.get(userId) || DEFAULT_NOTIFICATION_PREFERENCES;
  }

  /**
   * Update notification preferences for a user
   */
  static updateUserPreferences(
    userId: number,
    prefs: Partial<NotificationPreferences>,
  ): NotificationPreferences {
    const current = this.getUserPreferences(userId);
    const updated: NotificationPreferences = { ...current, ...prefs };
    hubState.preferences.set(userId, updated);
    return updated;
  }
}
