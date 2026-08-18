"use client";

import { AlertTriangle, Radio, Volume2, VolumeX } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { useNotificationStore } from "@/features/notifications/stores/notification-store";
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

  const setActiveTicketId = useNotificationStore((s) => s.setActiveTicketId);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const preferences = useNotificationStore((s) => s.preferences);
  const updatePreferences = useNotificationStore((s) => s.updatePreferences);
  const serverReplies = ticket.replies || [];

  // Reset live state when switching tickets
  useEffect(() => {
    setLiveReplies([]);
    setOptimisticReplies([]);
  }, [ticket.ticketId]);

  // Mark this ticket as actively viewed so the notification store
  // suppresses duplicate toast/sound/desktop for it
  useEffect(() => {
    setActiveTicketId(Number(ticket.ticketId));
    return () => {
      setActiveTicketId(null);
    };
  }, [ticket.ticketId, setActiveTicketId]);

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

        // Trigger notification for replies from other users.
        // The store's activeTicketId suppression prevents toast/sound/desktop
        // since the user is already viewing this chat, but it still persists
        // the notification to the list for history.
        if (
          incomingReply.accountId !== currentUserAccountId &&
          incomingReply.accountId !== 0
        ) {
          addNotification({
            type: "ticket.reply.created",
            title: `پاسخ جدید در تیکت #${ticket.ticketId}`,
            message: incomingReply.text || "پیوست جدید ارسال شد",
            ticketId: Number(ticket.ticketId),
            actorId: incomingReply.accountId,
            actorName: incomingReply.accountFullName || "پشتیبان",
          });
        }
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
  }, [ticket.ticketId, token, currentUserAccountId, addNotification]);

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
              <span>ارتباط زنده فعال</span>
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

        <div className="flex items-center gap-2">
          {/* Sound Mute / Unmute Quick Toggle */}
          <button
            type="button"
            onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
            className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors flex items-center gap-1 text-[11px]"
            title={preferences.soundEnabled ? "صدای پیام‌ها فعال است (کلیک برای قطع صدا)" : "صدای پیام‌ها قطع است (کلیک برای فعالسازی)"}
          >
            {preferences.soundEnabled ? (
              <>
                <Volume2 className="h-3.5 w-3.5 text-primary" />
                <span className="hidden sm:inline">صدا فعال</span>
              </>
            ) : (
              <>
                <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="hidden sm:inline">بی‌صدا</span>
              </>
            )}
          </button>

          <Badge variant="outline" className="text-[10px] h-4 py-0 font-normal">
            اتاق #{ticket.ticketId}
          </Badge>
        </div>
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
