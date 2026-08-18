"use client";

import { useNotificationStore } from "@/features/notifications/stores/notification-store";
import type { AppNotification } from "@/features/notifications/types/notification";

class RealtimeNotificationClient {
  private eventSource: EventSource | null = null;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private isExplicitlyClosed = false;

  public connect(): void {
    if (typeof window === "undefined") return;
    if (this.eventSource && this.eventSource.readyState === EventSource.OPEN) return;

    this.isExplicitlyClosed = false;

    try {
      this.eventSource = new EventSource("/api/notifications/stream");

      this.eventSource.onopen = () => {
        console.log("[SSE Realtime] ✅ Connected to /api/notifications/stream");
      };

      this.eventSource.onmessage = (event) => {
        try {
          if (!event.data || event.data === ": keep-alive") return;
          const parsed = JSON.parse(event.data);

          if (parsed.type === "notification.created" && parsed.data) {
            console.log("[SSE Realtime] 🔔 Notification received:", parsed.data);
            useNotificationStore.getState().addNotification(parsed.data as AppNotification);
          }
        } catch (err) {
          console.debug("[SSE Realtime] Failed to parse event:", err);
        }
      };

      this.eventSource.onerror = () => {
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }

        if (!this.isExplicitlyClosed) {
          this.reconnect();
        }
      };
    } catch (err) {
      console.warn("[SSE Realtime] Connect error:", err);
      this.reconnect();
    }
  }

  private reconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    this.reconnectTimeout = setTimeout(() => {
      if (!this.isExplicitlyClosed) {
        this.connect();
      }
    }, 4000);
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }
}

export const realtimeClient = new RealtimeNotificationClient();
