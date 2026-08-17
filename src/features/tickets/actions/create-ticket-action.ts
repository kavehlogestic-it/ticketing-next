"use server";

import { revalidateTicket } from "@/cache";
import { ApiError } from "@/lib/api/types";
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

    return { success: true, ticketId: res?.ticketId };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "خطا در ثبت تیکت. لطفا دوباره تلاش کنید.";
    return { success: false, error: message };
  }
}
