import "server-only";

import { API_ENDPOINTS } from "@/constants/api-urls";
import { api } from "@/lib/api/client";
import type { PaginatedTickets, TicketDetail, TicketFilterParams, TicketSummary } from "@/types/ticket";

export async function getTickets(
  params: TicketFilterParams = {},
  token?: string | null,
): Promise<PaginatedTickets> {
  const queryParams: Record<string, string | number | undefined> = {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 20,
  };

  if (params.status && params.status !== "all") {
    queryParams.status = params.status;
  }
  if (params.search && params.search.trim() !== "") {
    queryParams.search = params.search.trim();
  }
  if (
    params.userGroupType !== undefined &&
    params.userGroupType !== null &&
    String(params.userGroupType) !== "" &&
    String(params.userGroupType) !== "all"
  ) {
    queryParams.userGroupType = Number(params.userGroupType);
  }

  const response = await api.get<PaginatedTickets | TicketSummary[]>(API_ENDPOINTS.TICKETS.LIST, {
    params: queryParams,
    token,
  });

  // Normalize response shape in case backend returns array directly or object
  if (Array.isArray(response)) {
    return {
      total: response.length,
      page: Number(queryParams.page),
      pageSize: Number(queryParams.pageSize),
      items: response,
    };
  }

  return {
    total: response?.total ?? 0,
    page: response?.page ?? Number(queryParams.page),
    pageSize: response?.pageSize ?? Number(queryParams.pageSize),
    items: response?.items ?? [],
  };
}

export async function getTicketById(
  id: number | string,
  token?: string | null,
): Promise<TicketDetail> {
  return api.get<TicketDetail>(API_ENDPOINTS.TICKETS.DETAIL(id), { token });
}

export async function createTicket(
  formData: FormData,
  token?: string | null,
): Promise<{ ticketId?: number; success: boolean }> {
  return api.postForm<{ ticketId?: number; success: boolean }>(API_ENDPOINTS.TICKETS.CREATE, formData, { token });
}

export async function replyToTicket(
  ticketId: number | string,
  formData: FormData,
  token?: string | null,
): Promise<{ success: boolean; replyId?: number }> {
  const attachment = formData.get("attachment") as File | null;
  const text = (formData.get("Text") as string) || (formData.get("text") as string) || "";

  if (attachment && attachment.size > 0) {
    return api.postForm<{ success: boolean; replyId?: number }>(
      API_ENDPOINTS.TICKETS.REPLY(ticketId),
      formData,
      { token },
    );
  }

  // Try JSON first (for [FromBody] controllers), fallback to FormData
  try {
    return await api.post<{ success: boolean; replyId?: number }>(
      API_ENDPOINTS.TICKETS.REPLY(ticketId),
      { text, Text: text },
      { token },
    );
  } catch {
    return await api.postForm<{ success: boolean; replyId?: number }>(
      API_ENDPOINTS.TICKETS.REPLY(ticketId),
      formData,
      { token },
    );
  }
}

export async function closeTicket(
  ticketId: number | string,
  token?: string | null,
): Promise<{ success: boolean }> {
  await api.post<unknown>(API_ENDPOINTS.TICKETS.CLOSE(ticketId), undefined, { token });
  return { success: true };
}

export async function changeTicketStatus(
  ticketId: number | string,
  status: string,
  token?: string | null,
): Promise<{ success: boolean }> {
  await api.post<unknown>(API_ENDPOINTS.TICKETS.CHANGE_STATUS(ticketId), { status }, { token });
  return { success: true };
}
