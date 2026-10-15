import { activeItems, wellness, type ConditionKey, type DailyCondition } from "./condition";
import { addDaysISO } from "./prep";

/** Monday of the week containing `date` (weeks start on Monday, as in the SQL views). */
export function mondayOf(date: string): string {
  const day = new Date(`${date}T00:00:00`).getDay();
  return addDaysISO(date, -((day + 6) % 7));
}

export type HeatLevel = "none" | "good" | "neutral" | "low" | "verylow";

/** Wellness 1 is "very low", 2 "low", 3 neutral, 4–5 good. Low values are shown in amber. */
export function heatLevel(key: ConditionKey, value: number | null | undefined): HeatLevel {
  if (value == null) return "none";
  const w = wellness(key, value);
  if (w <= 1) return "verylow";
  if (w <= 2) return "low";
  if (w <= 3) return "neutral";
  return "good";
}

export type HeatRow = {
  key: ConditionKey;
  label: string;
  cells: { date: string; level: HeatLevel; value: number | null }[];
};

/** Items × last `days` days (oldest first) for the subjective heatmap. */
export function conditionHeatmap(
  history: DailyCondition[],
  today: string,
  trackLibido = true,
  days = 7,
): HeatRow[] {
  const byDate = new Map(history.map((h) => [h.date, h]));
  const dates = Array.from({ length: days }, (_, i) => addDaysISO(today, i - (days - 1)));
  return activeItems(trackLibido).map((item) => ({
    key: item.key,
    label: item.label,
    cells: dates.map((date) => {
      const value = byDate.get(date)?.[item.key] ?? null;
      return { date, value, level: heatLevel(item.key, value) };
    }),
  }));
}

/** 0 sets → 0, 20+ weekly sets → 1. */
export function volumeIntensity(sets: number, full = 20): number {
  return Math.max(0, Math.min(1, sets / full));
}

export type WeekReport = { week_start: string; avg_weight: number | null };

/** Neutral one-liner on the weekly average only (no praise for loss, no daily swings). */
export function weeklyWeightLine(
  thisWeek: WeekReport | null,
  lastWeek: WeekReport | null,
): string | null {
  if (thisWeek?.avg_weight == null) return null;
  const avg = thisWeek.avg_weight.toFixed(1);
  if (lastWeek?.avg_weight == null) return `今週の平均 ${avg}kg`;
  const d = thisWeek.avg_weight - lastWeek.avg_weight;
  const sign = d > 0 ? "+" : d < 0 ? "−" : "±";
  return `今週の平均 ${avg}kg（前週比 ${sign}${Math.abs(d).toFixed(1)}kg）`;
}
