"use client";

import {
  HttpTransportType,
  type HubConnection,
  HubConnectionBuilder,
  HubConnectionState,
  LogLevel,
} from "@microsoft/signalr";

import { API_BASE_URL, API_ENDPOINTS } from "@/constants/api-urls";
import type { TicketReply } from "@/types/ticket";

export type SignalRStatus =
  | "connecting"
  | "connected"
  | "reconnecting"
  | "disconnected"
  | "error";

export function normalizeTicketReply(raw: Record<string, unknown>): TicketReply {
  return {
    replyId: Number(raw.replyId ?? raw.ReplyId ?? raw.id ?? raw.Id ?? Date.now()),
    text: String(raw.text ?? raw.Text ?? raw.message ?? raw.Message ?? ""),
    accountId: Number(raw.accountId ?? raw.AccountId ?? raw.userId ?? raw.UserId ?? 0),
    accountFullName: String(
      raw.accountFullName ??
        raw.AccountFullName ??
        raw.senderName ??
        raw.SenderName ??
        raw.userName ??
        raw.UserName ??
        "",
    ),
    roleId: Number(raw.roleId ?? raw.RoleId ?? 2),
    ticketReplyAttachment: (raw.ticketReplyAttachment ??
      raw.TicketReplyAttachment ??
      raw.attachment ??
      raw.Attachment ??
      null) as string | null,
    replyDate: String(
      raw.replyDate ??
        raw.ReplyDate ??
        raw.createdAt ??
        raw.CreatedAt ??
        new Date().toISOString(),
    ),
  };
}

export function normalizeRepliesList(rawList: unknown): TicketReply[] {
  if (!Array.isArray(rawList)) {
    if (rawList && typeof rawList === "object") {
      const possibleArray =
        (rawList as Record<string, unknown>).items ??
        (rawList as Record<string, unknown>).replies ??
        (rawList as Record<string, unknown>).data;
      if (Array.isArray(possibleArray)) {
        return possibleArray.map((item) => normalizeTicketReply(item as Record<string, unknown>));
      }
    }
    return [];
  }
  return rawList.map((item) => normalizeTicketReply(item as Record<string, unknown>));
}

export interface TicketHubSubscription {
  connection: HubConnection;
  disconnect: () => Promise<void>;
}

