"use client";

import { Headphones, User as UserIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { AttachmentPreview } from "@/features/tickets/components/chat/attachment-preview";
import type { TicketReply } from "@/types/ticket";
import { formatDate } from "@/utils/date";

interface ChatMessageProps {
  reply: TicketReply;
  currentUserAccountId?: number;
}

export function ChatMessage({ reply, currentUserAccountId }: ChatMessageProps) {
  const locale = useLocale();
  const t = useTranslations("common");

  // Determine if the message was sent by the currently logged-in user
  const isSelf =
    currentUserAccountId !== undefined
      ? reply.accountId === currentUserAccountId
      : reply.roleId !== 1;

  const isResponder = reply.roleId === 1;

  return (
    <div
      className={`flex items-start gap-2.5 my-3.5 transition-all ${
        isSelf
          ? "justify-start rtl:justify-start ltr:justify-end"
          : "justify-end rtl:justify-end ltr:justify-start"
      }`}
    >
      {/* Avatar on Right side for User's own messages */}
      {isSelf ? (
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs mt-1"
          title={reply.accountFullName || t("roles.user")}
        >
          <UserIcon className="h-4 w-4" />
        </div>
      ) : null}

      {/* Message Bubble Card */}
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-2xs border transition-colors ${
          isSelf
            ? "bg-primary/10 text-foreground border-primary/20 rounded-tr-xs rtl:rounded-tr-xs ltr:rounded-tl-xs"
            : isResponder
              ? "bg-chat-support text-chat-support-text border-chat-support-border rounded-tl-xs rtl:rounded-tl-xs ltr:rounded-tr-xs"
              : "bg-card text-foreground border-border rounded-tl-xs rtl:rounded-tl-xs ltr:rounded-tr-xs"
        }`}
      >
        {/* Author Header & Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-border/40 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs text-foreground">
              {reply.accountFullName || (isResponder ? t("roles.responder") : t("roles.user"))}
            </span>
            <Badge
              variant={isResponder ? "default" : isSelf ? "secondary" : "outline"}
              className="text-[9px] py-0 px-1.5 h-3.5 font-normal"
            >
              {isResponder ? t("roles.responder") : t("roles.user")}
            </Badge>
          </div>

          <span className="text-[11px] text-muted-foreground font-mono" suppressHydrationWarning>
            {formatDate(reply.replyDate, locale)}
          </span>
        </div>

        {/* Message Content */}
        <div className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {reply.text}
        </div>

        {/* Attachment Card with Image Preview & Download */}
        {reply.ticketReplyAttachment ? (
          <div className="mt-3 pt-2.5 border-t border-border/50">
            <AttachmentPreview fileName={reply.ticketReplyAttachment} />
          </div>
        ) : null}
      </div>

      {/* Avatar on Left side for Support / Other Party messages */}
      {!isSelf ? (
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground border shadow-xs mt-1"
          title={isResponder ? t("roles.responder") : t("roles.user")}
        >
          {isResponder ? (
            <Headphones className="h-4 w-4 text-primary" />
          ) : (
            <UserIcon className="h-4 w-4" />
          )}
        </div>
      ) : null}
    </div>
  );
}
