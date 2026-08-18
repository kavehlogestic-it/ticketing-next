import "server-only";

import type { AppNotification, NotificationType } from "@/features/notifications/types/notification";

interface SseClient {
  id: string;
  userId: number;
  roleId: number;
  userGroupId: number;
  controller: ReadableStreamDefaultController;
  connectedAt: number;
}

interface NotificationHubGlobal {
  notifications: AppNotification[];
  clients: Map<string, SseClient>;
}

const globalForHub = globalThis as unknown as {
  __ticketingNotificationHub?: NotificationHubGlobal;
};

const hubState: NotificationHubGlobal =
  globalForHub.__ticketingNotificationHub ?? {
    notifications: [],
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
    recipientUserIds?: number[];
    recipientGroupIds?: number[];
    targetRoles?: number[];
  }): AppNotification[] {
    const createdAt = new Date().toISOString();
    const createdItems: AppNotification[] = [];

    const allRecipients = new Set<number>(event.recipientUserIds || []);

    // Match any connected clients who belong to target roles/groups
    for (const client of hubState.clients.values()) {
      if (
        (event.targetRoles && event.targetRoles.includes(client.roleId)) ||
        (event.recipientGroupIds && event.groupId && event.recipientGroupIds.includes(client.userGroupId))
      ) {
        allRecipients.add(client.userId);
      }
    }

    // Filter out the actor themselves
    if (event.actorId) {
      allRecipients.delete(event.actorId);
    }

    // Broadcast to connected LAN clients
    for (const client of hubState.clients.values()) {
      const isDirectRecipient = allRecipients.has(client.userId);
      const isRoleRecipient = event.targetRoles && event.targetRoles.includes(client.roleId);
      const isGroupRecipient =
        event.recipientGroupIds && event.groupId && event.recipientGroupIds.includes(client.userGroupId);

      if ((isDirectRecipient || isRoleRecipient || isGroupRecipient || !event.targetRoles) && client.userId !== event.actorId) {
        const item: AppNotification = {
          id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
          type: event.type,
          title: event.title,
          message: event.message,
          ticketId: event.ticketId,
          actorId: event.actorId ?? undefined,
          actorName: event.actorName ?? undefined,
          createdAt,
          isRead: false,
        };

        createdItems.push(item);

        try {
          const payload = JSON.stringify({
            type: "notification.created",
            data: item,
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
}
