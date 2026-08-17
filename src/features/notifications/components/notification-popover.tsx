"use client";

import {
  BellRing,
  CheckCheck,
  CheckCircle2,
  Clock,
  Layers,
  MessageSquare,
  Plus,
  RefreshCw,
  Settings,
  Ticket,
  UserCheck,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
} from "@/features/notifications/services/browser-notification";
import { useNotificationStore } from "@/features/notifications/stores/notification-store";
import type { NotificationItem, NotificationType } from "@/features/notifications/types/notification";
import { Link } from "@/i18n/navigation";

interface NotificationPopoverProps {
  onClose: () => void;
}

function getNotificationIcon(type: NotificationType) {
  switch (type) {
    case "ticket.created":
      return <Plus className="h-4 w-4 text-emerald-500" />;
    case "ticket.reply.created":
      return <MessageSquare className="h-4 w-4 text-blue-500" />;
    case "ticket.status.changed":
      return <RefreshCw className="h-4 w-4 text-amber-500" />;
    case "ticket.assigned":
      return <UserCheck className="h-4 w-4 text-purple-500" />;
    case "ticket.closed":
      return <CheckCircle2 className="h-4 w-4 text-slate-500" />;
    case "ticket.group.created":
      return <Layers className="h-4 w-4 text-indigo-500" />;
    default:
      return <Ticket className="h-4 w-4 text-primary" />;
  }
}

function formatTimeAgo(
  isoString: string,
  t: (key: string, values?: Record<string, string | number | Date>) => string,
): string {
  const diff = Math.max(0, Math.floor((Date.now() - new Date(isoString).getTime()) / 1000));

  if (diff < 60) return t("justNow");
  const minutes = Math.floor(diff / 60);
  if (minutes < 60) return t("minutesAgo", { count: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return t("hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  return t("daysAgo", { count: days });
}

export function NotificationPopover({ onClose }: NotificationPopoverProps) {
  const t = useTranslations("notifications");
  const [tab, setTab] = useState<"all" | "unread">("all");
  const [permissionState, setPermissionState] = useState<NotificationPermission>("granted");

  const {
    notifications,
    unreadCount,
    isLoading,
    error,
    markAsRead,
    markAllAsRead,
    setSettingsOpen,
    loadInitialData,
    updatePreferences,
  } = useNotificationStore();

  useEffect(() => {
    if (isNotificationSupported()) {
      setPermissionState(getNotificationPermission());
    }
  }, []);

  const handleEnableDesktop = async () => {
    const res = await requestNotificationPermission();
    setPermissionState(res);
    if (res === "granted") {
      updatePreferences({ desktopNotifications: true });
    }
  };

  const filteredNotifications =
    tab === "unread" ? notifications.filter((n) => !n.isRead) : notifications;

  const handleNotificationClick = (item: NotificationItem) => {
    if (!item.isRead) {
      markAsRead(item.id);
    }
    onClose();
  };

  return (
    <div className="flex flex-col h-[480px] max-h-[80vh] w-[340px] sm:w-[380px] rounded-2xl border border-border bg-card shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
        <div className="flex items-center gap-2">
          <h3 className="font-bold text-sm text-foreground">{t("title")}</h3>
          {unreadCount > 0 ? (
            <Badge variant="default" className="text-[10px] h-4.5 px-1.5 font-mono">
              {unreadCount}
            </Badge>
          ) : null}
        </div>

        <div className="flex items-center gap-1">
          {unreadCount > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsRead()}
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
              title={t("markAllAsRead")}
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t("markAllAsRead")}</span>
            </Button>
          ) : null}

          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              setSettingsOpen(true);
              onClose();
            }}
            className="h-7 w-7 text-muted-foreground hover:text-foreground"
            title={t("settings.title")}
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Soft Permission Request Banner if not granted */}
      {permissionState === "default" ? (
        <div className="flex items-center justify-between gap-2 bg-primary/10 px-3.5 py-2 border-b border-primary/20 text-xs">
          <div className="flex items-center gap-2 min-w-0">
            <BellRing className="h-4 w-4 text-primary shrink-0 animate-bounce" />
            <span className="text-foreground text-[11px] font-medium truncate">
              {t("settings.requestPermission")}
            </span>
          </div>
          <Button
            size="sm"
            onClick={handleEnableDesktop}
            className="h-6 text-[10px] px-2 shadow-xs shrink-0"
          >
            {t("settings.requestPermission")}
          </Button>
        </div>
      ) : null}

      {/* Tabs */}
      <div className="flex items-center border-b px-4 bg-muted/10 text-xs">
        <button
          type="button"
          onClick={() => setTab("all")}
          className={`py-2 px-3 border-b-2 font-medium transition-colors ${
            tab === "all"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("all")} ({notifications.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("unread")}
          className={`py-2 px-3 border-b-2 font-medium transition-colors ${
            tab === "unread"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          {t("unread")} ({unreadCount})
        </button>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto divide-y divide-border/60">
        {isLoading && notifications.length === 0 ? (
          <div className="p-4 space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3 animate-pulse">
                <div className="h-8 w-8 rounded-lg bg-muted/60 shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-muted/60 rounded-sm w-3/4" />
                  <div className="h-3 bg-muted/40 rounded-sm w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center p-8 text-center space-y-3">
            <p className="text-xs text-destructive">{error}</p>
            <Button size="sm" variant="outline" onClick={() => loadInitialData()}>
              {t("retry")}
            </Button>
          </div>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center text-muted-foreground space-y-2">
            <Clock className="h-8 w-8 text-muted-foreground/40" />
            <p className="text-xs font-medium">
              {tab === "unread" ? t("noUnreadNotifications") : t("noNotifications")}
            </p>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <Link
              key={item.id}
              href={`/tickets/${item.ticketId}`}
              onClick={() => handleNotificationClick(item)}
              className={`flex items-start gap-3 p-3.5 transition-colors hover:bg-muted/40 relative group ${
                !item.isRead ? "bg-primary/5 dark:bg-primary/10" : ""
              }`}
            >
              {/* Unread indicator bar */}
              {!item.isRead ? (
                <div className="absolute start-1 top-4 bottom-4 w-1 rounded-full bg-primary" />
              ) : null}

              {/* Event Type Icon */}
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-background border border-border shadow-2xs mt-0.5">
                {getNotificationIcon(item.type)}
              </div>

              {/* Body */}
              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center justify-between gap-1">
                  <p className="text-xs font-semibold text-foreground truncate">
                    {item.title}
                  </p>
                  <span className="text-[10px] text-muted-foreground font-mono shrink-0">
                    {formatTimeAgo(item.createdAt, t)}
                  </span>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {item.message}
                </p>

                {item.actorName ? (
                  <p className="text-[10px] text-primary/80 font-medium truncate pt-0.5">
                    {item.actorName}
                  </p>
                ) : null}
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
