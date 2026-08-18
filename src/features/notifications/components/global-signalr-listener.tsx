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
import { useNotificationStore } from "@/features/notifications/stores/notification-store";
import { getUserTicketIdsAction } from "@/features/tickets/actions/get-user-ticket-ids";
import type { User } from "@/types/ticket";

interface GlobalSignalRListenerProps {
  currentUser?: User | null;
  token?: string | null;
}

export function GlobalSignalRListener({ currentUser, token }: GlobalSignalRListenerProps) {
  const addNotification = useNotificationStore((s) => s.addNotification);
  const activeConnectionRef = useRef<HubConnection | null>(null);

  useEffect(() => {
    if (!currentUser) return;

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
        .configureLogging(LogLevel.Warning)
        .build();
    };

    let connection = buildConnection(primaryHubUrl);
    activeConnectionRef.current = connection;

    const subscribeToUserTicketGroups = async (conn: HubConnection) => {
      try {
        // 1. Join user's individual channel
        if (currentUser.accountId) {
          await conn.invoke("JoinTicketGroup", String(currentUser.accountId)).catch(() => {});
        }

        // 2. Fetch all active ticket IDs for this user and join their groups
        const ticketIds = await getUserTicketIdsAction();
        for (const tid of ticketIds) {
          if (!isCancelled) {
            await conn.invoke("JoinTicketGroup", String(tid)).catch(() => {});
          }
        }
        console.log(`[GlobalSignalR] Subscribed to ${ticketIds.length} ticket rooms for user ${currentUser.username}`);
      } catch (err) {
        console.warn("[GlobalSignalR] Group join warning:", err);
      }
    };

    const registerGlobalHandlers = (conn: HubConnection) => {
      // 1. Listen for new replies across tickets
      const handleReply = (evtName: string, raw: unknown) => {
        console.log(`[GlobalSignalR] Live reply received via '${evtName}':`, raw);
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) return;

        const data = raw as Record<string, unknown>;
        const senderId = Number(data.accountId ?? data.AccountId ?? data.userId ?? data.UserId ?? 0);
        const ticketId = Number(data.ticketId ?? data.TicketId ?? 0);
        const text = String(data.text ?? data.Text ?? data.message ?? data.Message ?? "پیام جدید دریافت شد");
        const senderName = String(
          data.accountFullName ??
            data.AccountFullName ??
            data.senderName ??
            data.SenderName ??
            data.userName ??
            "پشتیبانی",
        );

        // Don't notify if the current user sent the reply
        if (senderId > 0 && senderId === currentUser.accountId) {
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

      // 2. Listen for new tickets created
      const handleTicketCreated = (evtName: string, raw: unknown) => {
        console.log(`[GlobalSignalR] Ticket created event via '${evtName}':`, raw);
        if (!raw || typeof raw !== "object") return;
        const data = raw as Record<string, unknown>;
        const ticketId = Number(data.ticketId ?? data.TicketId ?? data.id ?? data.Id ?? 0);
        const subject = String(data.ticketSubject ?? data.TicketSubject ?? data.subject ?? "تیکت جدید در سامانه ایجاد شد");
        const creator = String(data.accountFullName ?? data.AccountFullName ?? data.creator ?? "کاربر");

        // Automatically join this newly created ticket group
        if (ticketId > 0 && conn.state === HubConnectionState.Connected) {
          conn.invoke("JoinTicketGroup", String(ticketId)).catch(() => {});
        }

        addNotification({
          type: "ticket.created",
          title: ticketId > 0 ? `تیکت جدید #${ticketId}` : "تیکت جدید ایجاد شد",
          message: subject,
          ticketId: ticketId > 0 ? ticketId : undefined,
          actorName: creator,
        });
      };

      // 3. Listen for status / closure changes
      const handleStatusChange = (evtName: string, raw: unknown) => {
        console.log(`[GlobalSignalR] Ticket status event via '${evtName}':`, raw);
        if (!raw || typeof raw !== "object") return;
        const data = raw as Record<string, unknown>;
        const ticketId = Number(data.ticketId ?? data.TicketId ?? 0);
        const status = String(data.status ?? data.Status ?? "تغییر یافت");

        addNotification({
          type: "ticket.status.changed",
          title: ticketId > 0 ? `وضعیت تیکت #${ticketId} تغییر کرد` : "تغییر وضعیت تیکت",
          message: `وضعیت جدید: ${status}`,
          ticketId: ticketId > 0 ? ticketId : undefined,
        });
      };

      // Register aliases
      const REPLY_EVENTS = ["ReceiveTicketReply", "receiveTicketReply", "ReceiveReply", "NewReply", "ReceiveMessage"];
      for (const evt of REPLY_EVENTS) {
        conn.on(evt, (data: unknown) => handleReply(evt, data));
      }

      const CREATE_EVENTS = ["ReceiveTicketCreated", "TicketCreated", "NewTicket", "newTicket", "receiveTicketCreated"];
      for (const evt of CREATE_EVENTS) {
        conn.on(evt, (data: unknown) => handleTicketCreated(evt, data));
      }

      const STATUS_EVENTS = ["ReceiveTicketStatusChanged", "TicketStatusChanged", "ReceiveTicketClosed", "TicketClosed"];
      for (const evt of STATUS_EVENTS) {
        conn.on(evt, (data: unknown) => handleStatusChange(evt, data));
      }
    };

    registerGlobalHandlers(connection);

    connection.onreconnected(() => {
      if (!isCancelled) {
        console.log("[GlobalSignalR] Reconnected. Re-subscribing ticket groups...");
        subscribeToUserTicketGroups(connection).catch(() => {});
      }
    });

    const start = async () => {
      try {
        startPromise = connection.start();
        await startPromise;
        if (isCancelled) {
          await connection.stop();
          return;
        }
        console.log("[GlobalSignalR] Global notifications connected.");
        await subscribeToUserTicketGroups(connection);
      } catch (err) {
        if (isCancelled) return;

        // Try proxy fallback if direct cross-origin URL failed
        if (primaryHubUrl.startsWith("http")) {
          try {
            console.log("[GlobalSignalR] Falling back to proxy /ticketHub...");
            connection = buildConnection("/ticketHub");
            activeConnectionRef.current = connection;
            registerGlobalHandlers(connection);
            startPromise = connection.start();
            await startPromise;
            if (isCancelled) {
              await connection.stop();
              return;
            }
            console.log("[GlobalSignalR] Global notifications connected via proxy.");
            await subscribeToUserTicketGroups(connection);
            return;
          } catch {
            // Ignore fallback error
          }
        }

        const errStr = err instanceof Error ? err.message : String(err);
        if (!errStr.includes("stopped") && !errStr.includes("abort")) {
          console.warn("[GlobalSignalR] Connection warning:", errStr);
        }
      }
    };

    start();

    return () => {
      isCancelled = true;
      activeConnectionRef.current = null;
      if (startPromise) {
        startPromise.catch(() => {});
      }
      if (connection.state !== HubConnectionState.Disconnected) {
        connection.stop().catch(() => {});
      }
    };
  }, [currentUser, token, addNotification]);

  return null;
}
