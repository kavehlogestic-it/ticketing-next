"use client";

import { type ReactNode, createContext, useContext, useEffect, useState } from "react";

import { PWASplashScreen } from "@/features/pwa/components/pwa-splash-screen";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
}

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  isIOS: boolean;
  isStandalone: boolean;
  installApp: () => Promise<boolean>;
  dismissInstallPrompt: () => void;
  showInstallBanner: boolean;
}

const PWAContext = createContext<PWAContextType>({
  isInstallable: false,
  isInstalled: false,
  isOffline: false,
  isIOS: false,
  isStandalone: false,
  installApp: async () => false,
  dismissInstallPrompt: () => {},
  showInstallBanner: false,
});

export const usePWA = () => useContext(PWAContext);

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // 1. Detect standalone PWA mode
    const checkStandalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true ||
      document.referrer.includes("android-app://");

    setIsStandalone(Boolean(checkStandalone));
    if (checkStandalone) {
      setIsInstalled(true);
    }

    // 2. Detect iOS device
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isAppleDevice = /iphone|ipad|ipod/.test(userAgent) && !("MSStream" in window);
    setIsIOS(isAppleDevice);

    // If iOS and not in standalone mode, allow showing manual install guide
    if (isAppleDevice && !checkStandalone) {
      const dismissed = sessionStorage.getItem("ticketing_pwa_dismissed");
      if (!dismissed) {
        // Delay showing banner slightly for smooth UX
        const timer = setTimeout(() => setShowInstallBanner(true), 3000);
        return () => clearTimeout(timer);
      }
    }

    // 3. Register Service Worker
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .then((reg) => {
          console.log("[PWA] Service Worker registered with scope:", reg.scope);
          // Check for updates
          reg.onupdatefound = () => {
            const installingWorker = reg.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (
                  installingWorker.state === "installed" &&
                  navigator.serviceWorker.controller
                ) {
                  console.log("[PWA] New version available.");
                }
              };
            }
          };
        })
        .catch((err) => {
          console.warn("[PWA] Service Worker registration notice:", err);
        });
    }

    // 4. Listen for beforeinstallprompt event (Chrome / Edge / Android)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setIsInstallable(true);

      const dismissed = sessionStorage.getItem("ticketing_pwa_dismissed");
      if (!dismissed && !checkStandalone) {
        setTimeout(() => setShowInstallBanner(true), 2500);
      }
    };

    // 5. Listen for appinstalled event
    const handleAppInstalled = () => {
      console.log("[PWA] App successfully installed.");
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallBanner(false);
      setDeferredPrompt(null);
    };

    // 6. Online / Offline status monitoring
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const installApp = async (): Promise<boolean> => {
    if (!deferredPrompt) {
      return false;
    }

    try {
      await deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        console.log("[PWA] User accepted installation prompt");
        setIsInstalled(true);
        setShowInstallBanner(false);
        setDeferredPrompt(null);
        return true;
      } else {
        console.log("[PWA] User dismissed installation prompt");
        setShowInstallBanner(false);
        return false;
      }
    } catch (err) {
      console.error("[PWA] Install prompt error:", err);
      return false;
    }
  };

  const dismissInstallPrompt = () => {
    setShowInstallBanner(false);
    if (typeof window !== "undefined") {
      sessionStorage.setItem("ticketing_pwa_dismissed", "true");
    }
  };

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isOffline,
        isIOS,
        isStandalone,
        installApp,
        dismissInstallPrompt,
        showInstallBanner,
      }}
    >
      {/* Standalone Launch Splash Screen */}
      <PWASplashScreen isStandalone={isStandalone} />

      {/* Offline Status Alert Banner */}
      {isOffline && (
        <aside
          role="status"
          aria-live="polite"
          className="fixed top-0 inset-x-0 z-50 bg-amber-600 dark:bg-amber-700 text-white text-xs py-1.5 px-4 text-center flex items-center justify-center gap-2 shadow-md animate-in slide-in-from-top duration-300"
        >
          <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
          <span>ارتباط اینترنت قطع است — سامانه در حالت آفلاین کار می‌کند</span>
        </aside>
      )}

      {children}
    </PWAContext.Provider>
  );
}
