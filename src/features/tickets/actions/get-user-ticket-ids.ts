"use server";

import { getAccessToken } from "@/lib/auth/token-store";
import { getTickets } from "@/services/ticket-service";

export async function getUserTicketIdsAction(): Promise<number[]> {
  try {
    const token = await getAccessToken();
    const res = await getTickets({ pageSize: 250 }, token);
    const items = res?.items ?? [];
    return items.map((t) => Number(t.ticketId)).filter((id) => !isNaN(id) && id > 0);
  } catch (err) {
    console.error("[getUserTicketIdsAction] Error fetching ticket IDs:", err);
    return [];
  }
}
