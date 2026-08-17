import { Calendar, Clock, FolderTree, Hash, Tag } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { TicketStatusBadge } from "@/features/tickets/components/ticket-status-badge";
import type { TicketDetail } from "@/types/ticket";
import { formatDate } from "@/utils/date";

interface TicketMetaDetailsProps {
  ticket: TicketDetail;
}

export function TicketMetaDetails({ ticket }: TicketMetaDetailsProps) {
  const locale = useLocale();
  const t = useTranslations("tickets.meta");

  return (
    <div className="space-y-3.5 pt-2 border-t">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {t("details")}
      </h3>

      <div className="space-y-3 text-xs">
        {/* Status */}
        <div className="flex items-center justify-between py-1">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Tag className="h-3.5 w-3.5" />
            <span>{t("status")}</span>
          </span>
          <TicketStatusBadge status={ticket.ticketStatus} />
        </div>

        {/* Category */}
        <div className="flex items-center justify-between py-1">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <FolderTree className="h-3.5 w-3.5" />
            <span>{t("category")}</span>
          </span>
          <span className="font-medium text-foreground text-end">
            {ticket.ticketGroupTitle || "—"}
          </span>
        </div>

        {/* User Group */}
        <div className="flex items-center justify-between py-1">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Hash className="h-3.5 w-3.5" />
            <span>{t("userGroup")}</span>
          </span>
          <Badge variant="secondary" className="text-xs font-normal">
            {ticket.userGroupTitle || "—"}
          </Badge>
        </div>

        {/* Created At */}
        <div className="flex items-center justify-between py-1">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Calendar className="h-3.5 w-3.5" />
            <span>{t("created")}</span>
          </span>
          <span className="font-medium text-foreground text-end font-mono text-[11px]">
            {formatDate(ticket.ticketDate, locale)}
          </span>
        </div>

        {/* Last Activity */}
        <div className="flex items-center justify-between py-1">
          <span className="text-muted-foreground flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            <span>{t("lastReply")}</span>
          </span>
          <span className="font-medium text-foreground text-end font-mono text-[11px]">
            {formatDate(ticket.lastReplyDateTime, locale)}
          </span>
        </div>

        {/* Tracking Code */}
        {ticket.trackCode && (
          <div className="pt-2 border-t">
            <span className="text-[11px] text-muted-foreground block mb-1">
              {t("trackingCode")}
            </span>
            <span className="font-mono text-[11px] text-foreground bg-muted/60 px-2 py-1 rounded block break-all">
              {ticket.trackCode}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
