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

  useEffect(() => {
    if (!currentUser) return;

    // Ensure audio can play
    soundSynthesizer.unlock();

    let isCancelled = false;

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
        .configureLogging(LogLevel.Information)
        .build();
    };

    /**
     * Helper that attempts invoking group join with both string and integer arguments
     * to prevent ASP.NET Core SignalR JSON type mismatch errors.
     */
    const invokeJoinGroup = async (conn: HubConnection, targetId: string | number) => {
      const strVal = String(targetId);
      const numVal = Number(targetId);

      // Try JoinTicketGroup with string
      try {
        await conn.invoke("JoinTicketGroup", strVal);
        return true;
      } catch {
        // Fallback 1: JoinTicketGroup with integer
        if (!isNaN(numVal) && numVal > 0) {
          try {
            await conn.invoke("JoinTicketGroup", numVal);
            return true;
          } catch {
            // Fallback 2: JoinGroup with string
            try {
              await conn.invoke("JoinGroup", strVal);
              return true;
            } catch {
              // Ignore if group join method not found
            }
          }
        }
      }
      return false;
    };

    // ---------- Group subscription ----------
    const subscribeToUserTicketGroups = async (conn: HubConnection) => {
      if (conn.state !== HubConnectionState.Connected) {
        return;
      }

      try {
        // 1. Join user's personal channel (accountId)
        if (currentUser.accountId) {
          const userKey = `user_${currentUser.accountId}`;
          if (!joinedGroupsRef.current.has(userKey)) {
            await invokeJoinGroup(conn, currentUser.accountId);
            joinedGroupsRef.current.add(userKey);
            console.log(`[GlobalSignalR] Subscribed to user channel: ${currentUser.accountId}`);
          }
        }

        // 2. Join user group channel if present
        if (currentUser.userGroupId) {
          const groupKey = `usergroup_${currentUser.userGroupId}`;
          if (!joinedGroupsRef.current.has(groupKey)) {
            await invokeJoinGroup(conn, currentUser.userGroupId);
            joinedGroupsRef.current.add(groupKey);
          }
        }

        // 3. Fetch active ticket IDs for this user/responder and join their groups
        let ticketIds: number[] = [];
        try {
          ticketIds = await getUserTicketIdsAction();
        } catch (fetchErr) {
          console.error("[GlobalSignalR] getUserTicketIdsAction error:", fetchErr);
          return;
        }

        let newJoins = 0;
        for (const tid of ticketIds) {
          if (isCancelled) break;
          const tidKey = `ticket_${tid}`;
          if (!joinedGroupsRef.current.has(tidKey)) {
            await invokeJoinGroup(conn, tid);
            joinedGroupsRef.current.add(tidKey);
            newJoins++;
          }
        }

        if (newJoins > 0 || ticketIds.length > 0) {
          console.log(
            `[GlobalSignalR] Active ticket rooms: ${ticketIds.length} tickets (${newJoins} newly joined)`,
          );
        }
      } catch (err) {
        console.warn("[GlobalSignalR] Group subscription error:", err);
      }
    };

    // ---------- Event handlers ----------
    const registerGlobalHandlers = (conn: HubConnection) => {
      // 1. Listen for new replies across tickets
      const handleReply = (evtName: string, raw: unknown) => {
        console.log(`[GlobalSignalR] 🔔 Live reply received via '${evtName}':`, raw);
        if (!raw) return;

        // If array of replies is received, process the latest item
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
        console.log(`[GlobalSignalR] 🎫 Ticket created event via '${evtName}':`, raw);
        if (!raw || typeof raw !== "object") return;
        const data = raw as Record<string, unknown>;
        const ticketId = Number(data.ticketId ?? data.TicketId ?? data.id ?? data.Id ?? 0);
        const subject = String(
          data.ticketSubject ?? data.TicketSubject ?? data.subject ?? data.Subject ?? "تیکت جدید در سامانه ایجاد شد",
        );
        const creator = String(
          data.accountFullName ?? data.AccountFullName ?? data.creator ?? data.Creator ?? "کاربر",
        );

        // Automatically join this newly created ticket group
        if (ticketId > 0 && conn.state === HubConnectionState.Connected) {
          const tidKey = `ticket_${ticketId}`;
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

      // 3. Listen for status / closure changes
      const handleStatusChange = (evtName: string, raw: unknown) => {
        console.log(`[GlobalSignalR] 🔄 Ticket status event via '${evtName}':`, raw);
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

      // Register ALL event aliases to ensure compatibility with various SignalR hub naming conventions
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

    // ---------- Connection lifecycle ----------
    const setupConnection = (conn: HubConnection) => {
      registerGlobalHandlers(conn);

      conn.onreconnected(() => {
        if (!isCancelled) {
          console.log("[GlobalSignalR] ♻️ Reconnected. Re-subscribing ticket groups...");
          joinedGroupsRef.current.clear();
          subscribeToUserTicketGroups(conn).catch(() => {});
        }
      });

      conn.onreconnecting((err) => {
        console.warn("[GlobalSignalR] ⚠️ Reconnecting...", err?.message);
      });

      conn.onclose((err) => {
        if (!isCancelled) {
          console.warn("[GlobalSignalR] ❌ Connection closed.", err?.message);
        }
      });
    };

    const start = async () => {
      // Attempt 1: primary Hub URL
      let conn = buildConnection(primaryHubUrl);
      connectionRef.current = conn;
      setupConnection(conn);

      try {
        await conn.start();
        if (isCancelled) {
          conn.stop().catch(() => {});
          return;
        }
        console.log("[GlobalSignalR] ✅ Connected to", primaryHubUrl);
        await subscribeToUserTicketGroups(conn);
        return;
      } catch (err) {
        if (isCancelled) return;
        const errStr = err instanceof Error ? err.message : String(err);
        console.warn("[GlobalSignalR] Primary connection failed:", errStr);
      }

      // Attempt 2: Proxy fallback /ticketHub
      if (primaryHubUrl.startsWith("http")) {
        try {
          console.log("[GlobalSignalR] Trying proxy fallback /ticketHub...");
          conn = buildConnection("/ticketHub");
          connectionRef.current = conn;
          setupConnection(conn);
          await conn.start();
          if (isCancelled) {
            conn.stop().catch(() => {});
            return;
          }
          console.log("[GlobalSignalR] ✅ Connected via proxy /ticketHub");
          await subscribeToUserTicketGroups(conn);
          return;
        } catch (err2) {
          if (isCancelled) return;
          const errStr = err2 instanceof Error ? err2.message : String(err2);
          console.warn("[GlobalSignalR] Proxy connection also failed:", errStr);
        }
      }

      console.error("[GlobalSignalR] ❌ All connection attempts failed.");
    };

    start();

    // Periodically refresh group subscriptions every 30 seconds
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
      if (conn && conn.state !== HubConnectionState.Disconnected) {
        conn.stop().catch(() => {});
      }
    };
  }, [currentUser, token, addNotification]);

  return null;
}
