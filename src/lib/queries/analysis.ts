"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";

export function useWeeklyVolume(weekStart: string) {
  return useQuery({
    queryKey: ["weekly-volume", weekStart],
    queryFn: async () => {
      const { data, error } = await getSupabase()
        .from("v_weekly_volume")
        .select("muscle_group, sets")
        .eq("week_start", weekStart);
      if (error) throw error;
      return Object.fromEntries(
        (data ?? []).map((r) => [r.muscle_group ?? "", r.sets ?? 0]),
      ) as Record<string, number>;
    },
  });
}

export type WeeklyReportRow = {
  week_start: string;
  avg_weight: number | null;
  avg_sleep: number | null;
  total_sets: number;
  avg_kcal: number | null;
};

export function useWeeklyReports(fromWeek: string) {
  return useQuery({
    queryKey: ["weekly-report", fromWeek],
    queryFn: async (): Promise<WeeklyReportRow[]> => {
      const { data, error } = await getSupabase()
        .from("v_weekly_report")
        .select("week_start, avg_weight, avg_sleep, total_sets, avg_kcal")
        .gte("week_start", fromWeek)
        .order("week_start");
      if (error) throw error;
      return (data ?? []).map((r) => ({
        week_start: r.week_start ?? "",
        avg_weight: r.avg_weight,
        avg_sleep: r.avg_sleep,
        total_sets: r.total_sets ?? 0,
        avg_kcal: r.avg_kcal,
      }));
    },
  });
}
