"use server";

import { revalidateTicket } from "@/cache";
import { ApiError } from "@/lib/api/types";
import { changeTicketStatus } from "@/services/ticket-service";

export interface ChangeStatusResult {
  success: boolean;
  error?: string;
}

export async function changeStatusAction(
  ticketId: number | string,
  newStatus: string,
): Promise<ChangeStatusResult> {
  if (!newStatus) {
    return { success: false, error: "وضعیت جدید معتبر نیست" };
  }

  try {
    await changeTicketStatus(ticketId, newStatus);
    revalidateTicket(ticketId);

    return { success: true };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "خطا در تغییر وضعیت تیکت";
    return { success: false, error: message };
  }
}
