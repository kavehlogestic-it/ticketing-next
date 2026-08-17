import type { TicketFilterParams } from "@/types/ticket";

/**
 * Cache key generators for request deduplication and memory caching
 */
export const CACHE_KEYS = {
  tickets: (params: TicketFilterParams = {}) =>
    `tickets:${params.status || "all"}:${params.search || "none"}:${params.page || 1}:${params.pageSize || 20}`,
  ticketDetail: (id: string | number) => `ticket:detail:${id}`,
  ticketGroups: "groups:ticket:all",
  userGroups: "groups:user:all",
  userSession: (token: string) => `session:${token.slice(0, 16)}`,
} as const;
