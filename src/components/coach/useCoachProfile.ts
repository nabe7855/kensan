"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { buildCoachProfile } from "@/lib/ai/coach";
import { maintenanceFromLogs } from "@/lib/cut-phases";
import { addDaysISO, todayISO } from "@/lib/prep";
import { useCheckins } from "@/lib/queries/checkins";
import { useDailyIntake } from "@/lib/queries/nutrition";
import { getSupabase } from "@/lib/supabase/client";

/** Body details and energy estimates for the coach, worked out on the device. */
export function useCoachProfile(weightAvgKg: number | null) {
  const today = todayISO();
  const from = addDaysISO(today, -21);
  const body = useQuery({
    queryKey: ["coach-profile"],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("profiles")
        .select("height_cm, sex, birth_year")
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const checkins = useCheckins(from, today);
  const intake = useDailyIntake(from, addDaysISO(today, -1));

  const profile = useMemo(() => {
    if (body.data === undefined || !checkins.data || !intake.data) return null;
    return buildCoachProfile({
      heightCm: body.data?.height_cm ?? null,
      sex: body.data?.sex ?? null,
      birthYear: body.data?.birth_year ?? null,
      today,
      weightAvgKg,
      maintenanceKcal: maintenanceFromLogs(checkins.data, intake.data),
    });
  }, [body.data, checkins.data, intake.data, today, weightAvgKg]);

  return { ready: !!profile, profile };
}
