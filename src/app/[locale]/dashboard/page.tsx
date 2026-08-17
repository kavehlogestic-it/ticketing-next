import { getLocale } from "next-intl/server";
import { Suspense } from "react";

import DashboardLoading from "@/app/[locale]/dashboard/loading";
import { getCachedTickets } from "@/cache";
import { AppFooter } from "@/components/layout/app-footer";
import { ResponderDashboard } from "@/features/dashboard/components/responder-dashboard";
import { UserDashboard } from "@/features/dashboard/components/user-dashboard";
import { redirect } from "@/i18n/navigation";
import { isResponder } from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccessToken } from "@/lib/auth/token-store";
import type { PaginatedTickets, TicketSummary } from "@/types/ticket";

async function DashboardContent() {
  const locale = await getLocale();
  const user = await getCurrentUser();
  const token = await getAccessToken();

  if (!user) {
    redirect({ href: "/", locale });
    return null;
  }

  // Fetch initial batch of tickets for user's group to calculate real metrics
  let ticketsData: PaginatedTickets = { total: 0, page: 1, pageSize: 20, items: [] };
  let openCount = 0;
  let underReviewCount = 0;
  let inProgressCount = 0;
  let closedCount = 0;
  const attentionTickets: TicketSummary[] = [];

  try {
    ticketsData = await getCachedTickets({ page: 1, pageSize: 50 }, token);

    // Status metrics
    for (const item of ticketsData.items) {
      const status = item.ticketStatus || "";
      if (status.includes("انتظار") || status.includes("open") || status.includes("جدید")) {
        openCount++;
        attentionTickets.push(item);
      } else if (status.includes("بررسی") || status.includes("review")) {
        underReviewCount++;
        attentionTickets.push(item);
      } else if (status.includes("انجام") || status.includes("progress")) {
        inProgressCount++;
      } else if (status.includes("بسته") || status.includes("close")) {
        closedCount++;
      }
    }
  } catch (error) {
    console.error("Failed to load dashboard tickets:", error);
  }

  const responder = isResponder(user);

  return responder ? (
    <ResponderDashboard
      user={user}
      ticketsData={ticketsData}
      openCount={openCount}
      underReviewCount={underReviewCount}
      inProgressCount={inProgressCount}
      closedCount={closedCount}
      attentionTickets={attentionTickets}
    />
  ) : (
    <UserDashboard
      user={user}
      ticketsData={ticketsData}
      openCount={openCount}
      inProgressCount={inProgressCount}
      closedCount={closedCount}
    />
  );
}

export default function DashboardPage() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto flex flex-col justify-between">
      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <Suspense fallback={<DashboardLoading />}>
          <DashboardContent />
        </Suspense>
      </main>
      <AppFooter />
    </div>
  );
}
