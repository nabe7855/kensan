"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import {
  estimateMaintenance,
  maintenanceFromWeight,
  planPhases,
  type Phase,
} from "@/lib/cut-phases";
import { kvDelete, kvGet, kvSet } from "@/lib/offline/db";
import { addDaysISO, todayISO } from "@/lib/prep";
import { useCheckins } from "@/lib/queries/checkins";
import { useDailyIntake } from "@/lib/queries/nutrition";

const KEY = "maintenanceKcal";

export type MaintenanceSource = "manual" | "records" | "weight";

/** The active prep split into phases, with the maintenance it is based on (editable, kept on device). */
export function usePhasePlan() {
  const { prep } = useAppData();
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
    const dates = [...new Set([...weights.keys(), ...(intake.data?.keys() ?? [])])].sort();
    return estimateMaintenance(
      dates.map((d) => ({
        date: d,
        kcal: intake.data?.get(d) ?? null,
        weightKg: weights.get(d) ?? null,
      })),
    );
  }, [checkins.data, intake.data]);

  const source: MaintenanceSource = manual ? "manual" : estimated ? "records" : "weight";
  const maintenance =
    manual ?? estimated ?? (prep ? maintenanceFromWeight(prep.start_weight_kg) : null);

  const phases: Phase[] = useMemo(
    () =>
      prep && maintenance
        ? planPhases({
            startDate: prep.start_date,
            contestDate: prep.contest_date,
            startKg: prep.start_weight_kg,
            targetKg: prep.target_weight_kg,
            maintenanceKcal: maintenance,
          })
        : [],
    [prep, maintenance],
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
