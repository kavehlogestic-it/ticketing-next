"use client";

import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { NotificationPopover } from "@/features/notifications/components/notification-popover";
import { NotificationSettingsDialog } from "@/features/notifications/components/notification-settings-dialog";
import { useNotificationStore } from "@/features/notifications/stores/notification-store";

export function NotificationBell() {
  const t = useTranslations("notifications");
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const { unreadCount, connectionStatus } = useNotificationStore();

  // Close popover when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const getConnectionDotClass = () => {
    switch (connectionStatus) {
      case "connected":
        return "bg-emerald-500 ring-emerald-500/20";
      case "connecting":
      case "reconnecting":
        return "bg-amber-500 ring-amber-500/20 animate-pulse";
      case "disconnected":
      default:
        return "bg-slate-400 ring-slate-400/20";
    }
  };

  return (
    <>
      <div ref={containerRef} className="relative inline-block">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsOpen(!isOpen)}
          aria-label={t("title")}
          className="relative h-9 w-9 text-muted-foreground hover:text-foreground rounded-full"
        >
          <Bell className="h-4 w-4" />

          {/* Unread count badge */}
          {unreadCount > 0 ? (
            <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground ring-2 ring-background font-mono animate-in zoom-in-50">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}

          {/* LAN Connection indicator dot */}
          <span
            className={`absolute bottom-1 end-1 h-2 w-2 rounded-full ring-2 ${getConnectionDotClass()}`}
            title={t(`connection.${connectionStatus}` as const)}
          />
        </Button>

        {/* Popover Dropdown */}
        {isOpen ? (
          <div className="absolute end-0 top-full mt-2 z-50">
            <NotificationPopover onClose={() => setIsOpen(false)} />
          </div>
        ) : null}
      </div>

      {/* Settings Modal */}
      <NotificationSettingsDialog />
    </>
  );
}
