import type { NextRequest } from "next/server";
import createMiddleware from "next-intl/middleware";

import { routing } from "@/i18n/routing";

const handleRouting = createMiddleware(routing);

export default function proxy(request: NextRequest) {
  return handleRouting(request);
}

export const config = {
  matcher: ["/((?!api|trpc|_next|_vercel|manifest|sw|icons|ticketHub|ticket/hub|.*\\..*).*)"],
};