export function subscribeToTicketSignalR(
  rawTicketId: string | number,
  onReplyReceived: (reply: TicketReply) => void,
  token?: string | null,
  onStatusChange?: (status: SignalRStatus, errorDetail?: string) => void,
  onRepliesListReceived?: (replies: TicketReply[]) => void,
): TicketHubSubscription {
  const ticketId = String(rawTicketId);
  const targetIdNum = Number(rawTicketId);

  const primaryHubUrl =
    process.env.NEXT_PUBLIC_SIGNALR_URL ||
    API_ENDPOINTS.TICKETS.SIGNALR_HUB ||
    `${API_BASE_URL}/ticketHub`;

  onStatusChange?.("connecting");

  const silentLogger = {
    log: (logLevel: LogLevel, message: string) => {
      if (
        message.includes("stopped during negotiation") ||
        message.includes("The connection was stopped") ||
        message.includes("Connection closed with an error") ||
        message.includes("Server returned an error on close") ||
        message.includes("negotiation") ||
        message.includes("abort") ||
        message.includes("canceled") ||
        message.includes("stopped")
      ) {
        return;
      }
      if (logLevel >= LogLevel.Warning) {
        console.warn("[SignalR]", message);
      }
    },
  };

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

  let connection = buildConnection(primaryHubUrl);

  const registerListeners = (conn: HubConnection) => {
    // Single reply handler
    const handleIncomingReply = (evtName: string, reply: unknown) => {
      console.log(`[SignalR] Live payload received via '${evtName}':`, reply);
      if (Array.isArray(reply)) {
        const list = normalizeRepliesList(reply);
        onRepliesListReceived?.(list);
        return;
      }
      try {
        const normalized = normalizeTicketReply(reply as Record<string, unknown>);
        onReplyReceived(normalized);
      } catch (err) {
        console.error("Error parsing live reply:", err);
      }
    };

    // Full replies list handler
    const handleIncomingList = (evtName: string, repliesList: unknown) => {
      console.log(`[SignalR] 📜 Live replies list received via '${evtName}':`, repliesList);
      try {
        const normalizedList = normalizeRepliesList(repliesList);
        if (normalizedList.length > 0) {
          onRepliesListReceived?.(normalizedList);
        }
      } catch (err) {
        console.error("Error parsing replies list:", err);
      }
    };

    const SINGLE_EVENT_NAMES = [
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

    for (const evt of SINGLE_EVENT_NAMES) {
      conn.on(evt, (payload: unknown) => handleIncomingReply(evt, payload));
    }

    const LIST_EVENT_NAMES = [
      "ReceiveTicketReplies",
      "receiveTicketReplies",
      "ReceiveReplyList",
      "receiveReplyList",
      "ReceiveReplies",
      "receiveReplies",
      "LoadTicketReplies",
      "loadTicketReplies",
      "GetTicketReplies",
      "getTicketReplies",
    ];

    for (const evt of LIST_EVENT_NAMES) {
      conn.on(evt, (payload: unknown) => handleIncomingList(evt, payload));
    }
  };

  registerListeners(connection);

  let isCancelled = false;
  let startPromise: Promise<void> | null = null;

  const joinGroupAndFetch = async (conn: HubConnection) => {
    if (isNaN(targetIdNum) || targetIdNum <= 0) return;

    try {
      // Backend expects integer ticketId parameter (int ticketId)
      const res = await conn.invoke("JoinTicketGroup", targetIdNum);
      console.log(`[SignalR] Joined ticket room #${targetIdNum}`, res);
      if (res) {
        const normalized = normalizeRepliesList(res);
        if (normalized.length > 0) {
          onRepliesListReceived?.(normalized);
        }
      }
    } catch {
      // Fallback: try as string if backend uses string parameter
      try {
        const res = await conn.invoke("JoinTicketGroup", ticketId);
        if (res) {
          const normalized = normalizeRepliesList(res);
          if (normalized.length > 0) {
            onRepliesListReceived?.(normalized);
          }
        }
      } catch {
        // Ignore join error
      }
    }
  };

  const startConnection = async () => {
    try {
      startPromise = connection.start();
      await startPromise;

      if (isCancelled) {
        await connection.stop();
        return;
      }

      console.log("Connected to SignalR!");
      await joinGroupAndFetch(connection);

      if (!isCancelled) {
        onStatusChange?.("connected");
      }
    } catch (err) {
      if (isCancelled) return;

      // If primary direct URL failed and was cross-origin, try proxy fallback "/ticketHub"
      if (primaryHubUrl.startsWith("http") && !isCancelled) {
        try {
          console.log("[SignalR] Trying proxy fallback /ticketHub...");
          connection = buildConnection("/ticketHub");
          registerListeners(connection);
          startPromise = connection.start();
          await startPromise;
          if (isCancelled) {
            await connection.stop();
            return;
          }
          await joinGroupAndFetch(connection);
          onStatusChange?.("connected");
          return;
        } catch {
          // Ignore proxy fallback failure and proceed to report original error
        }
      }

      const errStr = err instanceof Error ? err.message : String(err);
      if (errStr.includes("stopped during negotiation") || errStr.includes("abort")) {
        return;
      }

      console.error("SignalR start error:", errStr);
      onStatusChange?.("error", errStr);
    }
  };

  startConnection();

  // Re-join ticket group on reconnect
  connection.onreconnected(() => {
    if (isCancelled) return;
    console.log("Reconnected to SignalR, rejoining group...");
    joinGroupAndFetch(connection).catch(() => {});
    onStatusChange?.("connected");
  });

  connection.onreconnecting(() => {
    if (!isCancelled) {
      onStatusChange?.("reconnecting");
    }
  });

  connection.onclose((err) => {
    if (isCancelled) return;
    if (err) {
      onStatusChange?.("error", err.message);
    } else {
      onStatusChange?.("disconnected");
    }
  });

  const disconnect = async () => {
    isCancelled = true;
    try {
      if (startPromise) {
        await startPromise.catch(() => {});
      }
      if (connection.state !== HubConnectionState.Disconnected) {
        await connection.stop();
        console.log("SignalR disconnected.");
      }
    } catch {
      // Clean disconnect
    }
  };

  return {
    connection,
    disconnect,
  };
}
