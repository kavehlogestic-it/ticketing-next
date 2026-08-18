"use client";

import { type ReactNode, useEffect } from "react";

import { GlobalSignalRListener } from "@/features/notifications/components/global-signalr-listener";
import { NotificationToastAlert } from "@/features/notifications/components/notification-toast-alert";
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

  return (
    <>
      <GlobalSignalRListener currentUser={currentUser} token={token} />
      {children}
      <NotificationToastAlert />
    </>
  );
}
