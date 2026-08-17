export const NOTIFICATION_EVENTS = {
  TICKET_CREATED: "ticket.created",
  TICKET_ASSIGNED: "ticket.assigned",
  TICKET_REPLY_CREATED: "ticket.reply.created",
  TICKET_STATUS_CHANGED: "ticket.status.changed",
  TICKET_CLOSED: "ticket.closed",
  TICKET_REOPENED: "ticket.reopened",
  TICKET_GROUP_CREATED: "ticket.group.created",
} as const;

export const NOTIFICATION_STORAGE_KEYS = {
  PREFERENCES: "ticketing_notification_preferences",
  MUTED_UNTIL: "ticketing_notifications_muted_until",
  RECEIVED_IDS: "ticketing_received_notification_ids",
} as const;

export const NOTIFICATION_CHANNELS = {
  MULTI_TAB: "ticketing_notifications_tab_sync",
} as const;
