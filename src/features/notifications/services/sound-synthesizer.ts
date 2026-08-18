"use client";

/**
 * Universal Dual-Engine Audio Player for Real-time Notifications.
 * Generates an in-memory PCM WAV Blob and plays via HTMLAudioElement,
 * with Web Audio API fallback. Works 100% offline on LAN with zero external assets.
 */
class SoundSynthesizer {
  private audioUrl: string | null = null;
  private audioElem: HTMLAudioElement | null = null;
  private unlocked = false;
  private webAudioCtx: AudioContext | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.initWavBlob();
      this.setupInteractionUnlock();
    }
  }

  private initWavBlob(): void {
    try {
      const sampleRate = 22050;
      const duration = 0.45;
      const numSamples = Math.floor(sampleRate * duration);
      const buffer = new ArrayBuffer(44 + numSamples * 2);
      const view = new DataView(buffer);

      // Write RIFF Header
      this.writeString(view, 0, "RIFF");
      view.setUint32(4, 36 + numSamples * 2, true);
      this.writeString(view, 8, "WAVE");
      this.writeString(view, 12, "fmt ");
      view.setUint32(16, 16, true); // SubChunk1Size (PCM)
      view.setUint16(20, 1, true);  // AudioFormat (PCM)
      view.setUint16(22, 1, true);  // Mono
      view.setUint32(24, sampleRate, true);
      view.setUint32(28, sampleRate * 2, true); // ByteRate
      view.setUint16(32, 2, true);  // BlockAlign
      view.setUint16(34, 16, true); // BitsPerSample
      this.writeString(view, 36, "data");
      view.setUint32(40, numSamples * 2, true);

      // Synthesize clean chime waveform: D5 (587.33Hz) + A5 (880Hz)
      let offset = 44;
      for (let i = 0; i < numSamples; i++) {
        const t = i / sampleRate;

        // Note 1: 587.33 Hz
        let s1 = 0;
        if (t < 0.3) {
          const env1 = Math.exp(-t * 9);
          s1 = Math.sin(2 * Math.PI * 587.33 * t) * env1;
        }

        // Note 2: 880 Hz
        let s2 = 0;
        if (t >= 0.07) {
          const t2 = t - 0.07;
          const env2 = Math.exp(-t2 * 7);
          s2 = Math.sin(2 * Math.PI * 880.0 * t2) * env2;
        }

        const mixed = (s1 * 0.5 + s2 * 0.6) * 0.9;
        const clamped = Math.max(-1, Math.min(1, mixed));
        const int16 = Math.floor(clamped * 32767);
        view.setInt16(offset, int16, true);
        offset += 2;
      }

      const blob = new Blob([buffer], { type: "audio/wav" });
      this.audioUrl = URL.createObjectURL(blob);
      this.audioElem = new Audio(this.audioUrl);
      this.audioElem.volume = 1.0;
    } catch {
      // Ignore generation error
    }
  }

  private writeString(view: DataView, offset: number, string: string): void {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  }

  private setupInteractionUnlock(): void {
    if (this.unlocked) return;

    const unlock = () => {
      this.unlocked = true;

      // Pre-warm the HTMLAudioElement so future plays are allowed
      if (this.audioElem) {
        this.audioElem.play().then(() => {
          this.audioElem?.pause();
          if (this.audioElem) this.audioElem.currentTime = 0;
        }).catch(() => {});
      }

      // Also pre-warm a Web Audio context (some browsers gate this too)
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx && !this.webAudioCtx) {
          this.webAudioCtx = new AudioCtx();
        }
        if (this.webAudioCtx?.state === "suspended") {
          this.webAudioCtx.resume().catch(() => {});
        }
      } catch {
        // Ignore
      }

      // Clean up all listeners
      for (const evt of INTERACTION_EVENTS) {
        window.removeEventListener(evt, unlock, true);
      }
    };

    const INTERACTION_EVENTS = ["click", "keydown", "pointerdown", "touchstart"] as const;
    for (const evt of INTERACTION_EVENTS) {
      window.addEventListener(evt, unlock, { capture: true, passive: true });
    }
  }

  public async playChime(): Promise<void> {
    if (typeof window === "undefined") return;

    try {
      if (!this.audioUrl) {
        this.initWavBlob();
      }

      // Reuse the pre-warmed audio element — this is critical for autoplay policy.
      // Creating a new Audio() each time gets blocked by browsers because the new
      // element hasn't been "unlocked" by a user gesture.
      if (this.audioElem) {
        this.audioElem.currentTime = 0;
        this.audioElem.volume = 1.0;
        await this.audioElem.play();
        return;
      }

      // If audioElem is somehow null but we have a URL, try creating one
      if (this.audioUrl) {
        this.audioElem = new Audio(this.audioUrl);
        this.audioElem.volume = 1.0;
        await this.audioElem.play();
        return;
      }
    } catch {
      // Fallback to Web Audio Context
      this.playWebAudioFallback();
    }
  }

  private playWebAudioFallback(): void {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      // Reuse the pre-warmed context if available
      const ctx = this.webAudioCtx || new AudioCtx();
      if (!this.webAudioCtx) this.webAudioCtx = ctx;

      if (ctx.state === "suspended") {
        ctx.resume().catch(() => {});
      }

      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(750, now);
      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.3);
    } catch {
      // Ignore web audio fallback error
    }
  }
}

export const soundSynthesizer = new SoundSynthesizer();
