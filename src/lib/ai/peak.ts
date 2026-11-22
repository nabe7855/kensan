import { z } from "zod";
import { SUGGESTIONS } from "@/lib/contest";
import { CheckinFactsSchema, type CheckinFacts } from "./checkin";

/*
 * Final-week assistant. Like the check-in, the app sends only numbers and fixed keys; the AI
 * turns them into a calm day-by-day plan. It never prescribes water, sodium or drug changes.
 */

/** Days before a contest when the assistant is offered. */
export const PEAK_WINDOW_DAYS = 14;
/** Plans per user per day (JST), on top of the monthly cap. */
export const DAILY_PEAK_LIMIT = 3;
/** Days the plan covers, counting the contest day. */
export const PLAN_DAYS = 8;

const SysKey = z.enum(SUGGESTIONS.map((s) => s.key) as [string, ...string[]]);

export const PeakFactsSchema = z.object({
  days_to_contest: z.number().int().min(0).max(PEAK_WINDOW_DAYS),
  target_weight_kg: z.number().finite().nullable(),
  /** The last 7 days, in the same shape as the weekly check-in. */
  week: CheckinFactsSchema,
  /** Suggested checklist items not yet done. */
  open_items: z.array(SysKey).max(SUGGESTIONS.length),
  /** The user's own routine items not yet done today. */
  own_open: z.number().int().min(0).max(50),
});
export type PeakFacts = z.infer<typeof PeakFactsSchema>;

export const PeakResultSchema = z.object({
  summary: z.string().describe("今の状態と残り日数を踏まえた全体の見立てを 2〜3 文で"),
  days: z
    .array(
      z.object({
        days_before: z.number().int().describe("大会の何日前か。0 が当日"),
        focus: z.string().describe("その日のテーマを 15 文字程度で"),
        items: z.array(z.string()).describe("その日にやること。1 項目 1 文、最大 3 つ"),
      }),
    )
    .describe("今日から大会当日まで、1 日ずつ。最大 8 日"),
  cautions: z
    .array(z.string())
    .describe("facts から気をつけたいこと。1 項目 1 文、最大 3 つ。なければ空"),
});
export type PeakResult = z.infer<typeof PeakResultSchema>;

export const inPeakWindow = (daysLeft: number) => daysLeft >= 0 && daysLeft <= PEAK_WINDOW_DAYS;

export function buildPeakFacts(input: {
  daysToContest: number;
  targetWeightKg: number | null;
  week: CheckinFacts;
  openKeys: string[];
  ownOpen: number;
}): PeakFacts {
  const keys = new Set<string>(SUGGESTIONS.map((s) => s.key));
  return {
    days_to_contest: input.daysToContest,
    target_weight_kg: input.targetWeightKg,
    week: input.week,
    open_items: input.openKeys.filter((k) => keys.has(k)),
    own_open: Math.min(50, input.ownOpen),
  };
}

/** Keeps only today through the contest day, newest-first order by days left, trimmed. */
export function tidyPeakResult(result: PeakResult, daysLeft: number): PeakResult {
  const last = Math.min(daysLeft, PLAN_DAYS - 1);
  const seen = new Set<number>();
  const days = result.days
    .filter((d) => {
      if (d.days_before < 0 || d.days_before > last || seen.has(d.days_before)) return false;
      seen.add(d.days_before);
      return true;
    })
    .sort((a, b) => b.days_before - a.days_before)
    .map((d) => ({ ...d, items: d.items.slice(0, 3) }));
  return { summary: result.summary, days, cautions: result.cautions.slice(0, 3) };
}
