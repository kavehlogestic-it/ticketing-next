"use client";

import { ArrowDown } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { ChatMessage } from "@/features/tickets/components/chat/chat-message";
import { ChatOriginalTicket } from "@/features/tickets/components/chat/chat-original-ticket";
import type { TicketDetail, TicketReply } from "@/types/ticket";

interface ChatScrollAreaProps {
  ticket: TicketDetail;
  replies?: TicketReply[];
  currentUserAccountId?: number;
}

export function ChatScrollArea({
  ticket,
  replies,
  currentUserAccountId,
}: ChatScrollAreaProps) {
  const t = useTranslations("tickets.chat");
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomMarkerRef = useRef<HTMLDivElement>(null);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const [userHasScrolledUp, setUserHasScrolledUp] = useState(false);

  const activeReplies = replies ?? ticket.replies ?? [];

  const scrollToBottom = (behavior: ScrollBehavior = "smooth") => {
    bottomMarkerRef.current?.scrollIntoView({ behavior });
    setUserHasScrolledUp(false);
    setShowScrollBottom(false);
  };

  // Initial scroll to bottom on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      scrollToBottom("auto");
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // When new replies arrive, auto-scroll only if user hasn't scrolled up
  useEffect(() => {
    if (!userHasScrolledUp) {
      scrollToBottom("smooth");
    }
  }, [activeReplies.length, userHasScrolledUp]);

  // Track scroll position
  const handleScroll = () => {
    const container = scrollRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    if (distanceFromBottom > 120) {
      setUserHasScrolledUp(true);
      setShowScrollBottom(true);
    } else {
      setUserHasScrolledUp(false);
      setShowScrollBottom(false);
    }
  };

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      {/* Scrollable Message List */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="chat-scroll-container flex-1 min-h-0 overflow-y-auto px-4 py-6 sm:px-6 space-y-4"
      >
        {/* Timeline Start divider */}
        <div className="flex items-center gap-3 my-2 text-xs text-muted-foreground justify-center">
          <div className="h-[1px] bg-border/60 flex-1 max-w-[100px]" />
          <span className="font-mono text-[11px] uppercase tracking-wider">
            {t("conversationThread")}
          </span>
          <div className="h-[1px] bg-border/60 flex-1 max-w-[100px]" />
        </div>

        {/* Initial Ticket Card */}
        <ChatOriginalTicket ticket={ticket} />

        {/* Replies Thread */}
        {activeReplies.length > 0 ? (
          <div className="space-y-3">
            {activeReplies.map((reply) => (
              <ChatMessage
                key={reply.replyId}
                reply={reply}
                currentUserAccountId={currentUserAccountId}
              />
            ))}
          </div>
        ) : null}

        {/* Bottom anchor for scrolling */}
        <div ref={bottomMarkerRef} className="h-2" />
      </div>

      {/* Floating Scroll-to-Bottom Button */}
      {showScrollBottom && (
        <div className="absolute bottom-4 inset-x-0 flex justify-center pointer-events-none z-20 animate-in fade-in zoom-in duration-200">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => scrollToBottom("smooth")}
            className="pointer-events-auto gap-1.5 rounded-full shadow-lg text-xs font-semibold border border-border/80 bg-card/95 backdrop-blur-md px-4 py-1.5 hover:bg-muted text-foreground transition-all hover:scale-105"
          >
            <ArrowDown className="h-3.5 w-3.5 text-primary" />
            <span>{t("scrollToBottom")}</span>
          </Button>
        </div>
      )}
    </div>
  );
}
