"use client";

import { AlertTriangle, Radio, Volume2, VolumeX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

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

// Window used to match a confirmed reply back to the optimistic bubble it echoes.
const OPTIMISTIC_MATCH_WINDOW_MS = 120_000;
// Safety-net cleanup for optimistic replies that never get confirmed
// (e.g. success fired but SignalR/revalidation never delivered the echo).
const OPTIMISTIC_STALE_MS = 2 * 60_000;

function normalizeText(text?: string | null) {
  return (text ?? "").trim().replace(/\r\n/g, "\n");
}

/** True if `base` (a confirmed reply) looks like the server-side echo of `optimistic`. */
function isMatchingReply(base: TicketReply, optimistic: TicketReply): boolean {
  if (base.replyId === optimistic.replyId) return true;
  if (base.accountId !== optimistic.accountId) return false;
  
  // Aggressively normalize text to avoid newline/whitespace mismatches
  const normBase = (base.text ?? "").trim().replace(/\s+/g, "");
  const normOpt = (optimistic.text ?? "").trim().replace(/\s+/g, "");
  if (normBase !== normOpt) return false;

  // Avoid parsing base.replyDate since the server might return it without a timezone
  // offset, causing huge mismatches when parsed locally. We just check if the 
  // optimistic reply was created recently.
  const optTime = new Date(optimistic.replyDate).getTime();
  if (!Number.isNaN(optTime) && Date.now() - optTime < OPTIMISTIC_MATCH_WINDOW_MS) {
    return true;
  }
  
  return false;
}

export function TicketChatThread({
  ticket,
  currentUserAccountId,
  currentUserFullName = "شما",
  currentUserRoleId = 2, // TODO: replace with a named role constant/enum from the app
  canReply,
  token,
}: TicketChatThreadProps) {
  const [optimisticReplies, setOptimisticReplies] = useState<TicketReply[]>([]);
  const [liveReplies, setLiveReplies] = useState<TicketReply[]>([]);
  const [status, setStatus] = useState<SignalRStatus>("connecting");

  // Negative, ever-decreasing counter so optimistic IDs can never collide
  // with real (positive) server-issued reply IDs — unlike Date.now(), which could.
  const optimisticIdRef = useRef(0);

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
  // suppresses duplicate visual popover alerts while still playing sound
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
        // The store plays sound and records notification history without
        // obstructing the active chat window with a toast banner.
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
        if (err) {
          // Keep the raw detail in the console for developers; never render
          // internal exception/connection text directly to end users.
          console.error("SignalR ticket hub error:", err);
        }
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
    optimisticIdRef.current -= 1;
    const id = optimisticIdRef.current;
    const optimisticReply: TicketReply = {
      replyId: id,
      text,
      accountId: currentUserAccountId,
      accountFullName: currentUserFullName,
      roleId: currentUserRoleId,
      ticketReplyAttachment: attachmentName ?? null,
      replyDate: new Date().toISOString(),
    };

    setOptimisticReplies((prev) => [...prev, optimisticReply]);
    return id;
  };

  // When the POST resolves, we update the optimistic reply's ID to match the real one.
  // This guarantees `isMatchingReply` will instantly filter it out once the real
  // message is added to `baseReplies` (via SignalR or revalidate), without causing
  // the message to flicker/disappear prematurely.
  const handleSendSuccess = (id: number, serverReplyId?: number) => {
    if (serverReplyId) {
      setOptimisticReplies((prev) =>
        prev.map((r) => (r.replyId === id ? { ...r, replyId: serverReplyId } : r))
      );
    }
  };

  const handleSendError = (id: number) => {
    // The send genuinely failed — nothing confirmed will ever arrive for it,
    // so it's correct to remove it immediately.
    setOptimisticReplies((prev) => prev.filter((r) => r.replyId !== id));
  };

  // Server + live replies, deduped by replyId.
  const baseReplies = useMemo(() => {
    const merged = [...serverReplies];
    for (const live of liveReplies) {
      if (!merged.some((sr) => sr.replyId === live.replyId)) {
        merged.push(live);
      }
    }
    return merged;
  }, [serverReplies, liveReplies]);

  // Once a confirmed reply matching an optimistic one shows up, drop the
  // optimistic entry from state. Also garbage-collect anything stale in case
  // a match never arrives, so the list can't grow unbounded.
  useEffect(() => {
    setOptimisticReplies((prev) => {
      const now = Date.now();
      const next = prev.filter((opt) => {
        const confirmed = baseReplies.some((br) => isMatchingReply(br, opt));
        if (confirmed) return false;
        const age = now - new Date(opt.replyDate).getTime();
        if (!Number.isNaN(age) && age > OPTIMISTIC_STALE_MS) return false;
        return true;
      });
      return next.length === prev.length ? prev : next;
    });
  }, [baseReplies]);

  const pendingOptimistic = useMemo(
    () => optimisticReplies.filter((opt) => !baseReplies.some((br) => isMatchingReply(br, opt))),
    [optimisticReplies, baseReplies],
  );

  const combinedReplies = useMemo(
    () => [...baseReplies, ...pendingOptimistic],
    [baseReplies, pendingOptimistic],
  );

  return (
    <section className="flex-1 flex flex-col min-h-0 min-w-0 bg-background/50">
      {/* Real-time Status Sub-header */}
      <div className="flex items-center justify-between px-4 py-1.5 border-b bg-card/60 text-[11px] font-mono shrink-0">
        <div className="flex items-center gap-2">
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
              <span className="truncate max-w-[300px]">ارتباط زنده قطع است</span>
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
            aria-label={preferences.soundEnabled ? "قطع صدای اعلان‌ها" : "فعال‌سازی صدای اعلان‌ها"}
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
        onSendSuccess={handleSendSuccess}
        onSendError={handleSendError}
      />
    </section>
  );
}