"use client";

/**
 * Universal Dual-Engine Audio Player for Real-time Notifications.
 * Generates rich acoustic chimes via Web Audio API, with HTMLAudioElement fallback.
 * Works 100% offline on LAN with zero external assets.
 */
class SoundSynthesizer {
  private webAudioCtx: AudioContext | null = null;
  private audioElem: HTMLAudioElement | null = null;
  private unlocked = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.setupInteractionUnlock();
      this.initFallbackWav();
    }
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === "undefined") return null;

    if (!this.webAudioCtx) {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.webAudioCtx = new AudioCtx();
        }
      } catch (err) {
        console.warn("[SoundSynthesizer] AudioContext init failed:", err);
      }
    }
    return this.webAudioCtx;
  }

  private setupInteractionUnlock(): void {
    if (typeof window === "undefined" || this.unlocked) return;

    const INTERACTION_EVENTS = ["click", "pointerdown", "touchstart"] as const;

    const unlock = () => {
      this.unlock();
      for (const evt of INTERACTION_EVENTS) {
        window.removeEventListener(evt, unlock, true);
      }
    };

    for (const evt of INTERACTION_EVENTS) {
      window.addEventListener(evt, unlock, { capture: true, passive: true });
    }
  }

  public unlock(): void {
    this.unlocked = true;

    // Silently resume Web Audio Context (does not produce any sound)
    const ctx = this.getAudioContext();
    if (ctx && ctx.state === "suspended") {
      ctx.resume().catch(() => {});
    }
  }

  /**
   * Generates a 2-tone melodic notification chime: D5 (587.33 Hz) + A5 (880 Hz)
   * using Web Audio API with natural decay envelope.
   */
  public async playChime(): Promise<void> {
    if (typeof window === "undefined") return;

    // Try Web Audio API first (most reliable, 0 latency)
    try {
      const ctx = this.getAudioContext();
      if (ctx) {
        if (ctx.state === "suspended") {
          await ctx.resume().catch(() => {});
        }

        const now = ctx.currentTime;

        // Master gain
        const masterGain = ctx.createGain();
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(0.5, now + 0.015);
        masterGain.gain.exponentialRampToValueAtTime(0.001, now + 0.55);
        masterGain.connect(ctx.destination);

        // Note 1: 587.33 Hz (D5) - Bell tone
        const osc1 = ctx.createOscillator();
        osc1.type = "sine";
        osc1.frequency.setValueAtTime(587.33, now);

        // Note 2: 880.00 Hz (A5) - Harmonious 5th above, delayed slightly for "ding-dong" chime
        const osc2 = ctx.createOscillator();
        osc2.type = "sine";
        osc2.frequency.setValueAtTime(880.0, now + 0.08);

        // Overtone shimmer
        const osc3 = ctx.createOscillator();
        const overtoneGain = ctx.createGain();
        osc3.type = "triangle";
        osc3.frequency.setValueAtTime(1174.66, now + 0.08);
        overtoneGain.gain.setValueAtTime(0.1, now);
        overtoneGain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
        osc3.connect(overtoneGain);
        overtoneGain.connect(masterGain);

        osc1.connect(masterGain);
        osc2.connect(masterGain);

        osc1.start(now);
        osc2.start(now + 0.08);
        osc3.start(now + 0.08);

        osc1.stop(now + 0.55);
        osc2.stop(now + 0.55);
        osc3.stop(now + 0.55);

        return;
      }
    } catch (err) {
      console.warn("[SoundSynthesizer] Web Audio chime playback error:", err);
    }

    // Fallback: HTMLAudioElement
    this.playFallbackAudio();
  }

  private initFallbackWav(): void {
    try {
      const sampleRate = 22050;
      const duration = 0.45;
      const numSamples = Math.floor(sampleRate * duration);
      const buffer = new ArrayBuffer(44 + numSamples * 2);
      const view = new DataView(buffer);

      this.writeString(view, 0, "RIFF");
      view.setUint32(4, 36 + numSamples * 2, true);
      this.writeString(view, 8, "WAVE");
      this.writeString(view, 12, "fmt ");
      view.setUint32(16, 16, true);
      view.setUint16(20, 1, true);
      view.setUint16(22, 1, true);
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true);
      view.setUint16(32, 2, true);
      view.setUint16(34, 16, true);
      this.writeString(view, 36, "data");
      view.setUint32(40, numSamples * 2, true);

      let offset = 44;
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;
        let s1 = 0;
        if (t < 0.3) {
          s1 = Math.sin(2 * Math.PI * 587.33 * t) * Math.exp(-t * 9);
        }
        let s2 = 0;
        if (t >= 0.07) {
          s2 = Math.sin(2 * Math.PI * 880.0 * (t - 0.07)) * Math.exp(-(t - 0.07) * 7);
        }
        const mixed = Math.max(-1, Math.min(1, (s1 * 0.5 + s2 * 0.6) * 0.9));
        view.setInt16(offset, Math.floor(mixed * 32767), true);
        offset += 2;
      }

      const blob = new Blob([buffer], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);
      this.audioElem = new Audio(url);
      this.audioElem.volume = 1.0;
    } catch {
      // Ignore fallback init error
    }
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  private playFallbackAudio(): void {
    if (this.audioElem) {
      this.audioElem.currentTime = 0;
      this.audioElem.volume = 1.0;
      this.audioElem.play().catch(() => {});
    }
  }
}

export const soundSynthesizer = new SoundSynthesizer();
