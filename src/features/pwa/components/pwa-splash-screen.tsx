"use client";

import { useEffect, useState } from "react";

interface PWASplashScreenProps {
  isStandalone: boolean;
}

export function PWASplashScreen({ isStandalone }: PWASplashScreenProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    // Only trigger full animated splash screen when launching in standalone PWA mode
    if (isStandalone) {
      setIsVisible(true);
      const fadeTimer = setTimeout(() => {
        setIsFading(true);
      }, 900);

      const hideTimer = setTimeout(() => {
        setIsVisible(false);
      }, 1400);

      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(hideTimer);
      };
    }
  }, [isStandalone]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-slate-950 text-slate-100 transition-opacity duration-500 pointer-events-none select-none ${
        isFading ? "opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex flex-col items-center gap-6 animate-in zoom-in-95 duration-500">
        {/* Glowing App Icon Container */}
        <div className="relative">
          <div className="absolute -inset-4 bg-emerald-500/20 rounded-3xl blur-xl animate-pulse" />
          <div className="relative h-28 w-28 rounded-2xl overflow-hidden shadow-2xl border border-slate-700/50 bg-slate-900 p-1 flex items-center justify-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/icons/icon-192x192.png"
              alt="لوگوی تیکتینگ"
              className="h-full w-full object-cover rounded-xl"
            />
          </div>
        </div>

        {/* App Title & Subtitle */}
        <div className="text-center space-y-1.5">
          <h1 className="text-xl font-bold text-slate-100 tracking-tight">
            سامانه پشتیبانی و تیکتینگ
          </h1>
          <p className="text-xs text-slate-400 font-medium">
            در حال آماده‌سازی و همگام‌سازی اطلاعات...
          </p>
        </div>

        {/* Minimal Progress Line */}
        <div className="w-36 h-1 bg-slate-800 rounded-full overflow-hidden mt-2">
          <div className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full animate-pulse w-full" />
        </div>
      </div>
    </div>
  );
}
