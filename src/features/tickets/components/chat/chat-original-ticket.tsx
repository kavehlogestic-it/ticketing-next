"use client";

import { MessageSquareQuote } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { AttachmentPreview } from "@/features/tickets/components/chat/attachment-preview";
import type { TicketDetail } from "@/types/ticket";
import { formatDate } from "@/utils/date";

interface ChatOriginalTicketProps {
  ticket: TicketDetail;
}

export function ChatOriginalTicket({ ticket }: ChatOriginalTicketProps) {
  const locale = useLocale();
  const t = useTranslations("tickets.chat");
  const tMeta = useTranslations("tickets.meta");

  return (
    <div className="rounded-2xl border border-primary/20 bg-card p-5 shadow-2xs space-y-3 mb-6 transition-all hover:border-primary/40">
      {/* Header Info */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary shrink-0">
            <MessageSquareQuote className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">
                {ticket.accountFullName || tMeta("issuer")}
              </span>
              <Badge variant="outline" className="text-[10px] font-mono">
                {t("initialRequest")}
              </Badge>
            </div>
            <span className="text-xs text-muted-foreground" suppressHydrationWarning>
              {formatDate(ticket.ticketDate, locale)}
            </span>
          </div>
        </div>

        {ticket.userGroupTitle ? (
          <Badge variant="secondary" className="text-xs font-normal">
            {ticket.userGroupTitle}
          </Badge>
        ) : null}
      </div>

      {/* Description Content */}
      <div className="text-sm leading-relaxed text-foreground whitespace-pre-wrap pt-1">
        {ticket.ticketDescription}
      </div>

      {/* Attached file if present */}
      {ticket.ticketAttachment ? (
        <div className="mt-3 pt-3 border-t border-border/60">
          <AttachmentPreview fileName={ticket.ticketAttachment} />
        </div>
      ) : null}
    </div>
  );
}
