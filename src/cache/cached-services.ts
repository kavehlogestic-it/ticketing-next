import "server-only";

import { cacheLife, cacheTag } from "next/cache";

import { CACHE_TAGS } from "@/cache/tags";
import {
  getTicketById as fetchTicketById,
  getTicketGroups as fetchTicketGroups,
  getTickets as fetchTickets,
  getUserGroups as fetchUserGroups,
} from "@/services";
import type { PaginatedTickets, TicketDetail, TicketFilterParams, TicketGroup, UserGroup } from "@/types/ticket";

/**
 * Data-level caching for ticket groups using Cache Components
 */
export async function getCachedTicketGroups(token?: string | null): Promise<TicketGroup[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.TICKET_GROUPS);
  return fetchTicketGroups(token);
}

/**
 * Data-level caching for user groups using Cache Components
 */
export async function getCachedUserGroups(token?: string | null): Promise<UserGroup[]> {
  "use cache";
  cacheLife("hours");
  cacheTag(CACHE_TAGS.USER_GROUPS);
  return fetchUserGroups(token);
}

/**
 * Data-level caching for ticket detail using Cache Components
 */
export async function getCachedTicketById(id: number | string, token?: string | null): Promise<TicketDetail> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.TICKET_DETAIL(id), CACHE_TAGS.TICKETS);
  return fetchTicketById(id, token);
}

/**
 * Data-level caching for ticket lists using Cache Components
 */
export async function getCachedTickets(params: TicketFilterParams = {}, token?: string | null): Promise<PaginatedTickets> {
  "use cache";
  cacheLife("minutes");
  cacheTag(CACHE_TAGS.TICKETS);
  return fetchTickets(params, token);
}
