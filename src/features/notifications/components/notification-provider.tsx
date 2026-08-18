"use client";

import { type ReactNode, useEffect } from "react";

import { GlobalSignalRListener } from "@/features/notifications/components/global-signalr-listener";
import { NotificationToastAlert } from "@/features/notifications/components/notification-toast-alert";
import { realtimeClient } from "@/features/notifications/services/realtime-client";
import { soundSynthesizer } from "@/features/notifications/services/sound-synthesizer";
import { useNotificationStore } from "@/features/notifications/stores/notification-store";
import type { User } from "@/types/ticket";

interface NotificationProviderProps {
  children: ReactNode;
  currentUser?: User | null;
  token?: string | null;
}

export function NotificationProvider({
  children,
  currentUser,
  token,
}: NotificationProviderProps) {
  const loadFromStorage = useNotificationStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
  }, [loadFromStorage]);

  useEffect(() => {
    if (currentUser?.accountId) {
      soundSynthesizer.unlock();
      realtimeClient.connect();
      return () => {
        realtimeClient.disconnect();
      };
    }
  }, [currentUser?.accountId]);

  return (
    <>
      <GlobalSignalRListener currentUser={currentUser} token={token} />
      {children}
      <NotificationToastAlert />
    </>
  );
}
