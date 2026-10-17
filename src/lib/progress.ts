import { estimated1RM } from "./strength";

export type Trend = "up" | "same" | "down";

export type SetDiff = { label: string; trend: Trend };

const fmt = (n: number, unit: string) => {
  const r = Math.round(n * 100) / 100;
  return `${r > 0 ? "+" : "−"}${Math.abs(r)}${unit}`;
};

/**
 * This set against the same set last time: "+2.5kg", "+1回", "+2.5kg −1回" or "同じ".
 * The trend follows estimated 1RM so a heavier set with fewer reps still reads fairly.
 */
export function setDiff(
  current: { weightKg: number; reps: number },
  previous: { weightKg: number | null; reps: number | null } | undefined,
): SetDiff | null {
  if (!previous || previous.weightKg == null || previous.reps == null) return null;
  const dw = current.weightKg - previous.weightKg;
  const dr = current.reps - previous.reps;
  if (Math.abs(dw) < 0.01 && dr === 0) return { label: "同じ", trend: "same" };
  const parts: string[] = [];
  if (Math.abs(dw) >= 0.01) parts.push(fmt(dw, "kg"));
  if (dr !== 0) parts.push(fmt(dr, "回"));
  const e = estimated1RM(current.weightKg, current.reps);
  const p = estimated1RM(previous.weightKg, previous.reps);
  const trend: Trend = e > p + 1e-9 ? "up" : e < p - 1e-9 ? "down" : "same";
  return { label: parts.join(" "), trend };
}

/** Best estimated 1RM among sets that have both weight and reps. */
export function bestE1RM(sets: { weightKg: number | null; reps: number | null }[]): number | null {
  let best: number | null = null;
  for (const s of sets) {
    if (s.weightKg == null || s.reps == null || s.weightKg <= 0 || s.reps <= 0) continue;
    const e = estimated1RM(s.weightKg, s.reps);
    if (best === null || e > best) best = e;
  }
  return best;
}

/** Signed difference rounded to 0.1 ("+2.1", "−0.5", "±0"). */
export function signedDiff(now: number, before: number): string {
  const d = Math.round((now - before) * 10) / 10;
  return d > 0 ? `+${d}` : d < 0 ? `−${Math.abs(d)}` : "±0";
}

/** Percent change ("+6%", "−3%", "±0%"); null without a baseline. */
export function percentDiff(now: number, before: number): string | null {
  if (before <= 0) return null;
  const pct = Math.round(((now - before) / before) * 100);
  return pct > 0 ? `+${pct}%` : pct < 0 ? `−${Math.abs(pct)}%` : "±0%";
}
