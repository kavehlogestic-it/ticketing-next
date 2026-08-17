import "server-only";

import { API_ENDPOINTS } from "@/constants/api-urls";
import { api } from "@/lib/api/client";
import type { RateTicketPayload } from "@/types/ticket";

/**
 * Ticket Rating API Service
 * POST /api/tickets/{id}/rate
 * Body: { rate: number, description: string }
 */
export async function submitTicketRating(
  ticketId: number | string,
  payload: RateTicketPayload,
  token?: string | null,
): Promise<{ success: boolean }> {
  const res = await api.post<{ success: boolean }>(
    API_ENDPOINTS.TICKETS.RATE(ticketId),
    {
      rate: payload.rate,
      description: payload.description || "",
    },
    { token },
  );
  return res ?? { success: true };
}
