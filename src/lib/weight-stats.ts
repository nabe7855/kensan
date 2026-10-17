import { addDaysISO } from "./prep";
import { weightTrend, type WeightEntry } from "./trend";

export const RANGES = [
  { key: "week", label: "週", days: 7 },
  { key: "month", label: "月", days: 30 },
  { key: "quarter", label: "3ヶ月", days: 90 },
  { key: "year", label: "年", days: 365 },
  { key: "all", label: "全期間", days: null },
] as const;

export type RangeKey = (typeof RANGES)[number]["key"];

/** First day shown for a range ending today; "all" starts at the first record. */
export function rangeStart(key: RangeKey, entries: WeightEntry[], today: string): string {
  const r = RANGES.find((x) => x.key === key)!;
  if (r.days !== null) return addDaysISO(today, -(r.days - 1));
  const first = [...entries].sort((a, b) => a.date.localeCompare(b.date))[0]?.date;
  return first && first < today ? first : addDaysISO(today, -29);
}

export type RangeStats = {
  count: number;
  avg: number;
  min: { kg: number; date: string };
  max: { kg: number; date: string };
  /** 7-day average at the end minus at the start of the range. */
  trendChange: number | null;
  /** That change per week. */
  perWeek: number | null;
};

/** Average, high, low and how the 7-day average moved over [from, to]. */
export function rangeStats(entries: WeightEntry[], from: string, to: string): RangeStats | null {
  const inRange = entries.filter((e) => e.date >= from && e.date <= to);
  if (inRange.length === 0) return null;
  let min = inRange[0]!;
  let max = inRange[0]!;
  for (const e of inRange) {
    if (e.weightKg < min.weightKg) min = e;
    if (e.weightKg > max.weightKg) max = e;
  }
  const trend = weightTrend(entries).filter((p) => p.date >= from && p.date <= to);
  const first = trend[0];
  const last = trend.at(-1);
  const days =
    first && last
      ? (new Date(`${last.date}T00:00:00Z`).getTime() -
          new Date(`${first.date}T00:00:00Z`).getTime()) /
        86_400_000
      : 0;
  const change = first && last && days >= 6 ? last.trendKg - first.trendKg : null;
  return {
    count: inRange.length,
    avg: inRange.reduce((s, e) => s + e.weightKg, 0) / inRange.length,
    min: { kg: min.weightKg, date: min.date },
    max: { kg: max.weightKg, date: max.date },
    trendChange: change,
    perWeek: change !== null ? (change / days) * 7 : null,
  };
}

/** Today's weight if recorded, otherwise the latest record. */
export function headlineWeight(
  entries: WeightEntry[],
  today: string,
): { kg: number; date: string; isToday: boolean } | null {
  const latest = [...entries].sort((a, b) => b.date.localeCompare(a.date))[0];
  if (!latest) return null;
  return { kg: latest.weightKg, date: latest.date, isToday: latest.date === today };
}

/** "+0.3" / "−0.3" / "±0.0", always neutral wording. */
export const signedKg = (n: number) =>
  `${n > 0.049 ? "+" : n < -0.049 ? "−" : "±"}${Math.abs(n).toFixed(1)}`;
