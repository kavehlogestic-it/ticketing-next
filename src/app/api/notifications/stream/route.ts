import { connection } from "next/server";

import { getCurrentUser } from "@/lib/auth/session";
import { NotificationHub } from "@/lib/realtime/notification-hub";

export async function GET() {
  await connection();
  const user = await getCurrentUser();

  if (!user) {
    return new Response("Unauthorized", { status: 401 });
  }

  const clientId = `client_${user.accountId}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  let cleanupHub: (() => void) | null = null;
  let heartbeatInterval: ReturnType<typeof setInterval> | null = null;

  const stream = new ReadableStream({
    start(controller) {
      cleanupHub = NotificationHub.registerClient({
        id: clientId,
        userId: user.accountId,
        roleId: user.roleId,
        userGroupId: user.userGroupId,
        controller,
        connectedAt: Date.now(),
      });

      // LAN Heartbeat ping every 25 seconds to keep proxies and firewalls alive
      heartbeatInterval = setInterval(() => {
        try {
          controller.enqueue(new TextEncoder().encode(": keep-alive\n\n"));
        } catch {
          if (heartbeatInterval) clearInterval(heartbeatInterval);
        }
      }, 25000);
    },
    cancel() {
      if (heartbeatInterval) clearInterval(heartbeatInterval);
      if (cleanupHub) cleanupHub();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
