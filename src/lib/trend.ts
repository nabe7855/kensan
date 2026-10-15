import { addDays, differenceInCalendarDays, format, parseISO } from "date-fns";

export type WeightEntry = { date: string; weightKg: number };

export type TrendPoint = {
  date: string;
  /** Measured weight, null on missing days. */
  weightKg: number | null;
  /** Measured or linearly interpolated weight. */
  filledKg: number;
  /** Simple moving average of filledKg over the last `window` days (fewer at the start). */
  trendKg: number;
};

const iso = (d: Date) => format(d, "yyyy-MM-dd");
const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * Daily series from the first to the last measured date. Missing days are linearly
 * interpolated between neighbouring measurements; the trend is a simple moving average.
 * Mirrors the SQL view v_weight_trend.
 */
export function weightTrend(entries: WeightEntry[], window = 7): TrendPoint[] {
  const measured = [...entries]
    .filter((e) => Number.isFinite(e.weightKg))
    .sort((a, b) => a.date.localeCompare(b.date));
  if (measured.length === 0) return [];

  const byDate = new Map(measured.map((e) => [e.date, e.weightKg]));
  const first = parseISO(measured[0]!.date);
  const days = differenceInCalendarDays(parseISO(measured[measured.length - 1]!.date), first);

  const points: TrendPoint[] = [];
  let prevIdx = 0;
  for (let i = 0; i <= days; i++) {
    const date = iso(addDays(first, i));
    const weightKg = byDate.get(date) ?? null;
    let filledKg: number;
    if (weightKg !== null) {
      filledKg = weightKg;
      prevIdx = measured.findIndex((e) => e.date === date);
    } else {
      const prev = measured[prevIdx]!;
      const next = measured[prevIdx + 1]!;
      const span = differenceInCalendarDays(parseISO(next.date), parseISO(prev.date));
      const t = differenceInCalendarDays(parseISO(date), parseISO(prev.date)) / span;
      filledKg = prev.weightKg + (next.weightKg - prev.weightKg) * t;
    }
    const from = Math.max(0, points.length - (window - 1));
    const recent = [...points.slice(from).map((p) => p.filledKg), filledKg];
    const trendKg = round2(recent.reduce((s, v) => s + v, 0) / recent.length);
    points.push({ date, weightKg, filledKg, trendKg });
  }
  return points;
}

export type TrendDirection = "down" | "up" | "flat";

/** Direction of the trend over the last `days` days; changes under 0.05 kg are flat. */
export function trendDirection(points: TrendPoint[], days = 7): TrendDirection | null {
  if (points.length < 2) return null;
  const last = points[points.length - 1]!;
  const base = points[Math.max(0, points.length - 1 - days)]!;
  const delta = last.trendKg - base.trendKg;
  if (Math.abs(delta) < 0.05) return "flat";
  return delta < 0 ? "down" : "up";
}
