"use server";

import { revalidateTicket } from "@/cache";
import { ApiError } from "@/lib/api/types";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccessToken } from "@/lib/auth/token-store";
import { NotificationHub } from "@/lib/realtime/notification-hub";
import { replyToTicket } from "@/services/ticket-service";

export interface ActionResult {
  success: boolean;
  error?: string;
  replyId?: number;
}

export async function replyTicketAction(
  ticketId: number | string,
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const text = (formData.get("Text") as string)?.trim();
  const attachment = formData.get("attachment") as File | null;

  if (!text) {
    return { success: false, error: "متن پاسخ الزامی است (Reply text is required)" };
  }

  try {
    const token = await getAccessToken();
    const payload = new FormData();
    payload.append("Text", text);

    if (attachment && attachment.size > 0) {
      payload.append("attachment", attachment);
    }

    const res = await replyToTicket(ticketId, payload, token);
    revalidateTicket(ticketId);

    // Dispatch real-time LAN notification
    const user = await getCurrentUser();
    const idNum = Number(ticketId);
    NotificationHub.publishEvent({
      type: "ticket.reply.created",
      title: `پاسخ جدید در تیکت #${idNum}`,
      message: text.slice(0, 150),
      ticketId: idNum,
      actorId: user?.accountId,
      actorName: user?.fullName || user?.username,
    });

    return { success: true, replyId: res?.replyId };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "خطا در ارسال پاسخ. لطفا دوباره تلاش کنید.";
    return { success: false, error: message };
  }
}
