import "server-only";

import { API_ENDPOINTS } from "@/constants/api-urls";
import { api } from "@/lib/api/client";
import type { TicketGroup, UserGroup } from "@/types/ticket";

export async function getTicketGroups(token?: string | null): Promise<TicketGroup[]> {
  const groups = await api.get<TicketGroup[]>(API_ENDPOINTS.GROUPS.TICKET_GROUPS, { token });
  // Filter out any invalid placeholder like 0 ("انتخاب نوع تیکت") if present
  if (Array.isArray(groups)) {
    return groups.filter((g) => g.ticketGroupId > 0);
  }
  return [];
}

export async function getUserGroups(token?: string | null): Promise<UserGroup[]> {
  const groups = await api.get<UserGroup[]>(API_ENDPOINTS.GROUPS.USER_GROUPS, { token });
  if (Array.isArray(groups)) {
    return groups;
  }
  return [];
}
