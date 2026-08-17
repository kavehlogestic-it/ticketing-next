"use client";

import { useEffect, useState } from "react";

import { useNotificationStore } from "@/features/notifications/stores/notification-store";
import { ChatComposer } from "@/features/tickets/components/chat/chat-composer";
import { ChatScrollArea } from "@/features/tickets/components/chat/chat-scroll-area";
import { useRouter } from "@/i18n/navigation";
import type { TicketDetail, TicketReply } from "@/types/ticket";

interface TicketChatThreadProps {
  ticket: TicketDetail;
  currentUserAccountId: number;
  currentUserFullName?: string;
  currentUserRoleId?: number;
  canReply: boolean;
}

export function TicketChatThread({
  ticket,
  currentUserAccountId,
  currentUserFullName = "شما",
  currentUserRoleId = 2,
  canReply,
}: TicketChatThreadProps) {
  const router = useRouter();
  const [optimisticReplies, setOptimisticReplies] = useState<TicketReply[]>([]);
  const notifications = useNotificationStore((s) => s.notifications);

  const serverReplies = ticket.replies || [];

  // Remove optimistic replies that now exist in serverReplies
  useEffect(() => {
    if (optimisticReplies.length > 0) {
      setOptimisticReplies((current) =>
        current.filter(
          (opt) =>
            !serverReplies.some(
              (sr) =>
                sr.replyId === opt.replyId ||
                (sr.text === opt.text &&
                  Math.abs(new Date(sr.replyDate).getTime() - new Date(opt.replyDate).getTime()) < 120000),
            ),
        ),
      );
    }
  }, [serverReplies, optimisticReplies.length]);

  // Real-time listener: when a new reply arrives via LAN notification for this ticket
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (
        latest &&
        latest.ticketId === ticket.ticketId &&
        latest.type === "ticket.reply.created"
      ) {
        // Refresh server component in background to fetch newest replies
        router.refresh();
      }
    }
  }, [notifications, ticket.ticketId, router]);

  const handleOptimisticSend = (text: string, attachmentName?: string | null) => {
    const optimisticReply: TicketReply = {
      replyId: Date.now(),
      text,
      accountId: currentUserAccountId,
      accountFullName: currentUserFullName,
      roleId: currentUserRoleId,
      ticketReplyAttachment: attachmentName ?? null,
      replyDate: new Date().toISOString(),
    };

    setOptimisticReplies((prev) => [...prev, optimisticReply]);
  };

  // Combine server replies with any pending optimistic replies
  const pendingOptimistic = optimisticReplies.filter(
    (opt) =>
      !serverReplies.some(
        (sr) =>
          sr.replyId === opt.replyId ||
          (sr.text === opt.text &&
            Math.abs(new Date(sr.replyDate).getTime() - new Date(opt.replyDate).getTime()) < 120000),
      ),
  );

  const combinedReplies = [...serverReplies, ...pendingOptimistic];

  return (
    <section className="flex-1 flex flex-col min-h-0 min-w-0 bg-background/50">
      {/* Scrollable message timeline with persistent optimistic & live state */}
      <ChatScrollArea
        ticket={ticket}
        replies={combinedReplies}
        currentUserAccountId={currentUserAccountId}
      />

      {/* Fixed bottom reply composer */}
      <ChatComposer
        ticketId={ticket.ticketId}
        disabled={!canReply}
        onOptimisticSend={handleOptimisticSend}
      />
    </section>
  );
}
