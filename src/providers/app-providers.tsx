import type { ReactNode } from "react";

import { ThemeProvider } from "@/components/providers/theme-provider";
import { NotificationProvider } from "@/features/notifications/components/notification-provider";
import type { User } from "@/types/ticket";

interface AppProvidersProps {
  children: ReactNode;
  currentUser?: User | null;
  token?: string | null;
}

/**
 * Single composition root for every client-side provider.
 * Add new providers here (query client, auth context, etc.) instead of
 * nesting them ad hoc across the app.
 */
export function AppProviders({ children, currentUser, token }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <NotificationProvider currentUser={currentUser} token={token}>
        {children}
      </NotificationProvider>
    </ThemeProvider>
  );
}
