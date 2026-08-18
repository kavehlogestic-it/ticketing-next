"use client";

import { AlertTriangle, Radio } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { ChatComposer } from "@/features/tickets/components/chat/chat-composer";
import { ChatScrollArea } from "@/features/tickets/components/chat/chat-scroll-area";
import {
  type SignalRStatus,
  subscribeToTicketSignalR,
} from "@/lib/realtime/signalr-ticket-hub";
import type { TicketDetail, TicketReply } from "@/types/ticket";

interface TicketChatThreadProps {
  ticket: TicketDetail;
  currentUserAccountId: number;
  currentUserFullName?: string;
  currentUserRoleId?: number;
  canReply: boolean;
  token?: string | null;
}

export function TicketChatThread({
  ticket,
  currentUserAccountId,
  currentUserFullName = "شما",
  currentUserRoleId = 2,
  canReply,
  token,
}: TicketChatThreadProps) {
  const [optimisticReplies, setOptimisticReplies] = useState<TicketReply[]>([]);
  const [liveReplies, setLiveReplies] = useState<TicketReply[]>([]);
  const [status, setStatus] = useState<SignalRStatus>("connecting");
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  const serverReplies = ticket.replies || [];

  // Reset live state when switching tickets
  useEffect(() => {
    setLiveReplies([]);
    setOptimisticReplies([]);
  }, [ticket.ticketId]);

  // Connect purely to SignalR /ticketHub for real-time replies
  useEffect(() => {
    const sub = subscribeToTicketSignalR(
      ticket.ticketId,
      (incomingReply) => {
        setLiveReplies((prev) => {
          // Prevent duplicates
          if (prev.some((r) => r.replyId === incomingReply.replyId)) {
            return prev;
          }
          return [...prev, incomingReply];
        });
      },
      token,
      (newStatus, err) => {
        setStatus(newStatus);
        setErrorDetail(err || null);
      },
      (repliesList) => {
        // Hydrate full replies list from SignalR Hub
        setLiveReplies((prev) => {
          const map = new Map<number, TicketReply>();
          for (const item of [...prev, ...repliesList]) {
            map.set(item.replyId, item);
          }
          return Array.from(map.values());
        });
      },
    );

    return () => {
      sub.disconnect();
    };
  }, [ticket.ticketId, token]);

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

  // Base initial server replies
  const baseReplies = [...serverReplies];

  // Merge live replies arriving exclusively through SignalR
  for (const live of liveReplies) {
    if (!baseReplies.some((sr) => sr.replyId === live.replyId)) {
      baseReplies.push(live);
    }
  }

  // Merge pending optimistic replies that haven't been echoed back yet
  const pendingOptimistic = optimisticReplies.filter(
    (opt) =>
      !baseReplies.some(
        (br) =>
          br.replyId === opt.replyId ||
          (br.text === opt.text &&
            Math.abs(new Date(br.replyDate).getTime() - new Date(opt.replyDate).getTime()) < 120000),
      ),
  );

  const combinedReplies = [...baseReplies, ...pendingOptimistic];

  return (
    <section className="flex-1 flex flex-col min-h-0 min-w-0 bg-background/50">
      {/* Real-time Status Sub-header */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b bg-card/60 text-[11px] font-mono shrink-0" suppressHydrationWarning>
        <div className="flex items-center gap-2" suppressHydrationWarning>
          {status === "connected" ? (
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>ارتباط زنده فعال (SignalR Live)</span>
            </span>
          ) : status === "connecting" ? (
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <Radio className="h-3 w-3 animate-spin" />
              <span>در حال اتصال به سرور گفتگو...</span>
            </span>
          ) : status === "reconnecting" ? (
            <span className="flex items-center gap-1.5 text-amber-600 dark:text-amber-400">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
              <span>در حال اتصال مجدد...</span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-destructive">
              <AlertTriangle className="h-3 w-3" />
              <span className="truncate max-w-[300px]">
                {errorDetail || "ارتباط زنده قطع است"}
              </span>
            </span>
          )}
        </div>

        <Badge variant="outline" className="text-[10px] h-4 py-0 font-normal">
          اتاق #{ticket.ticketId}
        </Badge>
      </div>

      {/* Scrollable message timeline powered purely by SignalR */}
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
