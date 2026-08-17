"use client";

import { MessageSquare, Paperclip } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { TicketStatusBadge } from "@/features/tickets/components/ticket-status-badge";
import { Link } from "@/i18n/navigation";
import type { TicketSummary } from "@/types/ticket";
import { formatDate } from "@/utils/date";

interface TicketTableProps {
  tickets: TicketSummary[];
}

export function TicketTable({ tickets }: TicketTableProps) {
  const locale = useLocale();
  const t = useTranslations("tickets.table");

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-start text-sm">
        <thead className="border-b bg-muted/40 text-xs font-semibold uppercase text-muted-foreground">
          <tr>
            <th className="px-4 py-3 text-start">{t("ticketId")}</th>
            <th className="px-4 py-3 text-start">{t("subject")}</th>
            <th className="px-4 py-3 text-start">{t("status")}</th>
            <th className="px-4 py-3 text-start">{t("category")}</th>
            <th className="px-4 py-3 text-start">{t("issuer")}</th>
            <th className="px-4 py-3 text-start">{t("userGroup")}</th>
            <th className="px-4 py-3 text-start">{t("lastUpdate")}</th>
            <th className="px-4 py-3 text-center">{t("replies")}</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tickets.map((ticket) => (
            <tr
              key={ticket.ticketId}
              className="transition-colors hover:bg-muted/20"
            >
              <td className="px-4 py-3.5 font-mono text-xs text-muted-foreground">
                #{ticket.ticketId}
              </td>
              <td className="px-4 py-3.5 max-w-[280px]">
                <Link
                  href={`/tickets/${ticket.ticketId}`}
                  className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-1.5 line-clamp-1"
                >
                  <span>{ticket.ticketSubject}</span>
                  {ticket.ticketAttachment ? (
                    <Paperclip className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                  ) : null}
                </Link>
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                <TicketStatusBadge status={ticket.ticketStatus} />
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap">
                {ticket.ticketGroupTitle ? (
                  <Badge variant="secondary" className="font-normal text-xs">
                    {ticket.ticketGroupTitle}
                  </Badge>
                ) : (
                  <span className="text-muted-foreground text-xs">—</span>
                )}
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap text-xs text-foreground">
                {ticket.accountFullName || "—"}
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground">
                {ticket.userGroupTitle || "—"}
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap text-xs text-muted-foreground font-mono">
                {formatDate(ticket.ticketDate, locale)}
              </td>
              <td className="px-4 py-3.5 whitespace-nowrap text-center text-xs">
                <span className="inline-flex items-center gap-1 text-muted-foreground">
                  <MessageSquare className="h-3.5 w-3.5" />
                  <span>{ticket.replyCount ?? 0}</span>
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
