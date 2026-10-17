export type RestTimerState = { endsAt: number; totalSec: number };

export const REST_PRESETS = [60, 90, 120, 180] as const;

export function startTimer(totalSec: number, now = Date.now()): RestTimerState {
  return { endsAt: now + totalSec * 1000, totalSec };
}

/** Add (or with a negative value, remove) time; never below "now". */
export function addTime(t: RestTimerState, sec: number, now = Date.now()): RestTimerState {
  const endsAt = Math.max(now, t.endsAt + sec * 1000);
  return { endsAt, totalSec: Math.max(1, t.totalSec + sec) };
}

export function remainingSec(t: RestTimerState, now = Date.now()): number {
  return Math.max(0, (t.endsAt - now) / 1000);
}

/** Fraction of the rest still left (1 → 0) for the ring. */
export function progress(t: RestTimerState, now = Date.now()): number {
  return Math.min(1, Math.max(0, remainingSec(t, now) / t.totalSec));
}

/** "1:42" (rounded up so 0:00 means done). */
export function formatRest(sec: number): string {
  const s = Math.max(0, Math.ceil(sec));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

export const MAX_PRESETS = 10;

/** Add a preset (seconds), keeping the list unique, sorted and at most MAX_PRESETS long. */
export function addPreset(presets: number[], sec: number): number[] {
  if (!Number.isFinite(sec) || sec < 5 || sec > 3600) return presets;
  const next = [...new Set([...presets, Math.round(sec)])].sort((a, b) => a - b);
  return next.slice(0, MAX_PRESETS);
}

/** Remove a preset, never leaving the list empty. */
export function removePreset(presets: number[], sec: number): number[] {
  const next = presets.filter((p) => p !== sec);
  return next.length > 0 ? next : presets;
}

/** Label for a preset: "45秒", "1分30秒", "2分". */
export function presetLabel(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}秒`;
  return s === 0 ? `${m}分` : `${m}分${s}秒`;
}

/**
 * Seconds from the previous completed set to each set (completion to completion), or null.
 * Includes the set itself, so it reads as "rest plus the set", not pure rest.
 */
export function setIntervals(doneAts: (string | null)[]): (number | null)[] {
  let prev: number | null = null;
  return doneAts.map((d) => {
    if (!d) return null;
    const t = new Date(d).getTime();
    const gap = prev !== null && t > prev ? Math.round((t - prev) / 1000) : null;
    prev = t;
    // Longer than 15 minutes is a break or a forgotten tap, not rest.
    return gap !== null && gap <= 900 ? gap : null;
  });
}

/** Average of the known intervals, or null. */
export function averageInterval(intervals: (number | null)[]): number | null {
  const known = intervals.filter((n): n is number => n !== null);
  return known.length ? Math.round(known.reduce((a, b) => a + b, 0) / known.length) : null;
}
