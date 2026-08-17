import { NextResponse } from "next/server";
import { connection } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { NotificationHub } from "@/lib/realtime/notification-hub";

export async function PATCH() {
  await connection();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const count = NotificationHub.markAllAsRead(user.accountId);
  return NextResponse.json({ success: true, count });
}
