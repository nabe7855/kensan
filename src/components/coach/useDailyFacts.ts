"use client";

import { useMemo } from "react";
import { buildDailyFacts, DAILY_DAYS } from "@/lib/ai/daily";
import { addDaysISO, todayISO } from "@/lib/prep";
import { useCheckins } from "@/lib/queries/checkins";
import { useLoggedMeals } from "@/lib/queries/nutrition";

/** The last two weeks, one row per day, for the coach. */
export function useDailyFacts() {
  const today = todayISO();
  const from = addDaysISO(today, -(DAILY_DAYS - 1));
  const checkins = useCheckins(from, today);
  const meals = useLoggedMeals(from, today);
  const days = useMemo(
    () =>
      checkins.data && meals.data
        ? buildDailyFacts({ today, checkins: checkins.data, meals: meals.data })
        : null,
    [checkins.data, meals.data, today],
  );
  return { ready: !!days, days };
}
