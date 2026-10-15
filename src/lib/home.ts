import { addDaysISO, goalWeightAt, weeksBetween } from "./prep";
import { weightTrend, type WeightEntry } from "./trend";

export type GoalPrep = {
  start_date: string;
  contest_date: string;
  start_weight_kg: number;
  target_weight_kg: number;
  weekly_rate_pct: number;
};

/** Goal weight on `date`, or null outside the prep window. */
export function goalOn(prep: GoalPrep | null, date: string): number | null {
  if (!prep || date < prep.start_date || date > prep.contest_date) return null;
  return goalWeightAt(
    prep.start_weight_kg,
    prep.target_weight_kg,
    prep.weekly_rate_pct,
    weeksBetween(prep.start_date, date),
  );
}

/**
 * Chart rows for the last `days` days ending today. The trend is computed over a longer
 * window so the first visible days already have a 7-day average.
 */
export function weightChartPoints(
  entries: WeightEntry[],
  today: string,
  prep: GoalPrep | null,
  days = 30,
) {
  const trend = new Map(weightTrend(entries).map((p) => [p.date, p]));
  return Array.from({ length: days }, (_, i) => {
    const date = addDaysISO(today, i - (days - 1));
    const p = trend.get(date);
    return {
      date,
      weightKg: p?.weightKg ?? null,
      trendKg: p?.trendKg ?? null,
      goalKg: goalOn(prep, date),
    };
  });
}
