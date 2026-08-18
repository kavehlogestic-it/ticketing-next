export type NotificationType =
  | "ticket.reply.created"
  | "ticket.created"
  | "ticket.status.changed"
  | "ticket.closed";

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  ticketId?: number;
  actorId?: number;
  actorName?: string;
  createdAt: string;
  isRead: boolean;
}

export interface NotificationPreferences {
  soundEnabled: boolean;
  desktopEnabled: boolean;
}
