"use client";

import { Download, Share, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { usePWA } from "@/features/pwa/components/pwa-provider";

export function PWAInstallPrompt() {
  const {
    isInstallable,
    isInstalled,
    isIOS,
    showInstallBanner,
    installApp,
    dismissInstallPrompt,
  } = usePWA();

  const [isInstalling, setIsInstalling] = useState(false);
  const [showIOSModal, setShowIOSModal] = useState(false);

  // If already installed or banner dismissed, don't show
  if (isInstalled || !showInstallBanner) {
    return null;
  }

  // Handle Chrome / Edge / Android native 1-click prompt
  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSModal(true);
      return;
    }

    if (isInstallable) {
      setIsInstalling(true);
      try {
        await installApp();
      } finally {
        setIsInstalling(false);
      }
    }
  };

  return (
    <>
      {/* Floating Bottom-Right / Bottom-Center Install Banner */}
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-40 animate-in slide-in-from-bottom-5 duration-300">
        <div className="flex items-center gap-3.5 p-3.5 bg-card/95 backdrop-blur-md border border-border/80 rounded-2xl shadow-xl">
          {/* App Icon */}
          <div className="relative h-12 w-12 rounded-xl overflow-hidden shrink-0 border border-border shadow-xs bg-slate-900 p-0.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-192x192.png"
              alt="تیکتینگ"
              className="h-full w-full object-cover rounded-lg"
            />
          </div>

          {/* Text Content */}
          <div className="flex-1 min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-foreground truncate">
              نصب اپلیکیشن سامانه تیکتینگ
            </h2>
            <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
              دسترسی سریع، اعلان‌های زنده و کارکرد آفلاین
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-1.5 shrink-0">
            <Button
              size="sm"
              onClick={handleInstallClick}
              disabled={isInstalling}
              className="h-8 text-xs font-semibold px-3 gap-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
            >
              <Download className="h-3.5 w-3.5" />
              <span>{isInstalling ? "در حال نصب..." : "نصب"}</span>
            </Button>

            <Button
              variant="ghost"
              size="icon"
              onClick={dismissInstallPrompt}
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-lg"
              title="بستن پیام"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* iOS Safari Installation Guide Modal */}
      {showIOSModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-card border border-border rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl text-right" dir="rtl">
            <div className="flex items-center justify-between border-b border-border pb-3">
              <h3 className="font-bold text-sm text-foreground">
                راهنمای نصب در آیفون و آیپد (iOS)
              </h3>
              <button
                onClick={() => setShowIOSModal(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-muted-foreground leading-relaxed">
              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  ۱
                </span>
                <p>
                  در پایین مرورگر Safari، روی دکمه{" "}
                  <strong className="text-foreground inline-flex items-center gap-1">
                    اشتراک‌گذاری <Share className="h-3.5 w-3.5 text-primary inline" />
                  </strong>{" "}
                  (Share) ضربه بزنید.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  ۲
                </span>
                <p>
                  منو را به پایین اسکرول کرده و گزینه{" "}
                  <strong className="text-foreground">«Add to Home Screen»</strong>{" "}
                  (افزودن به صفحه اصلی) را انتخاب فرمایید.
                </p>
              </div>

              <div className="flex items-start gap-2.5">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                  ۳
                </span>
                <p>
                  در گوشه بالا روی <strong className="text-foreground">«Add»</strong> بزنید تا آیکون اپلیکیشن به صفحه شما اضافه شود.
                </p>
              </div>
            </div>

            <Button
              className="w-full h-9 text-xs font-semibold rounded-xl"
              onClick={() => {
                setShowIOSModal(false);
                dismissInstallPrompt();
              }}
            >
              متوجه شدم
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
