"use client";

import { useQuery } from "@tanstack/react-query";
import type { Check, Contest, Routine } from "@/lib/contest";
import { getSupabase } from "@/lib/supabase/client";

export const contestKeys = {
  all: ["contests"] as const,
  routines: ["contest-routines"] as const,
  checks: (contestId: string) => ["contest-checks", contestId] as const,
};

export function useContests() {
  return useQuery({
    queryKey: contestKeys.all,
    queryFn: async (): Promise<Contest[]> => {
      const { data, error } = await getSupabase()
        .from("contests")
        .select("id, name, date, category, location, note")
        .order("date");
      if (error) throw error;
      return data;
    },
  });
}

export function useContestRoutines() {
  return useQuery({
    queryKey: contestKeys.routines,
    queryFn: async (): Promise<Routine[]> => {
      const { data, error } = await getSupabase()
        .from("contest_routines")
        .select("id, title, days_before, daily")
        .order("days_before", { ascending: false });
      if (error) throw error;
      return data;
    },
  });
}

export function useContestChecks(contestId: string | null) {
  return useQuery({
    queryKey: contestKeys.checks(contestId ?? ""),
    enabled: !!contestId,
    queryFn: async (): Promise<Check[]> => {
      const { data, error } = await getSupabase()
        .from("contest_checks")
        .select("task_key, on_date")
        .eq("contest_id", contestId!);
      if (error) throw error;
      return data;
    },
  });
}
