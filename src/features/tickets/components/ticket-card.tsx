"use client";

import { Calendar, Hash, MessageSquare, Paperclip, User as UserIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { TicketStatusBadge } from "@/features/tickets/components/ticket-status-badge";
import { Link } from "@/i18n/navigation";
import type { TicketSummary } from "@/types/ticket";
import { formatDate } from "@/utils/date";

interface TicketCardProps {
  ticket: TicketSummary;
}

export function TicketCard({ ticket }: TicketCardProps) {
  const locale = useLocale();
  const t = useTranslations("tickets.chat");

  return (
    <Card className="overflow-hidden transition-all hover:border-primary/40 hover:shadow-md">
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="font-mono text-xs text-muted-foreground">
              #{ticket.ticketId}
            </Badge>
            <TicketStatusBadge status={ticket.ticketStatus} />
          </div>

          {ticket.ticketGroupTitle ? (
            <Badge variant="secondary" className="text-xs">
              {ticket.ticketGroupTitle}
            </Badge>
          ) : null}
        </div>

        <Link
          href={`/tickets/${ticket.ticketId}`}
          className="mt-3 block group"
        >
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">
            {ticket.ticketSubject}
          </h3>
        </Link>

        <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground border-t pt-3">
          <div className="flex items-center gap-1.5 truncate">
            <UserIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="truncate">{ticket.accountFullName || "—"}</span>
          </div>

          <div className="flex items-center justify-end gap-1.5">
            <MessageSquare className="h-3.5 w-3.5 shrink-0" />
            <span>
              {t("repliesCount", { count: ticket.replyCount ?? 0 })}
            </span>
          </div>

          <div className="flex items-center gap-1.5 truncate">
            <Calendar className="h-3.5 w-3.5 shrink-0" />
            <span>{formatDate(ticket.ticketDate, locale)}</span>
          </div>

          {ticket.ticketAttachment ? (
            <div className="flex items-center justify-end gap-1.5 text-primary">
              <Paperclip className="h-3.5 w-3.5" />
              <span>{t("attachment")}</span>
            </div>
          ) : ticket.userGroupTitle ? (
            <div className="flex items-center justify-end gap-1 text-muted-foreground truncate">
              <Hash className="h-3 w-3 shrink-0" />
              <span className="truncate">{ticket.userGroupTitle}</span>
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
