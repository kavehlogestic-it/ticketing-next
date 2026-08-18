/**
 * Centralized API URLs and Endpoints Configuration
 */

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.API_BASE_URL ||
  "http://192.168.77.30:6040";

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: "/api/auth/login",
    ME: "/api/auth/me",
    REFRESH: "/api/auth/refresh",
    LOGOUT: "/api/auth/logout",
  },
  TICKETS: {
    LIST: "/api/tickets",
    DETAIL: (id: number | string) => `/api/tickets/${id}`,
    CREATE: "/api/tickets",
    REPLY: (id: number | string) => `/api/tickets/${id}/reply`,
    CHANGE_STATUS: (id: number | string) => `/api/tickets/${id}/status`,
    CLOSE: (id: number | string) => `/api/tickets/${id}/close`,
    RATE: (id: number | string) => `/api/tickets/${id}/rate`,
    RATING: (id: number | string) => `/api/tickets/${id}/rate`,
    ATTACHMENT_BASE: "/ticket/attachments",
    ATTACHMENT_URL: (fileName: string) => `/ticket/attachments/${fileName}`,
    SIGNALR_HUB: `${API_BASE_URL}/ticketHub`,
  },
  GROUPS: {
    TICKET_GROUPS: "/api/ticket-groups",
    USER_GROUPS: "/api/user-groups",
  },
  HEALTH: {
    CHECK: "/api/health",
  },
} as const;
