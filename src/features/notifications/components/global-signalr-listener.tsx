"use client";

import {
  HttpTransportType,
  type HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";
import { useEffect, useRef } from "react";

import { API_BASE_URL, API_ENDPOINTS } from "@/constants/api-urls";
import { soundSynthesizer } from "@/features/notifications/services/sound-synthesizer";
import { useNotificationStore } from "@/features/notifications/stores/notification-store";
import { getUserTicketIdsAction } from "@/features/tickets/actions/get-user-ticket-ids";
import type { User } from "@/types/ticket";

interface GlobalSignalRListenerProps {
  currentUser?: User | null;
  token?: string | null;
}

export function GlobalSignalRListener({ currentUser, token }: GlobalSignalRListenerProps) {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const connectionRef = useRef<HubConnection | null>(null);
  const joinedGroupsRef = useRef<Set<string>>(new Set());
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const currentUserRef = useRef(currentUser);
  currentUserRef.current = currentUser;

  const currentUserId = currentUser?.accountId;

  useEffect(() => {
    if (!currentUserId) return;

    soundSynthesizer.unlock();

    let isCancelled = false;
    let startPromise: Promise<void> | null = null;

    const primaryHubUrl =
      process.env.NEXT_PUBLIC_SIGNALR_URL ||
      API_ENDPOINTS.TICKETS.SIGNALR_HUB ||
      `${API_BASE_URL}/ticketHub`;

    const buildConnection = (url: string) => {
      return new HubConnectionBuilder()
        .withUrl(url, {
          accessTokenFactory: token ? () => token : undefined,
          transport: HttpTransportType.WebSockets | HttpTransportType.LongPolling,
        })
        .withAutomaticReconnect([0, 1500, 3000, 5000, 10000, 30000])
        .configureLogging(LogLevel.None)
        .build();
    };

    const invokeJoinGroup = async (conn: HubConnection, targetId: number) => {
      if (isNaN(targetId) || targetId <= 0) return false;
      try {
        await conn.invoke("JoinTicketGroup", targetId);
        return true;
      } catch {
        try {
          await conn.invoke("JoinTicketGroup", String(targetId));
          return true;
        } catch {
          return false;
        }
      }
    };

    const subscribeToUserTicketGroups = async (conn: HubConnection) => {
      if (conn.state !== HubConnectionState.Connected) {
        return;
      }

      try {
        let ticketIds: number[] = [];
        try {
          ticketIds = await getUserTicketIdsAction();
        } catch {
          return;
        }

        for (const tid of ticketIds) {
          if (isCancelled || conn.state !== HubConnectionState.Connected) break;
          const numId = Number(tid);
          if (numId > 0 && !joinedGroupsRef.current.has(String(numId))) {
            const ok = await invokeJoinGroup(conn, numId);
            if (ok) {
              joinedGroupsRef.current.add(String(numId));
            }
          }
        }
      } catch {
        // Ignore subscription errors
      }
    };

    const registerGlobalHandlers = (conn: HubConnection) => {
      const handleReply = (evtName: string, raw: unknown) => {
        if (!raw) return;

        let data: Record<string, unknown>;
        if (Array.isArray(raw)) {
          if (raw.length === 0) return;
          data = (raw[raw.length - 1] ?? {}) as Record<string, unknown>;
        } else if (typeof raw === "object") {
          data = raw as Record<string, unknown>;
        } else {
          return;
        }

        const senderId = Number(
          data.accountId ?? data.AccountId ?? data.userId ?? data.UserId ?? data.senderId ?? data.SenderId ?? 0,
        );
        const ticketId = Number(data.ticketId ?? data.TicketId ?? 0);
        const text = String(
          data.text ?? data.Text ?? data.message ?? data.Message ?? data.content ?? data.Content ?? "پیام جدید دریافت شد",
        );
        const senderName = String(
          data.accountFullName ??
            data.AccountFullName ??
            data.senderName ??
            data.SenderName ??
            data.userName ??
            data.UserName ??
            "پشتیبانی",
        );

        const currentAccId = currentUserRef.current?.accountId;
        if (senderId > 0 && currentAccId && senderId === currentAccId) {
          return;
        }

        addNotification({
          type: "ticket.reply.created",
          title: ticketId > 0 ? `پاسخ جدید در تیکت #${ticketId}` : "پاسخ جدید به تیکت",
          message: text,
          ticketId: ticketId > 0 ? ticketId : undefined,
          actorId: senderId,
          actorName: senderName,
        });
      };

      const handleTicketCreated = (evtName: string, raw: unknown) => {
        if (!raw || typeof raw !== "object") return;
        const data = raw as Record<string, unknown>;
        const ticketId = Number(data.ticketId ?? data.TicketId ?? data.id ?? data.Id ?? 0);
        const subject = String(
          data.ticketSubject ?? data.TicketSubject ?? data.subject ?? data.Subject ?? "تیکت جدید در سامانه ایجاد شد",
        );
        const creator = String(
          data.accountFullName ?? data.AccountFullName ?? data.creator ?? data.Creator ?? "کاربر",
        );

        if (ticketId > 0 && conn.state === HubConnectionState.Connected) {
          const tidKey = String(ticketId);
          if (!joinedGroupsRef.current.has(tidKey)) {
            invokeJoinGroup(conn, ticketId).catch(() => {});
            joinedGroupsRef.current.add(tidKey);
          }
        }

        addNotification({
          type: "ticket.created",
          title: ticketId > 0 ? `تیکت جدید #${ticketId}` : "تیکت جدید ایجاد شد",
          message: subject,
          ticketId: ticketId > 0 ? ticketId : undefined,
          actorName: creator,
        });
      };

      const handleStatusChange = (evtName: string, raw: unknown) => {
        if (!raw || typeof raw !== "object") return;
        const data = raw as Record<string, unknown>;
        const ticketId = Number(data.ticketId ?? data.TicketId ?? 0);
        const status = String(data.status ?? data.Status ?? data.ticketStatus ?? data.TicketStatus ?? "تغییر یافت");

        addNotification({
          type: "ticket.status.changed",
          title: ticketId > 0 ? `وضعیت تیکت #${ticketId} تغییر کرد` : "تغییر وضعیت تیکت",
          message: `وضعیت جدید: ${status}`,
          ticketId: ticketId > 0 ? ticketId : undefined,
        });
      };

      const REPLY_EVENTS = [
        "ReceiveTicketReply",
        "receiveTicketReply",
        "ReceiveReply",
        "receiveReply",
        "NewReply",
        "newReply",
        "ReceiveMessage",
        "receiveMessage",
        "SendTicketReply",
        "sendTicketReply",
        "SendMessage",
        "sendMessage",
      ];
      for (const evt of REPLY_EVENTS) {
        conn.on(evt, (data: unknown) => handleReply(evt, data));
      }

      const CREATE_EVENTS = [
        "ReceiveTicketCreated",
        "receiveTicketCreated",
        "TicketCreated",
        "ticketCreated",
        "NewTicket",
        "newTicket",
        "ReceiveTicket",
        "receiveTicket",
      ];
      for (const evt of CREATE_EVENTS) {
        conn.on(evt, (data: unknown) => handleTicketCreated(evt, data));
      }

      const STATUS_EVENTS = [
        "ReceiveTicketStatusChanged",
        "receiveTicketStatusChanged",
        "TicketStatusChanged",
        "ticketStatusChanged",
        "ReceiveTicketClosed",
        "receiveTicketClosed",
        "TicketClosed",
        "ticketClosed",
      ];
      for (const evt of STATUS_EVENTS) {
        conn.on(evt, (data: unknown) => handleStatusChange(evt, data));
      }
    };

    const setupConnection = (conn: HubConnection) => {
      registerGlobalHandlers(conn);

      conn.onreconnected(() => {
        if (!isCancelled) {
          joinedGroupsRef.current.clear();
          subscribeToUserTicketGroups(conn).catch(() => {});
        }
      });
    };

    const start = async () => {
      const conn = buildConnection(primaryHubUrl);
      connectionRef.current = conn;
      setupConnection(conn);

      try {
        startPromise = conn.start();
        await startPromise;
        if (isCancelled) {
          if (conn.state === HubConnectionState.Connected) {
            await conn.stop().catch(() => {});
          }
          return;
        }
        await subscribeToUserTicketGroups(conn);
      } catch {
        // Silently handled
      }
    };

    start();

    refreshIntervalRef.current = setInterval(() => {
      const conn = connectionRef.current;
      if (!isCancelled && conn && conn.state === HubConnectionState.Connected) {
        subscribeToUserTicketGroups(conn).catch(() => {});
      }
    }, 30_000);

    return () => {
      isCancelled = true;
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
        refreshIntervalRef.current = null;
      }
      joinedGroupsRef.current.clear();
      const conn = connectionRef.current;
      connectionRef.current = null;
      if (conn && conn.state === HubConnectionState.Connected) {
        conn.stop().catch(() => {});
      }
    };
  }, [currentUserId, token, addNotification]);

  return null;
}
