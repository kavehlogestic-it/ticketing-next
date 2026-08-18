"use client";

import { ArrowRight, MessageSquare, X } from "lucide-react";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";
import { useNotificationStore } from "@/features/notifications/stores/notification-store";
import { Link } from "@/i18n/navigation";

export function NotificationToastAlert() {
  const activeToast = useNotificationStore((s) => s.activeToast);
  const dismissToast = useNotificationStore((s) => s.dismissToast);
  const markAsRead = useNotificationStore((s) => s.markAsRead);

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!activeToast) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 6000);
    return () => clearTimeout(timer);
  }, [activeToast, dismissToast]);

  if (!activeToast) return null;

  return (
    <div className="fixed top-5 end-5 z-50 max-w-sm w-full animate-in slide-in-from-top-5 fade-in duration-300 pointer-events-auto">
      <div className="flex flex-col gap-2.5 rounded-2xl border border-primary/30 bg-card/95 backdrop-blur-md p-4 shadow-2xl text-foreground ring-1 ring-black/5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs">
              <MessageSquare className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h4 className="text-xs font-bold text-foreground truncate">
                  {activeToast.title}
                </h4>
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
              </div>
              {activeToast.actorName ? (
                <span className="text-[10px] text-muted-foreground block">
                  ارسال شده توسط {activeToast.actorName}
                </span>
              ) : null}
            </div>
          </div>

          <button
            type="button"
            onClick={dismissToast}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md transition-colors"
            title="بستن"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed ps-1">
          {activeToast.message}
        </p>

        {activeToast.ticketId ? (
          <div className="flex items-center justify-between pt-2 border-t border-border/40">
            <span className="text-[10px] text-muted-foreground font-mono">
              تیکت #{activeToast.ticketId}
            </span>
            <Button
              asChild
              size="sm"
              variant="default"
              className="h-7 text-[11px] gap-1.5 px-3 rounded-lg shadow-xs"
              onClick={() => {
                markAsRead(activeToast.id);
                dismissToast();
              }}
            >
              <Link href={`/tickets/${activeToast.ticketId}`}>
                <span>مشاهده تیکت</span>
                <ArrowRight className="h-3 w-3 rtl:rotate-180" />
              </Link>
            </Button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
