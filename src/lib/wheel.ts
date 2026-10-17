/** Fractions offered on the weight wheel (plates go down to 1.25 kg, so quarters cover it). */
export const KG_FRACTIONS = [0, 0.25, 0.5, 0.75] as const;
export const MAX_KG = 400;
export const MAX_REPS = 50;
export const MAX_RIR = 5;

/** 72.5 → { whole: 72, frac: 0.5 }; snaps to the nearest quarter. */
export function splitKg(kg: number): { whole: number; frac: number } {
  const q = Math.round(Math.max(0, Math.min(MAX_KG, kg)) * 4) / 4;
  const whole = Math.floor(q);
  return { whole, frac: Math.round((q - whole) * 100) / 100 };
}

export const joinKg = (whole: number, frac: number) => Math.round((whole + frac) * 100) / 100;

/** 0..max as a list, for wheels. */
export const range = (max: number, min = 0) =>
  Array.from({ length: max - min + 1 }, (_, i) => min + i);

/** Index of the item closest to a scroll offset. */
export function indexAt(scrollTop: number, itemHeight: number, count: number): number {
  return Math.max(0, Math.min(count - 1, Math.round(scrollTop / itemHeight)));
}

const num = (s: string) => (s.trim() === "" || !Number.isFinite(Number(s)) ? null : Number(s));

/**
 * Where the wheels start: what's typed, else last time's set, else the set above in this
 * session, else zero.
 */
export function startingValues(
  current: { weight: string; reps: string; rir: string },
  previous: { weight_kg: number | null; reps: number | null; rir: number | null } | undefined,
  above: { weight: string; reps: string; rir: string } | undefined,
): { weight: number; reps: number; rir: number } {
  const pick = (own: string, prev: number | null | undefined, up: string | undefined) =>
    num(own) ?? prev ?? (up !== undefined ? num(up) : null) ?? 0;
  return {
    weight: pick(current.weight, previous?.weight_kg, above?.weight),
    reps: pick(current.reps, previous?.reps, above?.reps),
    rir: pick(current.rir, previous?.rir, above?.rir),
  };
}
