"use client";

import { useMemo } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { buildCheckinFacts } from "@/lib/ai/checkin";
import { addDaysISO } from "@/lib/prep";
import { useCheckins } from "@/lib/queries/checkins";
import { useDailyMacros, useTargets } from "@/lib/queries/nutrition";
import { jstMidnight, useSessions } from "@/lib/queries/training";
import { evaluateSafety } from "@/lib/safety";
import { jstDate } from "@/lib/sessions";

/** Facts for the week, built from the same queries the rest of the app uses. */
export function useWeekFacts(weekStart: string) {
  const { prep, trainingPhase, trackLibido } = useAppData();
  const weekEnd = addDaysISO(weekStart, 6);
  const checkins = useCheckins(addDaysISO(weekStart, -28), weekEnd);
  const sessions = useSessions(
    jstMidnight(addDaysISO(weekStart, -28)),
    jstMidnight(addDaysISO(weekEnd, 1)),
  );
  const macros = useDailyMacros(addDaysISO(weekStart, -7), weekEnd);
  const targets = useTargets();

  const ready = !!(checkins.data && sessions.data && macros.data && targets.data);
  const facts = useMemo(() => {
    if (!checkins.data || !sessions.data || !macros.data || !targets.data) return null;
    const workouts = sessions.data.map((s) => ({
      date: jstDate(s.started_at),
      hardSets: s.sets.filter((x) => x.set_type !== "warmup" && (x.reps ?? 0) > 0).length,
      joint: s.joint,
      pain_areas: s.pain_areas ?? [],
    }));
    const safety = evaluateSafety({
      checkins: checkins.data,
      workouts,
      today: weekEnd,
      trackLibido,
      cutting: trainingPhase === "cut",
    });
    return buildCheckinFacts({
      weekStart,
      phase: trainingPhase,
      prep: prep ? { contestDate: prep.contest_date, weeklyRatePct: prep.weekly_rate_pct } : null,
      checkins: checkins.data,
      macros: macros.data,
      targets: targets.data,
      workouts,
      safety,
    });
  }, [
    checkins.data,
    sessions.data,
    macros.data,
    targets.data,
    weekStart,
    weekEnd,
    prep,
    trainingPhase,
    trackLibido,
  ]);

  return { ready, facts, failed: checkins.isError || sessions.isError || macros.isError };
}
