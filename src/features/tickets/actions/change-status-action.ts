"use server";

import { revalidateTicket } from "@/cache";
import { ApiError } from "@/lib/api/types";
import { getCurrentUser } from "@/lib/auth/session";
import { NotificationHub } from "@/lib/realtime/notification-hub";
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

    // Dispatch real-time LAN notification
    const user = await getCurrentUser();
    const idNum = Number(ticketId);
    NotificationHub.publishEvent({
      type: "ticket.status.changed",
      title: `تغییر وضعیت تیکت #${idNum}`,
      message: `وضعیت تیکت شماره #${idNum} به "${newStatus}" تغییر یافت.`,
      ticketId: idNum,
      actorId: user?.accountId,
      actorName: user?.fullName || user?.username,
      targetRoles: [1],
    });

    return { success: true };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "خطا در تغییر وضعیت تیکت";
    return { success: false, error: message };
  }
}
