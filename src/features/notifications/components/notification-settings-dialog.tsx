"use client";

import { Bell, Check, Monitor, Volume2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  getNotificationPermission,
  isNotificationSupported,
  requestNotificationPermission,
} from "@/features/notifications/services/browser-notification";
import { playNotificationChime } from "@/features/notifications/services/sound-synthesizer";
import { useNotificationStore } from "@/features/notifications/stores/notification-store";

export function NotificationSettingsDialog() {
  const t = useTranslations("notifications.settings");
  const { preferences, updatePreferences, isSettingsOpen, setSettingsOpen } =
    useNotificationStore();

  const [permissionState, setPermissionState] =
    useState<NotificationPermission>("default");
  const [supported, setSupported] = useState(false);
  const [isSavedNotice, setIsSavedNotice] = useState(false);

  useEffect(() => {
    setSupported(isNotificationSupported());
    setPermissionState(getNotificationPermission());
  }, [isSettingsOpen]);

  const handleRequestPermission = async () => {
    const res = await requestNotificationPermission();
    setPermissionState(res);
    if (res === "granted") {
      updatePreferences({ desktopNotifications: true });
    }
  };

  const handleToggle = (key: keyof typeof preferences) => {
    const nextVal = !preferences[key];
    updatePreferences({ [key]: nextVal });
    setIsSavedNotice(true);
    setTimeout(() => setIsSavedNotice(false), 2000);
  };

  return (
    <Dialog open={isSettingsOpen} onOpenChange={setSettingsOpen}>
      <DialogContent className="max-w-md p-6">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base font-bold">
            <Bell className="h-5 w-5 text-primary" />
            <span>{t("title")}</span>
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            {t("description")}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 pt-2 text-xs">
          {/* Desktop Notifications Permission Card */}
          <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Monitor className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{t("desktopTitle")}</h4>
                  <p className="text-[11px] text-muted-foreground">{t("desktopDesc")}</p>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-border/50">
              <span className="text-[11px] text-muted-foreground">
                {permissionState === "granted"
                  ? t("permissionGranted")
                  : permissionState === "denied"
                    ? t("permissionDenied")
                    : t("permissionDefault")}
              </span>

              {permissionState !== "granted" && supported ? (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleRequestPermission}
                  className="h-7 text-xs"
                >
                  {t("requestPermission")}
                </Button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleToggle("desktopNotifications")}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                    preferences.desktopNotifications ? "bg-primary" : "bg-muted-foreground/30"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                      preferences.desktopNotifications ? "translate-x-4 rtl:-translate-x-4" : "translate-x-0"
                    }`}
                  />
                </button>
              )}
            </div>
          </div>

          {/* Sound Notification Card */}
          <div className="rounded-xl border border-border bg-muted/40 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                  <Volume2 className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="font-semibold text-foreground">{t("soundTitle")}</h4>
                  <p className="text-[11px] text-muted-foreground">{t("soundDesc")}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => handleToggle("soundEnabled")}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  preferences.soundEnabled ? "bg-primary" : "bg-muted-foreground/30"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                    preferences.soundEnabled ? "translate-x-4 rtl:-translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex justify-end pt-1 border-t border-border/50">
              <Button
                size="sm"
                variant="ghost"
                onClick={playNotificationChime}
                className="h-6 text-[11px] text-muted-foreground hover:text-foreground"
              >
                {t("testSound")}
              </Button>
            </div>
          </div>

          {/* Category Preferences */}
          <div className="space-y-2 pt-1">
            <h4 className="font-semibold text-foreground text-xs">{t("categories")}</h4>

            <div className="divide-y divide-border/60 rounded-xl border border-border bg-card px-3">
              {[
                { key: "newTickets" as const, label: t("newTickets") },
                { key: "ticketAssignments" as const, label: t("ticketAssignments") },
                { key: "newReplies" as const, label: t("newReplies") },
                { key: "statusChanges" as const, label: t("statusChanges") },
                { key: "closedTickets" as const, label: t("closedTickets") },
                { key: "groupNotifications" as const, label: t("groupNotifications") },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center justify-between py-2.5">
                  <span className="text-xs text-foreground font-medium">{label}</span>
                  <button
                    type="button"
                    onClick={() => handleToggle(key)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      preferences[key] ? "bg-primary" : "bg-muted-foreground/30"
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-background shadow-lg ring-0 transition duration-200 ease-in-out ${
                        preferences[key] ? "translate-x-4 rtl:-translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Feedback notice */}
          {isSavedNotice ? (
            <div className="flex items-center justify-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400">
              <Check className="h-3.5 w-3.5" />
              <span>{t("saved")}</span>
            </div>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
