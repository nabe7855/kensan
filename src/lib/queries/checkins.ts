"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";

export type CheckinRow = {
  date: string;
  weight_kg: number | null;
  hunger: number | null;
  sleep: number | null;
  mood: number | null;
  energy: number | null;
  libido: number | null;
  bowel: string | null;
  note: string | null;
  rhr: number | null;
  temp_c: number | null;
};

const COLUMNS = "date, weight_kg, hunger, sleep, mood, energy, libido, bowel, note, rhr, temp_c";

export const checkinKeys = {
  all: ["checkins"] as const,
  range: (from: string, to: string) => ["checkins", from, to] as const,
};

export function useCheckins(from: string, to: string) {
  return useQuery({
    queryKey: checkinKeys.range(from, to),
    queryFn: async (): Promise<CheckinRow[]> => {
      const { data, error } = await getSupabase()
        .from("daily_checkins")
        .select(COLUMNS)
        .gte("date", from)
        .lte("date", to)
        .order("date");
      if (error) throw error;
      return data;
    },
  });
}
