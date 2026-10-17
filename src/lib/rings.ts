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

const dayNum = (d: string) => new Date(`${d}T00:00:00Z`).getTime() / 86_400_000;
const isoOf = (n: number) => new Date(n * 86_400_000).toISOString().slice(0, 10);

/** Monday of the week containing the date. */
export function weekStartISO(date: string): string {
  const n = dayNum(date);
  const dow = (new Date(n * 86_400_000).getUTCDay() + 6) % 7;
  return isoOf(n - dow);
}

/** Training days this week, and the usual count from the four weeks before (null without history). */
export function trainingFrequency(
  dates: string[],
  today: string,
): { thisWeek: number; usual: number | null } {
  const start = dayNum(weekStartISO(today));
  const days = [...new Set(dates)].map(dayNum);
  const thisWeek = days.filter((d) => d >= start && d <= dayNum(today)).length;
  const before = days.filter((d) => d >= start - 28 && d < start).length;
  return { thisWeek, usual: before > 0 ? Math.max(1, Math.round(before / 4)) : null };
}

/** Days with a record among the last `span` days, today included. */
export function recordedDays(dates: string[], today: string, span = 7): number {
  const t = dayNum(today);
  return new Set(dates.filter((d) => dayNum(d) <= t && dayNum(d) > t - span)).size;
}
