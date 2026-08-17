export type NotificationType =
  | "ticket.created"
  | "ticket.assigned"
  | "ticket.reply.created"
  | "ticket.status.changed"
  | "ticket.closed"
  | "ticket.reopened"
  | "ticket.group.created";

export interface NotificationItem {
  id: string;
  userId: number; // recipient accountId
  type: NotificationType;
  title: string;
  message: string;
  ticketId: number;
  groupId?: number | null;
  actorId?: number | null;
  actorName?: string | null;
  isRead: boolean;
  createdAt: string;
  metadata?: Record<string, unknown> | null;
}

export interface NotificationPreferences {
  desktopNotifications: boolean;
  soundEnabled: boolean;
  newTickets: boolean;
  ticketAssignments: boolean;
  newReplies: boolean;
  statusChanges: boolean;
  closedTickets: boolean;
  groupNotifications: boolean;
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  desktopNotifications: false,
  soundEnabled: true,
  newTickets: true,
  ticketAssignments: true,
  newReplies: true,
  statusChanges: true,
  closedTickets: true,
  groupNotifications: true,
};

export type RealtimeConnectionStatus =
  | "connected"
  | "connecting"
  | "disconnected"
  | "reconnecting";

export interface RealtimeNotificationEvent {
  id: string;
  type: NotificationType;
  recipientUserIds: number[];
  recipientGroupIds?: number[];
  targetRoles?: number[]; // e.g. 1 for responders/admins
  payload: Omit<NotificationItem, "userId">;
  timestamp: number;
}
