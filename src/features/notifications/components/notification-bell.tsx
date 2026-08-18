"use client";

import {
  Bell,
  CheckCheck,
  MessageSquare,
  Play,
  Settings,
  Sparkles,
  Trash2,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  getBrowserNotificationPermission,
  requestNotificationPermission,
} from "@/features/notifications/services/browser-notification";
import { soundSynthesizer } from "@/features/notifications/services/sound-synthesizer";
import { useNotificationStore } from "@/features/notifications/stores/notification-store";
import { Link } from "@/i18n/navigation";

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">("default");
  const popoverRef = useRef<HTMLDivElement>(null);

  const notifications = useNotificationStore((s) => s.notifications);
  const unreadCount = useNotificationStore((s) => s.unreadCount);
  const preferences = useNotificationStore((s) => s.preferences);
  const addNotification = useNotificationStore((s) => s.addNotification);
  const markAsRead = useNotificationStore((s) => s.markAsRead);
  const markAllAsRead = useNotificationStore((s) => s.markAllAsRead);
  const clearAll = useNotificationStore((s) => s.clearAll);
  const updatePreferences = useNotificationStore((s) => s.updatePreferences);
  const loadFromStorage = useNotificationStore((s) => s.loadFromStorage);

  useEffect(() => {
    loadFromStorage();
    setPermission(getBrowserNotificationPermission());
  }, [loadFromStorage]);

  // Close popover when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setShowSettings(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermission(res);
  };

  const handleTriggerTest = () => {
    soundSynthesizer.unlock();
    addNotification({
      type: "ticket.reply.created",
      title: "تست اعلان سیستم تیکتینگ",
      message: "این یک پیام آزمایشی برای بررسی پخش صوت، اعلان دسکتاپ و عنوان برگه است.",
      actorName: "سیستم پشتیبانی",
    });
  };

  return (
    <div className="relative" ref={popoverRef}>
      {/* Bell Trigger Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(!isOpen)}
        className="relative h-9 w-9 text-muted-foreground hover:text-foreground"
        title="اعلان‌ها و رویدادهای زنده"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -end-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground shadow-xs animate-in zoom-in">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </Button>

      {/* Popover Panel */}
      {isOpen && (
        <div className="absolute end-0 mt-2 w-[calc(100vw-1.5rem)] sm:w-96 max-w-sm sm:max-w-md rounded-2xl border border-border bg-card shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-150 overflow-hidden flex flex-col max-h-[80dvh] sm:max-h-[500px]">
          {/* Header */}
          <div className="flex items-center justify-between border-b px-4 py-3 bg-muted/30">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-foreground">اعلان‌ها</span>
              {unreadCount > 0 && (
                <Badge variant="secondary" className="text-[10px] h-4 px-1.5 font-mono">
                  {unreadCount} جدید
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <>
                  <button
                    type="button"
                    onClick={markAllAsRead}
                    className="text-muted-foreground hover:text-foreground p-1.5 rounded-md hover:bg-muted transition-colors text-xs inline-flex items-center gap-1"
                    title="خواندن همه"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={clearAll}
                    className="text-muted-foreground hover:text-destructive p-1.5 rounded-md hover:bg-muted transition-colors text-xs inline-flex items-center gap-1"
                    title="پاک کردن همه"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}

              <button
                type="button"
                onClick={() => setShowSettings(!showSettings)}
                className={`p-1.5 rounded-md transition-colors text-xs inline-flex items-center gap-1 ${
                  showSettings ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
                title="تنظیمات اعلان"
              >
                <Settings className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Layer 5: Soft Permission Prompt Banner */}
          {permission !== "granted" && permission !== "unsupported" && (
            <div className="bg-primary/10 border-b border-primary/20 p-3 flex items-center justify-between gap-3 text-xs animate-in fade-in">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary shrink-0" />
                <span className="text-[11px] text-foreground leading-tight">
                  برای دریافت پیام‌های فوری خارج از برگه، اعلان‌های دسکتاپ را فعال کنید
                </span>
              </div>
              <Button
                size="sm"
                className="h-7 text-[11px] px-2.5 shrink-0 rounded-lg shadow-xs"
                onClick={handleRequestPermission}
              >
                فعالسازی اعلان‌های دسکتاپ
              </Button>
            </div>
          )}

          {/* Settings Panel */}
          {showSettings && (
            <div className="border-b bg-muted/40 p-3 text-xs space-y-2.5 animate-in slide-in-from-top-2 duration-150">
              <div className="flex items-center justify-between">
                <span className="text-foreground">پخش صدای زنگ اعلان</span>
                <button
                  type="button"
                  onClick={() => updatePreferences({ soundEnabled: !preferences.soundEnabled })}
                  className="p-1 rounded-md text-foreground hover:bg-muted"
                >
                  {preferences.soundEnabled ? (
                    <Volume2 className="h-4 w-4 text-primary" />
                  ) : (
                    <VolumeX className="h-4 w-4 text-muted-foreground" />
                  )}
                </button>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/40">
                <span className="text-foreground">اعلان دسکتاپ سیستم</span>
                <Button
                  size="sm"
                  variant={permission === "granted" ? "secondary" : "outline"}
                  className="h-6 text-[10px] px-2"
                  onClick={handleRequestPermission}
                >
                  {permission === "granted" ? "مجوز فعال است" : "مجوز مرورگر"}
                </Button>
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-border/40">
                <span className="text-muted-foreground text-[11px]">بررسی عملکرد</span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-6 text-[10px] gap-1 px-2"
                  onClick={handleTriggerTest}
                >
                  <Play className="h-3 w-3" />
                  <span>تست اعلان</span>
                </Button>
              </div>
            </div>
          )}

          {/* Notifications List */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/40">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground text-xs">
                <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p>اعلانی وجود ندارد</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 transition-colors hover:bg-muted/40 flex items-start gap-3 text-xs ${
                    !notif.isRead ? "bg-primary/5" : ""
                  }`}
                  onClick={() => markAsRead(notif.id)}
                >
                  <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary mt-0.5">
                    <MessageSquare className="h-3.5 w-3.5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-semibold text-foreground truncate">
                        {notif.title}
                      </span>
                      {!notif.isRead && (
                        <span className="h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      )}
                    </div>

                    <p className="text-muted-foreground line-clamp-2 leading-relaxed text-[11px] mb-1">
                      {notif.message}
                    </p>

                    {notif.ticketId ? (
                      <Link
                        href={`/tickets/${notif.ticketId}`}
                        onClick={() => setIsOpen(false)}
                        className="text-primary hover:underline text-[11px] font-medium inline-block"
                      >
                        مشاهده تیکت #{notif.ticketId} &larr;
                      </Link>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
