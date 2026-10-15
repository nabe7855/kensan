import { differenceInCalendarDays, parseISO } from "date-fns";

export const DEFAULT_TIME_ZONE = "Asia/Tokyo";

/** Today's calendar date (YYYY-MM-DD) in the given time zone. */
export function todayISO(timeZone: string = DEFAULT_TIME_ZONE, now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** D-xx: contest_date - today. */
export function daysUntilContest(contestDate: string, today: string): number {
  return differenceInCalendarDays(parseISO(contestDate), parseISO(today));
}

/** PREP DAY n: today - start_date + 1. */
export function prepDay(startDate: string, today: string): number {
  return differenceInCalendarDays(parseISO(today), parseISO(startDate)) + 1;
}

export function formatPrepHeader(contestDate: string, startDate: string, today: string): string {
  return `D-${daysUntilContest(contestDate, today)} | PREP DAY ${prepDay(startDate, today)}`;
}

export const MIN_WEEKLY_RATE_PCT = 0.25;
export const MAX_WEEKLY_RATE_PCT = 1.0;
export const WEEKLY_RATE_STEP = 0.05;

/** Fractional weeks between two dates (YYYY-MM-DD). */
export function weeksBetween(startDate: string, endDate: string): number {
  return differenceInCalendarDays(parseISO(endDate), parseISO(startDate)) / 7;
}

/** %/week needed to go from start to target in `weeks` with compounding loss. */
export function requiredWeeklyRate(startKg: number, targetKg: number, weeks: number): number {
  if (weeks <= 0 || targetKg >= startKg) return 0;
  return (1 - Math.pow(targetKg / startKg, 1 / weeks)) * 100;
}

/** Default slider value: required rate rounded up to the step, clamped to [min, max]. */
export function suggestedWeeklyRate(startKg: number, targetKg: number, weeks: number): number {
  const required = requiredWeeklyRate(startKg, targetKg, weeks);
  const stepped = Math.ceil(required / WEEKLY_RATE_STEP - 1e-9) * WEEKLY_RATE_STEP;
  const clamped = Math.min(MAX_WEEKLY_RATE_PCT, Math.max(MIN_WEEKLY_RATE_PCT, stepped));
  return Math.round(clamped * 100) / 100;
}

/** Weight on the rate curve after `weeks`, unclamped. */
export function projectedWeight(startKg: number, ratePct: number, weeks: number): number {
  return startKg * Math.pow(1 - ratePct / 100, weeks);
}

/** Goal weight at `weeks`: the rate curve, never below the target. */
export function goalWeightAt(
  startKg: number,
  targetKg: number,
  ratePct: number,
  weeks: number,
): number {
  return Math.max(targetKg, projectedWeight(startKg, ratePct, weeks));
}

export type GoalPoint = { week: number; weightKg: number };

/** One point per whole week from the start, plus the contest day if it falls mid-week. */
export function goalLine(
  startKg: number,
  targetKg: number,
  ratePct: number,
  totalWeeks: number,
): GoalPoint[] {
  if (totalWeeks <= 0) return [{ week: 0, weightKg: startKg }];
  const points: GoalPoint[] = [];
  for (let w = 0; w < totalWeeks; w++) {
    points.push({ week: w, weightKg: goalWeightAt(startKg, targetKg, ratePct, w) });
  }
  points.push({ week: totalWeeks, weightKg: goalWeightAt(startKg, targetKg, ratePct, totalWeeks) });
  return points;
}

/** Whether the chosen rate reaches the target by the contest (within 0.05 kg). */
export function reachesTarget(
  startKg: number,
  targetKg: number,
  ratePct: number,
  weeks: number,
): boolean {
  return projectedWeight(startKg, ratePct, weeks) <= targetKg + 0.05;
}
