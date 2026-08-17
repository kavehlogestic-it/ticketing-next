"use client";

/**
 * Tab Attention Manager
 * Flashes browser tab title and favicon when real-time notifications arrive,
 * forcing user awareness even if desktop notifications are disabled or in background.
 */

let originalTitle = "";
let flashInterval: ReturnType<typeof setInterval> | null = null;
let isFlashing = false;

function initTitle() {
  if (typeof document !== "undefined" && !originalTitle) {
    originalTitle = document.title || "سامانه پشتیبانی و تیکتینگ";
  }
}

export function startTabTitleFlash(alertMessage: string): void {
  if (typeof document === "undefined") return;
  initTitle();

  // If tab is already focused and visible, do not flash tab title
  if (document.visibilityState === "visible" && document.hasFocus()) {
    return;
  }

  stopTabTitleFlash();

  let toggle = false;
  isFlashing = true;

  flashInterval = setInterval(() => {
    document.title = toggle ? `🔔 ${alertMessage}` : originalTitle;
    toggle = !toggle;
  }, 1000);

  const cleanup = () => {
    stopTabTitleFlash();
    window.removeEventListener("focus", cleanup);
    document.removeEventListener("visibilitychange", cleanup);
  };

  window.addEventListener("focus", cleanup, { once: true });
  document.addEventListener("visibilitychange", cleanup, { once: true });
}

export function stopTabTitleFlash(): void {
  if (flashInterval) {
    clearInterval(flashInterval);
    flashInterval = null;
  }
  if (isFlashing && typeof document !== "undefined" && originalTitle) {
    document.title = originalTitle;
    isFlashing = false;
  }
}
