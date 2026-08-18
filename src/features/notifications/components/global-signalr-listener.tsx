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
  const connectionRef = useRef<HubConnection | null>(null);
  const joinedGroupsRef = useRef<Set<string>>(new Set());
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!currentUser) return;

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

    // ---------- Group subscription ----------
    const subscribeToUserTicketGroups = async (conn: HubConnection) => {
      if (conn.state !== HubConnectionState.Connected) {
        console.warn("[GlobalSignalR] Skipping group join — not connected (state:", conn.state, ")");
        return;
      }

      try {
        // 1. Join user's individual channel (accountId)
        if (currentUser.accountId) {
          const userGroupId = String(currentUser.accountId);
          if (!joinedGroupsRef.current.has(userGroupId)) {
            try {
              await conn.invoke("JoinTicketGroup", userGroupId);
              joinedGroupsRef.current.add(userGroupId);
              console.log(`[GlobalSignalR] Joined user channel: ${userGroupId}`);
            } catch (e) {
              console.warn("[GlobalSignalR] Failed to join user channel:", userGroupId, e);
            }
          }
        }

        // 2. Fetch all active ticket IDs for this user and join their groups
        let ticketIds: number[] = [];
        try {
          ticketIds = await getUserTicketIdsAction();
        } catch (fetchErr) {
          console.error("[GlobalSignalR] getUserTicketIdsAction failed:", fetchErr);
          return;
        }

        let newJoins = 0;
        for (const tid of ticketIds) {
          if (isCancelled) break;
          const groupId = String(tid);
          if (!joinedGroupsRef.current.has(groupId)) {
            try {
              await conn.invoke("JoinTicketGroup", groupId);
              joinedGroupsRef.current.add(groupId);
              newJoins++;
            } catch {
              // Individual group join failures are not critical
            }
          }
        }
        console.log(
          `[GlobalSignalR] Ticket groups: ${ticketIds.length} total, ${newJoins} newly joined, ${joinedGroupsRef.current.size} tracked`,
        );
      } catch (err) {
        console.warn("[GlobalSignalR] Group subscription error:", err);
      }
    };

    // ---------- Event handlers ----------
    const registerGlobalHandlers = (conn: HubConnection) => {
      // 1. Listen for new replies across tickets
      const handleReply = (evtName: string, raw: unknown) => {
        console.log(`[GlobalSignalR] Live reply received via '${evtName}':`, raw);
        if (!raw || typeof raw !== "object" || Array.isArray(raw)) return;

        const data = raw as Record<string, unknown>;
        const senderId = Number(data.accountId ?? data.AccountId ?? data.userId ?? data.UserId ?? 0);
        const ticketId = Number(data.ticketId ?? data.TicketId ?? 0);
        const text = String(data.text ?? data.Text ?? data.message ?? data.Message ?? "\u067e\u06cc\u0627\u0645 \u062c\u062f\u06cc\u062f \u062f\u0631\u06cc\u0627\u0641\u062a \u0634\u062f");
        const senderName = String(
          data.accountFullName ??
            data.AccountFullName ??
            data.senderName ??
            data.SenderName ??
            data.userName ??
            "\u067e\u0634\u062a\u06cc\u0628\u0627\u0646\u06cc",
        );

        // Don't notify if the current user sent the reply
        if (senderId > 0 && senderId === currentUser.accountId) {
          return;
        }

        addNotification({
          type: "ticket.reply.created",
          title: ticketId > 0 ? `\u067e\u0627\u0633\u062e \u062c\u062f\u06cc\u062f \u062f\u0631 \u062a\u06cc\u06a9\u062a #${ticketId}` : "\u067e\u0627\u0633\u062e \u062c\u062f\u06cc\u062f \u0628\u0647 \u062a\u06cc\u06a9\u062a",
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
        const subject = String(data.ticketSubject ?? data.TicketSubject ?? data.subject ?? "\u062a\u06cc\u06a9\u062a \u062c\u062f\u06cc\u062f \u062f\u0631 \u0633\u0627\u0645\u0627\u0646\u0647 \u0627\u06cc\u062c\u0627\u062f \u0634\u062f");
        const creator = String(data.accountFullName ?? data.AccountFullName ?? data.creator ?? "\u06a9\u0627\u0631\u0628\u0631");

        // Automatically join this newly created ticket group
        if (ticketId > 0 && conn.state === HubConnectionState.Connected) {
          const groupId = String(ticketId);
          if (!joinedGroupsRef.current.has(groupId)) {
            conn.invoke("JoinTicketGroup", groupId).catch(() => {});
            joinedGroupsRef.current.add(groupId);
          }
        }

        addNotification({
          type: "ticket.created",
          title: ticketId > 0 ? `\u062a\u06cc\u06a9\u062a \u062c\u062f\u06cc\u062f #${ticketId}` : "\u062a\u06cc\u06a9\u062a \u062c\u062f\u06cc\u062f \u0627\u06cc\u062c\u0627\u062f \u0634\u062f",
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
        const status = String(data.status ?? data.Status ?? "\u062a\u063a\u06cc\u06cc\u0631 \u06cc\u0627\u0641\u062a");

        addNotification({
          type: "ticket.status.changed",
          title: ticketId > 0 ? `\u0648\u0636\u0639\u06cc\u062a \u062a\u06cc\u06a9\u062a #${ticketId} \u062a\u063a\u06cc\u06cc\u0631 \u06a9\u0631\u062f` : "\u062a\u063a\u06cc\u06cc\u0631 \u0648\u0636\u0639\u06cc\u062a \u062a\u06cc\u06a9\u062a",
          message: `\u0648\u0636\u0639\u06cc\u062a \u062c\u062f\u06cc\u062f: ${status}`,
          ticketId: ticketId > 0 ? ticketId : undefined,
        });
      };

      // Register event aliases — MUST match ALL aliases from signalr-ticket-hub.ts
      const REPLY_EVENTS = [
        "ReceiveTicketReply",
        "receiveTicketReply",
        "ReceiveReply",
        "receiveReply",
        "NewReply",
        "newReply",
        "ReceiveMessage",
        "receiveMessage",
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
          console.log("[GlobalSignalR] Reconnected. Re-subscribing ticket groups...");
          joinedGroupsRef.current.clear();
          subscribeToUserTicketGroups(conn).catch(() => {});
        }
      });

      conn.onreconnecting((err) => {
        console.warn("[GlobalSignalR] Reconnecting...", err?.message);
      });

      conn.onclose((err) => {
        if (!isCancelled) {
          console.warn("[GlobalSignalR] Connection closed.", err?.message);
        }
      });
    };

    const start = async () => {
      // Attempt 1: direct URL
      let conn = buildConnection(primaryHubUrl);
      connectionRef.current = conn;
      setupConnection(conn);

      try {
        await conn.start();
        if (isCancelled) { conn.stop().catch(() => {}); return; }
        console.log("[GlobalSignalR] Connected to", primaryHubUrl);
        await subscribeToUserTicketGroups(conn);
        return; // success
      } catch (err) {
        if (isCancelled) return;
        const errStr = err instanceof Error ? err.message : String(err);
        console.warn("[GlobalSignalR] Direct connection failed:", errStr);
      }

      // Attempt 2: proxy fallback /ticketHub (same-origin, avoids CORS)
      if (primaryHubUrl.startsWith("http")) {
        try {
          console.log("[GlobalSignalR] Trying proxy fallback /ticketHub...");
          conn = buildConnection("/ticketHub");
          connectionRef.current = conn;
          setupConnection(conn);
          await conn.start();
          if (isCancelled) { conn.stop().catch(() => {}); return; }
          console.log("[GlobalSignalR] Connected via proxy /ticketHub");
          await subscribeToUserTicketGroups(conn);
          return; // success
        } catch (err2) {
          if (isCancelled) return;
          const errStr = err2 instanceof Error ? err2.message : String(err2);
          console.warn("[GlobalSignalR] Proxy connection also failed:", errStr);
        }
      }

      console.error("[GlobalSignalR] All connection attempts failed. Notifications will not work.");
    };

    start();

    // Periodically refresh group subscriptions to pick up newly created/assigned tickets
    refreshIntervalRef.current = setInterval(() => {
      const conn = connectionRef.current;
      if (!isCancelled && conn && conn.state === HubConnectionState.Connected) {
        subscribeToUserTicketGroups(conn).catch(() => {});
      }
    }, 60_000);

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
