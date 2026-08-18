import { ArrowRight } from "lucide-react";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getLocale } from "next-intl/server";
import { Suspense } from "react";

import TicketDetailLoading from "@/app/[locale]/tickets/[id]/loading";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChangeStatusDialog } from "@/features/tickets/components/change-status-dialog";
import { TicketChatThread } from "@/features/tickets/components/chat/ticket-chat-thread";
import { TicketInfoPanel } from "@/features/tickets/components/chat/ticket-info-panel";
import { CloseTicketDialog } from "@/features/tickets/components/close-ticket-dialog";
import { TicketStatusBadge } from "@/features/tickets/components/ticket-status-badge";
import { Link, redirect } from "@/i18n/navigation";
import {
  canChangeTicketStatus,
  canCloseTicket,
  canRateTicket,
  canRespondToTicket,
} from "@/lib/auth/permissions";
import { getCurrentUser } from "@/lib/auth/session";
import { getAccessToken } from "@/lib/auth/token-store";
import { getTicketById } from "@/services/ticket-service";
import type { TicketDetail } from "@/types/ticket";

interface TicketDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

async function TicketDetailContent({ params }: TicketDetailPageProps) {
  await connection();
  const locale = await getLocale();
  const user = await getCurrentUser();
  const token = await getAccessToken();

  if (!user) {
    redirect({ href: "/", locale });
    return null;
  }

  const { id } = await params;
  const ticketId = parseInt(id, 10);
  if (isNaN(ticketId)) {
    notFound();
  }

  let ticket: TicketDetail | null = null;
  try {
    ticket = await getTicketById(ticketId, token);
  } catch {
    notFound();
  }

  if (!ticket) {
    notFound();
  }

  const showChangeStatus = canChangeTicketStatus(user);
  const showClose = canCloseTicket(user, ticket);
  const showRating = canRateTicket(user, ticket);
  const canReply = canRespondToTicket(user, ticket);

  return (
    <div className="flex flex-col flex-1 h-full min-h-0 overflow-hidden bg-background">
      {/* Pinned Sticky Ticket Header */}
      <header className="shrink-0 border-b bg-card px-4 py-3 sm:px-6 shadow-2xs z-10">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Back button */}
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
              title="بازگشت به لیست تیکت‌ها"
            >
              <Link href="/tickets">
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>

            {/* Subject and ID */}
            <div className="flex flex-col truncate">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-xs font-bold shrink-0">
                  #{ticket.ticketId}
                </Badge>
                <TicketStatusBadge status={ticket.ticketStatus} />
                {ticket.ticketGroupTitle ? (
                  <Badge variant="secondary" className="hidden sm:inline-flex text-xs font-normal">
                    {ticket.ticketGroupTitle}
                  </Badge>
                ) : null}
              </div>
              <h1 className="text-sm sm:text-base font-bold text-foreground truncate mt-0.5" title={ticket.ticketSubject}>
                {ticket.ticketSubject}
              </h1>
            </div>
          </div>

          {/* Quick Header Actions (Visible on Mobile / Tablet) */}
          <div className="flex items-center gap-2 self-end sm:self-center lg:hidden">
            {showChangeStatus && (
              <ChangeStatusDialog
                ticketId={ticket.ticketId}
                currentStatus={ticket.ticketStatus}
              />
            )}
            {showClose && (
              <CloseTicketDialog ticketId={ticket.ticketId} />
            )}
          </div>
        </div>
      </header>

      {/* Main Ticket Workspace: Left Chat Column + Full-Height Right Info Panel */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Column: Live Chat Conversation Thread + Bottom Composer */}
        <TicketChatThread
          ticket={ticket}
          currentUserAccountId={user.accountId}
          currentUserFullName={user.fullName || user.username}
          currentUserRoleId={user.roleId}
          canReply={canReply}
          token={token}
        />

        {/* Right Column: Desktop Full-Height Sticky Ticket Information & Actions Panel */}
        <aside className="hidden lg:flex w-80 lg:w-96 shrink-0 h-full border-s border-border bg-card flex-col min-h-0">
          <TicketInfoPanel
            ticket={ticket}
            showChangeStatus={showChangeStatus}
            showClose={showClose}
            showRating={showRating}
          />
        </aside>
      </div>
    </div>
  );
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  return (
    <Suspense fallback={<TicketDetailLoading />}>
      <TicketDetailContent params={params} />
    </Suspense>
  );
}
