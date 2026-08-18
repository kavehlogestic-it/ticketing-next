"use client";

class TabAttentionManager {
  private originalTitle = "";
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private isFlashing = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.originalTitle = document.title;
      window.addEventListener("focus", () => this.stop());
    }
  }

  public flash(alertMessage: string): void {
    if (typeof document === "undefined") return;
    if (document.hasFocus()) return; // User is actively looking at tab

    this.stop();
    this.originalTitle = document.title.replace(/^🔔\s*/, "");
    this.isFlashing = true;

    let toggle = false;
    this.intervalId = setInterval(() => {
      document.title = toggle
        ? `🔔 ${alertMessage}`
        : this.originalTitle;
      toggle = !toggle;
    }, 1000);
  }

  public stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    if (this.isFlashing && typeof document !== "undefined") {
      document.title = this.originalTitle;
      this.isFlashing = false;
    }
  }
}

export const tabAttentionManager = new TabAttentionManager();
