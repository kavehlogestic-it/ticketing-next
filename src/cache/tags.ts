/**
 * Central registry of Next.js cache tags for tag-based caching and revalidation.
 */
export const CACHE_TAGS = {
  USER: (id: string | number) => `user:${id}`,
  CURRENT_USER: "user:current",
  TICKETS: "tickets:list",
  TICKET_DETAIL: (id: string | number) => `ticket:${id}`,
  TICKET_GROUPS: "groups:ticket",
  USER_GROUPS: "groups:user",
  DASHBOARD: "dashboard:stats",
} as const;

export type CacheTag = typeof CACHE_TAGS;
