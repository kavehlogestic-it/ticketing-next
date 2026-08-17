"use client";

import { Headphones, User as UserIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";

import { Badge } from "@/components/ui/badge";
import { AttachmentPreview } from "@/features/tickets/components/chat/attachment-preview";
import type { TicketReply } from "@/types/ticket";
import { formatDate } from "@/utils/date";

interface ChatMessageProps {
  reply: TicketReply;
}

export function ChatMessage({ reply }: ChatMessageProps) {
  const locale = useLocale();
  const t = useTranslations("common");
  const isResponder = reply.roleId === 1;

  return (
    <div
      className={`flex items-start gap-3 my-3 transition-opacity ${
        isResponder ? "justify-start" : "justify-end"
      }`}
    >
      {/* Responder Avatar (Leading) */}
      {isResponder ? (
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-xs mt-1"
          title={t("roles.responder")}
        >
          <Headphones className="h-4 w-4" />
        </div>
      ) : null}

      {/* Message Bubble Card */}
      <div
        className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4 shadow-2xs border transition-colors ${
          isResponder
            ? "bg-chat-support text-chat-support-text border-chat-support-border rounded-tl-xs"
            : "bg-card text-foreground border-border rounded-tr-xs"
        }`}
      >
        {/* Author Header & Badge */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-1.5 border-b border-border/40 mb-2">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-xs text-foreground">
              {reply.accountFullName || (isResponder ? t("roles.responder") : t("roles.user"))}
            </span>
            <Badge
              variant={isResponder ? "default" : "outline"}
              className="text-[9px] py-0 px-1.5 h-3.5 font-normal"
            >
              {isResponder ? t("roles.responder") : t("roles.user")}
            </Badge>
          </div>

          <span className="text-[11px] text-muted-foreground font-mono">
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

      {/* User Avatar (Trailing) */}
      {!isResponder ? (
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-secondary-foreground border shadow-xs mt-1"
          title={t("roles.user")}
        >
          <UserIcon className="h-4 w-4 text-muted-foreground" />
        </div>
      ) : null}
    </div>
  );
}
