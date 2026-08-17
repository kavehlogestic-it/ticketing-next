"use server";

import { revalidateTicket } from "@/cache";
import { ApiError } from "@/lib/api/types";
import { getCurrentUser } from "@/lib/auth/session";
import { NotificationHub } from "@/lib/realtime/notification-hub";
import { createTicket } from "@/services/ticket-service";

export interface ActionResult {
  success: boolean;
  error?: string;
  ticketId?: number;
}

export async function createTicketAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  const subject = (formData.get("TicketSubject") as string)?.trim();
  const description = (formData.get("TicketDescription") as string)?.trim();
  const groupIdStr = formData.get("TicketGroupId") as string;
  const groupId = parseInt(groupIdStr, 10);

  if (!subject) {
    return { success: false, error: "موضوع تیکت الزامی است (Subject is required)" };
  }
  if (!description) {
    return { success: false, error: "شرح تیکت الزامی است (Description is required)" };
  }
  if (isNaN(groupId) || groupId <= 0) {
    return { success: false, error: "انتخاب گروه تیکت الزامی است (Ticket group is required)" };
  }

  try {
    const payload = new FormData();
    payload.append("TicketGroupId", String(groupId));
    payload.append("TicketSubject", subject);
    payload.append("TicketDescription", description);

    const dept = formData.get("DepartmentSelectList");
    if (dept) {
      payload.append("DepartmentSelectList", String(dept));
    }

    const attachment = formData.get("attachment") as File | null;
    if (attachment && attachment.size > 0) {
      payload.append("attachment", attachment);
    }

    const res = await createTicket(payload);
    revalidateTicket(res?.ticketId);

    // Dispatch real-time LAN notification
    if (res?.ticketId) {
      const user = await getCurrentUser();
      NotificationHub.publishEvent({
        type: "ticket.created",
        title: `تیکت جدید #${res.ticketId}`,
        message: subject,
        ticketId: res.ticketId,
        groupId,
        actorId: user?.accountId,
        actorName: user?.fullName || user?.username,
        targetRoles: [1],
        recipientGroupIds: [groupId],
      });
    }

    return { success: true, ticketId: res?.ticketId };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "خطا در ثبت تیکت. لطفا دوباره تلاش کنید.";
    return { success: false, error: message };
  }
}
