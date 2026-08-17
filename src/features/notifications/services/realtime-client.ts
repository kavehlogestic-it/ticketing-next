"use client";

import { useNotificationStore } from "@/features/notifications/stores/notification-store";
import type { NotificationItem } from "@/features/notifications/types/notification";

class RealtimeNotificationClient {
  private eventSource: EventSource | null = null;
  private reconnectAttempts = 0;
  private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
  private fallbackPollInterval: ReturnType<typeof setInterval> | null = null;
  private isExplicitlyClosed = false;
  private isConnecting = false;

  public connect(): void {
    if (typeof window === "undefined") return;
    if (this.eventSource && this.eventSource.readyState === EventSource.OPEN) return;
    if (this.isConnecting) return;

    this.isExplicitlyClosed = false;
    this.isConnecting = true;

    useNotificationStore.getState().setConnectionStatus("connecting");

    try {
      this.eventSource = new EventSource("/api/notifications/stream");

      this.eventSource.onopen = () => {
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        useNotificationStore.getState().setConnectionStatus("connected");

        // Clear fallback polling since real-time stream is live
        if (this.fallbackPollInterval) {
          clearInterval(this.fallbackPollInterval);
          this.fallbackPollInterval = null;
        }

        // Catch up on initial/missed notifications
        useNotificationStore.getState().loadInitialData();
      };

      this.eventSource.onmessage = (event) => {
        try {
          if (!event.data || event.data === ": keep-alive") return;
          const parsed = JSON.parse(event.data);

          if (parsed.type === "notification.created" && parsed.data) {
            useNotificationStore.getState().addRealtimeNotification(parsed.data as NotificationItem);
          }
        } catch (err) {
          console.debug("Failed to parse real-time event:", err);
        }
      };

      this.eventSource.onerror = () => {
        this.isConnecting = false;
        if (this.eventSource) {
          this.eventSource.close();
          this.eventSource = null;
        }

        if (!this.isExplicitlyClosed) {
          this.handleDisconnect();
        }
      };
    } catch {
      this.isConnecting = false;
      this.handleDisconnect();
    }
  }

  private handleDisconnect(): void {
    const store = useNotificationStore.getState();
    store.setConnectionStatus("disconnected");

    // Enable fallback polling on LAN if SSE connection is down
    if (!this.fallbackPollInterval) {
      this.fallbackPollInterval = setInterval(() => {
        useNotificationStore.getState().loadInitialData();
      }, 15000);
    }

    // Exponential backoff with jitter: min 2s, max 30s
    this.reconnectAttempts++;
    const baseDelay = Math.min(30000, 2000 * Math.pow(1.5, Math.min(this.reconnectAttempts, 6)));
    const jitter = Math.random() * 1500;
    const delay = baseDelay + jitter;

    store.setConnectionStatus("reconnecting");

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      if (!this.isExplicitlyClosed) {
        this.connect();
      }
    }, delay);
  }

  public disconnect(): void {
    this.isExplicitlyClosed = true;
    this.isConnecting = false;

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.fallbackPollInterval) {
      clearInterval(this.fallbackPollInterval);
      this.fallbackPollInterval = null;
    }

    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }

    useNotificationStore.getState().setConnectionStatus("disconnected");
  }
}

export const realtimeClient = new RealtimeNotificationClient();
