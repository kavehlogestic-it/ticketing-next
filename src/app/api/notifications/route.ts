import { type NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { NotificationHub } from "@/lib/realtime/notification-hub";

export async function GET(request: NextRequest) {
  await connection();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1", 10);
  const pageSize = parseInt(searchParams.get("pageSize") || "20", 10);
  const unreadOnly = searchParams.get("unreadOnly") === "true";

  const result = NotificationHub.getUserNotifications(user.accountId, {
    page,
    pageSize,
    unreadOnly,
  });

  return NextResponse.json(result);
}
