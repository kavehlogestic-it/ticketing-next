"use server";

import { revalidateTicket } from "@/cache";
import { ApiError } from "@/lib/api/types";
import { getAccessToken } from "@/lib/auth/token-store";
import { submitTicketRating } from "@/services/rating-service";

export interface RateResult {
  success: boolean;
  error?: string;
}

export async function rateTicketAction(
  ticketId: number | string,
  rate: number,
  description?: string,
): Promise<RateResult> {
  if (rate < 1 || rate > 5) {
    return { success: false, error: "امتیاز باید بین ۱ تا ۵ ستاره باشد." };
  }

  // If rating is below 3 (1 or 2 stars), description is required
  if (rate < 3 && (!description || description.trim().length === 0)) {
    return {
      success: false,
      error: "برای امتیازهای کمتر از ۳ ستاره، ثبت توضیحات و علت نارضایتی الزامی است.",
    };
  }

  try {
    const token = await getAccessToken();
    await submitTicketRating(
      ticketId,
      {
        rate,
        description: description?.trim() || "",
      },
      token,
    );
    revalidateTicket(ticketId);

    return { success: true };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : "خطا در ثبت امتیاز تیکت.";
    return { success: false, error: message };
  }
}
