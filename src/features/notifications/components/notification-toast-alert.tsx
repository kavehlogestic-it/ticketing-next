"use client";

import { Bell, ExternalLink, X } from "lucide-react";
import { useEffect, useState } from "react";

import { useNotificationStore } from "@/features/notifications/stores/notification-store";
import type { NotificationItem } from "@/features/notifications/types/notification";
import { Link } from "@/i18n/navigation";

export function NotificationToastAlert() {
  const [activeToast, setActiveToast] = useState<NotificationItem | null>(null);
  const notifications = useNotificationStore((s) => s.notifications);

  // When a new unread notification arrives (first item in array), show active toast
  useEffect(() => {
    if (notifications.length > 0) {
      const latest = notifications[0];
      if (latest && !latest.isRead) {
        setActiveToast(latest);
        const timer = setTimeout(() => {
          setActiveToast((curr) => (curr?.id === latest.id ? null : curr));
        }, 7000);
        return () => clearTimeout(timer);
      }
    }
  }, [notifications]);

  if (!activeToast) return null;

  return (
    <div className="fixed top-20 end-4 z-50 max-w-sm w-full animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
      <div className="flex items-start gap-3 rounded-2xl border border-primary/30 bg-card/95 p-4 shadow-2xl backdrop-blur-md ring-1 ring-primary/20">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
          <Bell className="h-4 w-4" />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h4 className="text-xs font-bold text-foreground truncate">
              {activeToast.title}
            </h4>
            <button
              type="button"
              onClick={() => setActiveToast(null)}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <p className="mt-1 text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {activeToast.message}
          </p>

          <div className="mt-2.5 flex items-center justify-end">
            <Link
              href={`/tickets/${activeToast.ticketId}`}
              onClick={() => setActiveToast(null)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
            >
              <span>مشاهده تیکت</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
