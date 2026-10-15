import { addDays, format, parseISO } from "date-fns";

export const CONDITION_ITEMS = [
  { key: "hunger", label: "空腹", inverted: true },
  { key: "sleep", label: "睡眠", inverted: false },
  { key: "mood", label: "気分", inverted: false },
  { key: "energy", label: "活力", inverted: false },
  { key: "libido", label: "性欲", inverted: false },
] as const;

export type ConditionKey = (typeof CONDITION_ITEMS)[number]["key"];

export type ConditionValues = Partial<Record<ConditionKey, number | null>>;

export type DailyCondition = ConditionValues & { date: string };

/** 1–5 where 5 is always "good" (hunger is reversed: 5 = very hungry = bad). */
export function wellness(key: ConditionKey, value: number): number {
  const item = CONDITION_ITEMS.find((i) => i.key === key)!;
  return item.inverted ? 6 - value : value;
}

/** Shown in amber, never red (mental design rules). */
export function isConcerning(key: ConditionKey, value: number | null | undefined): boolean {
  return value != null && wellness(key, value) <= 2;
}

export function activeItems(trackLibido: boolean) {
  return CONDITION_ITEMS.filter((i) => trackLibido || i.key !== "libido");
}

/** Mean wellness of the recorded items, or null when nothing was recorded. */
export function dailyWellness(values: ConditionValues, trackLibido = true): number | null {
  const scores: number[] = [];
  for (const item of activeItems(trackLibido)) {
    const v = values[item.key];
    if (v != null) scores.push(wellness(item.key, v));
  }
  if (scores.length === 0) return null;
  return scores.reduce((s, v) => s + v, 0) / scores.length;
}

const iso = (d: Date) => format(d, "yyyy-MM-dd");

/**
 * Re-show the "why" text when each of the last 3 days (ending today) scored at least
 * 0.5 below the personal baseline (mean of the prior 28 days, needs 7+ days of data).
 */
export function shouldShowWhy(
  history: DailyCondition[],
  today: string,
  trackLibido = true,
  { streak = 3, baselineDays = 28, minBaselineDays = 7, margin = 0.5 } = {},
): boolean {
  const scoreByDate = new Map<string, number>();
  for (const day of history) {
    const s = dailyWellness(day, trackLibido);
    if (s !== null) scoreByDate.set(day.date, s);
  }

  const start = parseISO(today);
  const recent: number[] = [];
  for (let i = 0; i < streak; i++) {
    const s = scoreByDate.get(iso(addDays(start, -i)));
    if (s === undefined) return false;
    recent.push(s);
  }

  const baseline: number[] = [];
  for (let i = streak; i < streak + baselineDays; i++) {
    const s = scoreByDate.get(iso(addDays(start, -i)));
    if (s !== undefined) baseline.push(s);
  }
  if (baseline.length < minBaselineDays) return false;

  const mean = baseline.reduce((s, v) => s + v, 0) / baseline.length;
  return recent.every((s) => s <= mean - margin);
}
