import { type NextRequest, NextResponse } from "next/server";
import { connection } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { NotificationHub } from "@/lib/realtime/notification-hub";

export async function GET() {
  await connection();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const preferences = NotificationHub.getUserPreferences(user.accountId);
  return NextResponse.json(preferences);
}

export async function PATCH(request: NextRequest) {
  await connection();
  const user = await getCurrentUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const updated = NotificationHub.updateUserPreferences(user.accountId, body);
    return NextResponse.json(updated);
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
