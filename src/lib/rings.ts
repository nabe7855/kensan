export type Ring = { ratio: number; pct: number };

/** Ring fill (capped at a full circle) and the percentage shown in the centre (not capped). */
export function ringProgress(value: number, target: number | null | undefined): Ring | null {
  if (!target || target <= 0) return null;
  const raw = Math.max(0, value) / target;
  return { ratio: Math.min(1, raw), pct: Math.round(raw * 100) };
}

/** How far through the prep we are, by days. */
export function prepProgress(startDate: string, contestDate: string, today: string): Ring | null {
  const day = (d: string) => new Date(`${d}T00:00:00Z`).getTime() / 86_400_000;
  const total = day(contestDate) - day(startDate);
  if (total <= 0) return null;
  return ringProgress(Math.min(total, Math.max(0, day(today) - day(startDate))), total);
}

/** Stroke offset for an SVG circle of circumference `c` filled to `ratio`. */
export const dashOffset = (c: number, ratio: number) => c * (1 - Math.min(1, Math.max(0, ratio)));
