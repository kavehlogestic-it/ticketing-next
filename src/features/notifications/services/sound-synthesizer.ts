"use client";

/**
 * Web Audio API Sound Synthesizer
 * Generates an elegant, crystal-clear notification chime natively in the browser.
 * Zero external audio files required — 100% LAN, air-gapped, and offline safe.
 */

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;

  try {
    if (!audioCtx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        audioCtx = new AudioCtxClass();
      }
    }
    if (audioCtx && audioCtx.state === "suspended") {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function playNotificationChime(): void {
  const ctx = getAudioContext();
  if (!ctx) return;

  try {
    const now = ctx.currentTime;

    // Harmonic double chime (D5: 587.33 Hz -> A5: 880 Hz)
    const playTone = (freq: number, start: number, duration: number, maxGain: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, start);

      // Smooth attack & exponential decay envelope
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(maxGain, start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + duration);
    };

    // First bell tone
    playTone(587.33, now, 0.35, 0.15);
    // Second higher harmonic tone
    playTone(880.0, now + 0.12, 0.5, 0.2);
  } catch {
    // Graceful fallback if audio is blocked
  }
}
