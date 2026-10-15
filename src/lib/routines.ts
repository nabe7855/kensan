export type WeekdayRoutine = { weekdays: number[]; order_idx: number };

/** Routine scheduled for the given date (0=Sun..6=Sat), first by order when several match. */
export function routineForDate<T extends WeekdayRoutine>(routines: T[], date: string): T | null {
  const weekday = new Date(`${date}T00:00:00`).getDay();
  return (
    [...routines]
      .sort((a, b) => a.order_idx - b.order_idx)
      .find((r) => r.weekdays.includes(weekday)) ?? null
  );
}
