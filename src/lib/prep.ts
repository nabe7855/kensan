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
