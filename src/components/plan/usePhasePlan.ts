"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import {
  estimateMaintenance,
  maintenanceFromWeight,
  planPhases,
  type Phase,
  type PhaseDates,
  type PhaseSplit,
} from "@/lib/cut-phases";
import { kvDelete, kvGet, kvSet } from "@/lib/offline/db";
import { addDaysISO, todayISO } from "@/lib/prep";
import { useCheckins } from "@/lib/queries/checkins";
import { useDailyIntake } from "@/lib/queries/nutrition";
import { weightTrend } from "@/lib/trend";

const KEY = "maintenanceKcal";

export type MaintenanceSource = "manual" | "records" | "weight";

/** The active prep split into phases, with the maintenance it is based on (editable, kept on device). */
export function usePhasePlan(draftSplit?: PhaseSplit | PhaseDates | null, draftStart?: string) {
  const { prep } = useAppData();
  // While editing, the draft previews the new lengths; otherwise the saved split (or default).
  const split = draftSplit !== undefined ? draftSplit : (prep?.phase_split ?? null);
  const today = todayISO();
  const from = addDaysISO(today, -21);
  const intake = useDailyIntake(from, addDaysISO(today, -1));
  const checkins = useCheckins(from, today);
  const [manual, setManual] = useState<number | null>(null);
  useEffect(() => {
    void kvGet<number>(KEY).then((v) => setManual(v ?? null));
  }, []);

  const estimated = useMemo(() => {
    const weights = new Map(
      (checkins.data ?? []).filter((c) => c.weight_kg != null).map((c) => [c.date, c.weight_kg!]),
    );
    const dates = [...new Set([...weights.keys(), ...Object.keys(intake.data ?? {})])].sort();
    return estimateMaintenance(
      dates.map((d) => ({
        date: d,
        kcal: intake.data?.[d] ?? null,
        weightKg: weights.get(d) ?? null,
      })),
    );
  }, [checkins.data, intake.data]);

  // Today's 7-day average weight: where a logged or typed-in maintenance figure applies.
  const currentKg = useMemo(() => {
    const entries = (checkins.data ?? [])
      .filter((c) => c.weight_kg != null)
      .map((c) => ({ date: c.date, weightKg: c.weight_kg! }));
    return weightTrend(entries).at(-1)?.trendKg ?? null;
  }, [checkins.data]);

  const source: MaintenanceSource = manual ? "manual" : estimated ? "records" : "weight";
  const maintenance =
    manual ?? estimated ?? (prep ? maintenanceFromWeight(prep.start_weight_kg) : null);

  const phases: Phase[] = useMemo(
    () =>
      prep && maintenance
        ? planPhases(
            {
              startDate: draftStart ?? prep.start_date,
              contestDate: prep.contest_date,
              startKg: prep.start_weight_kg,
              targetKg: prep.target_weight_kg,
              maintenanceKcal: maintenance,
              // The bodyweight fallback is maintenance at the start weight; the others are "now".
              anchor: source !== "weight" && currentKg ? { kg: currentKg, date: today } : null,
            },
            split,
          )
        : [],
    [prep, maintenance, split, draftStart, source, currentKg, today],
  );

  return {
    prep,
    today,
    phases,
    maintenance,
    source,
    estimated,
    setMaintenance: (v: number | null) => {
      setManual(v);
      void (v === null ? kvDelete(KEY) : kvSet(KEY, v));
    },
  };
}
