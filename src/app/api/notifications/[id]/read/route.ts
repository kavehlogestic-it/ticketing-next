import { type NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { NotificationHub } from "@/lib/realtime/notification-hub";

export async function PATCH(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  await connection();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const success = NotificationHub.markAsRead(user.accountId, id);

  return NextResponse.json({ success });
}
