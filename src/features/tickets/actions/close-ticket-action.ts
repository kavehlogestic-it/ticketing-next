"use server";

import { revalidateTicket } from "@/cache";
import { ApiError } from "@/lib/api/types";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccessToken } from "@/lib/auth/token-store";
import { NotificationHub } from "@/lib/realtime/notification-hub";
import { closeTicket } from "@/services/ticket-service";

export interface CloseResult {
  success: boolean;
  error?: string;
}

export async function closeTicketAction(
  ticketId: number | string,
): Promise<CloseResult> {
  try {
    const token = await getAccessToken();
    await closeTicket(ticketId, token);
    revalidateTicket(ticketId);

    // Dispatch real-time LAN notification
    const user = await getCurrentUser();
    const idNum = Number(ticketId);
    NotificationHub.publishEvent({
      type: "ticket.closed",
      title: `تیکت #${idNum} بسته شد`,
      message: `تیکت شماره #${idNum} توسط ${user?.fullName || "کاربر"} بسته شد.`,
      ticketId: idNum,
      actorId: user?.accountId,
      actorName: user?.fullName || user?.username,
    });

    return { success: true };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "خطا در بستن تیکت (Failed to close ticket)";
    return { success: false, error: message };
  }
}
