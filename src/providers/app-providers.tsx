import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { NotificationProvider } from "@/features/notifications/components/notification-provider";
import { PWAInstallPrompt } from "@/features/pwa/components/pwa-install-prompt";
import { PWAProvider } from "@/features/pwa/components/pwa-provider";
import type { User } from "@/types/ticket";

interface AppProvidersProps {
  children: ReactNode;
  currentUser?: User | null;
  token?: string | null;
}

/**
 * Single composition root for every client-side provider.
 * Integrates Theme, Real-time Notifications, and PWA capabilities.
 */
export function AppProviders({ children, currentUser, token }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <PWAProvider>
        <NotificationProvider currentUser={currentUser} token={token}>
          {children}
        </NotificationProvider>
        <PWAInstallPrompt />
      </PWAProvider>
    </ThemeProvider>
  );
}
