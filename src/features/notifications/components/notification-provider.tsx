"use client";

import { type ReactNode,useEffect } from "react";

import { NotificationToastAlert } from "@/features/notifications/components/notification-toast-alert";
import { registerNotificationServiceWorker } from "@/features/notifications/services/browser-notification";
import { realtimeClient } from "@/features/notifications/services/realtime-client";
import { useNotificationStore } from "@/features/notifications/stores/notification-store";

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const loadInitialData = useNotificationStore((s) => s.loadInitialData);

  useEffect(() => {
    // 1. Register service worker for native notification clicks
    registerNotificationServiceWorker();

    // 2. Load persistent notifications
    loadInitialData();

    // 3. Connect to LAN SSE stream
    realtimeClient.connect();

    // 4. Reconnect or re-sync when tab regains focus
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        realtimeClient.connect();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      realtimeClient.disconnect();
    };
  }, [loadInitialData]);

  return (
    <>
      {children}
      <NotificationToastAlert />
    </>
  );
}
