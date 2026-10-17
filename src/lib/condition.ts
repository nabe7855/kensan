import { addDays, format, parseISO } from "date-fns";

/** Every item is rated 1 (bad) to 5 (good). `low` / `high` describe the two ends. */
export const CONDITION_ITEMS = [
  { key: "hunger", label: "空腹", low: "つらい", high: "平気" },
  { key: "sleep", label: "睡眠", low: "浅い", high: "ぐっすり" },
  { key: "mood", label: "気分", low: "落ち込む", high: "良い" },
  { key: "energy", label: "活力", low: "だるい", high: "元気" },
  { key: "libido", label: "性欲", low: "ない", high: "ある" },
] as const;

export type ConditionKey = (typeof CONDITION_ITEMS)[number]["key"];

export type ConditionValues = Partial<Record<ConditionKey, number | null>>;

export type DailyCondition = ConditionValues & { date: string };

/** 1–5 where 5 is always "good". Kept as a function so callers stay scale-agnostic. */
export function wellness(_key: ConditionKey, value: number): number {
  return value;
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
