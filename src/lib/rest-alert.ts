/** What happens when a rest countdown ends; kept per device. */
export type RestAlerts = {
  sound: boolean;
  vibrate: boolean;
  /** Keep the screen on during a workout and a rest, so the sound can play. */
  keepAwake: boolean;
};

export const DEFAULT_ALERTS: RestAlerts = { sound: true, vibrate: true, keepAwake: true };

type AudioCtx = typeof AudioContext;
let ctx: AudioContext | null = null;

/**
 * Browsers only allow sound after a tap. Call this from the tap that starts the timer
 * (a silent blip unlocks audio on iOS too), so the chime can play when it ends.
 */
export function unlockAudio(): void {
  try {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: AudioCtx }).webkitAudioContext;
    if (!Ctor) return;
    ctx ??= new Ctor();
    if (ctx.state === "suspended") void ctx.resume();
    const source = ctx.createBufferSource();
    source.buffer = ctx.createBuffer(1, 1, 22050);
    source.connect(ctx.destination);
    source.start(0);
  } catch {
    // No Web Audio here; vibration and notifications still work.
  }
}

/** Three short rising tones. */
export function playChime(): void {
  if (!ctx) unlockAudio();
  if (!ctx) return;
  const t0 = ctx.currentTime + 0.02;
  [880, 880, 1320].forEach((freq, i) => {
    const start = t0 + i * 0.22;
    const osc = ctx!.createOscillator();
    const gain = ctx!.createGain();
    osc.type = "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(0.5, start + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
    osc.connect(gain).connect(ctx!.destination);
    osc.start(start);
    osc.stop(start + 0.2);
  });
}

/** iPhone browsers have no vibration API. */
export const canVibrate = () => typeof navigator !== "undefined" && "vibrate" in navigator;

export const VIBRATION_PATTERN = [200, 100, 200, 100, 400];
