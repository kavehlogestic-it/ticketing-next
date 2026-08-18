"use client";

import { FileText, Headphones, Paperclip, User as UserIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import type { TicketDetail, TicketReply } from "@/types/ticket";
import { formatDate } from "@/utils/date";

interface TicketTimelineProps {
  ticket: TicketDetail;
}

export function TicketTimeline({ ticket }: TicketTimelineProps) {
  const locale = useLocale();
  const t = useTranslations("tickets.chat");
  const tMeta = useTranslations("tickets.meta");
  const tCommon = useTranslations("common");

  return (
    <div className="space-y-6">
      {/* Initial Ticket Description Message */}
      <div className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-2xs">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserIcon className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-foreground text-sm">
                  {ticket.accountFullName || tMeta("issuer")}
                </span>
                <Badge variant="outline" className="text-[10px] uppercase">
                  {tMeta("issuer")}
                </Badge>
              </div>
              <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                {formatDate(ticket.ticketDate, locale)}
              </span>
            </div>
          </div>

          {ticket.userGroupTitle ? (
            <Badge variant="secondary" className="text-xs">
              {ticket.userGroupTitle}
            </Badge>
          ) : null}
        </div>

        {/* Description Body */}
        <div className="mt-4 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
          {ticket.ticketDescription}
        </div>

        {/* Attachment if present */}
        {ticket.ticketAttachment ? (
          <div className="mt-4 border-t pt-3">
            <div className="inline-flex items-center gap-2 rounded-lg border border-border/80 bg-muted/40 px-3 py-2 text-xs font-mono text-foreground">
              <Paperclip className="h-4 w-4 text-primary" />
              <span className="truncate max-w-[240px]">{ticket.ticketAttachment}</span>
              <FileText className="h-3.5 w-3.5 text-muted-foreground ms-1" />
            </div>
          </div>
        ) : null}
      </div>

      {/* Conversation replies */}
      {ticket.replies && ticket.replies.length > 0 ? (
        <div className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            {t("repliesCount", { count: ticket.replies.length })}
          </h3>

          {ticket.replies.map((reply: TicketReply, idx: number) => {
            const isResponderReply = reply.roleId === 1;

            return (
              <div
                key={reply.replyId || idx}
                className={`rounded-xl border p-4 sm:p-5 transition-all ${
                  isResponderReply
                    ? "border-primary/30 bg-primary/5 dark:bg-primary/10 shadow-2xs ms-0 sm:ms-6"
                    : "border-border bg-card shadow-2xs me-0 sm:me-6"
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-full ${
                        isResponderReply
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {isResponderReply ? (
                        <Headphones className="h-4 w-4" />
                      ) : (
                        <UserIcon className="h-4 w-4" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground text-sm">
                          {reply.accountFullName || (isResponderReply ? tCommon("roles.responder") : tCommon("roles.user"))}
                        </span>
                        <Badge
                          variant={isResponderReply ? "default" : "outline"}
                          className="text-[10px]"
                        >
                          {isResponderReply ? tCommon("roles.responder") : tCommon("roles.user")}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground" suppressHydrationWarning>
                        {formatDate(reply.replyDate, locale)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                  {reply.text}
                </div>

                {reply.ticketReplyAttachment ? (
                  <div className="mt-3 border-t border-border/50 pt-2.5">
                    <div className="inline-flex items-center gap-2 rounded-md border border-border bg-background/80 px-2.5 py-1.5 text-xs font-mono">
                      <Paperclip className="h-3.5 w-3.5 text-primary" />
                      <span className="truncate max-w-[200px]">{reply.ticketReplyAttachment}</span>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          {t("emptyConversation")}
        </div>
      )}
    </div>
  );
}
