"use server";

import { revalidateTicket } from "@/cache";
import { ApiError } from "@/lib/api/types";
import { closeTicket } from "@/services/ticket-service";

export interface CloseResult {
  success: boolean;
  error?: string;
}

export async function closeTicketAction(
  ticketId: number | string,
): Promise<CloseResult> {
  try {
    await closeTicket(ticketId);
    revalidateTicket(ticketId);

    return { success: true };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "خطا در بستن تیکت (Failed to close ticket)";
    return { success: false, error: message };
  }
}
