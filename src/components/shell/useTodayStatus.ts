"use client";

import { useMemo } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { dayTotals } from "@/lib/meal-plan";
import { dayTypeFor, targetFor } from "@/lib/nutrition";
import { daysUntilContest, todayISO } from "@/lib/prep";
import { useCheckins } from "@/lib/queries/checkins";
import { useDayMeals, useDayOverride, useTargets } from "@/lib/queries/nutrition";
import { useTrainedOn } from "@/lib/queries/training";
import { prepProgress, ringProgress, type Ring } from "@/lib/rings";

export type TabStatus = { ring: Ring | null; note?: string };

/** Today at a glance, for the tab bar: one ring per tab. */
export function useTodayStatus(): Record<string, TabStatus> {
  const today = todayISO();
  const { prep } = useAppData();
  const meals = useDayMeals(today);
  const targets = useTargets();
  const override = useDayOverride(today);
  const trained = useTrainedOn(today);
  const checkins = useCheckins(today, today);

  return useMemo(() => {
    const target = targetFor(targets.data ?? [], today, dayTypeFor(trained, override.data ?? null));
    const { eaten } = dayTotals(meals.data ?? []);
    const protein = ringProgress(eaten.protein_g, target?.protein_g);
    const checkedIn = (checkins.data ?? []).some((c) => c.date === today);
    const left = prep ? daysUntilContest(prep.contest_date, today) : null;
    return {
      "/home": {
        ring: prep ? prepProgress(prep.start_date, prep.contest_date, today) : null,
        note: left !== null && left >= 0 ? `${left}日` : undefined,
      },
      "/training": { ring: { ratio: trained ? 1 : 0, pct: trained ? 100 : 0 } },
      "/nutrition": { ring: protein, note: protein ? `${protein.pct}%` : undefined },
      "/condition": { ring: { ratio: checkedIn ? 1 : 0, pct: checkedIn ? 100 : 0 } },
    };
  }, [today, prep, meals.data, targets.data, override.data, trained, checkins.data]);
}
