"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";
import { weightTrend } from "@/lib/trend";

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
  pain_areas: string[];
};

const COLUMNS =
  "date, weight_kg, hunger, sleep, mood, energy, libido, bowel, note, rhr, temp_c, pain_areas";

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

/** Body weight for per-kg numbers: the 7-day average up to the date (null without records). */
export function useBodyWeight(date: string): number | null {
  const from = new Date(`${date}T00:00:00Z`);
  from.setUTCDate(from.getUTCDate() - 20);
  const { data } = useCheckins(from.toISOString().slice(0, 10), date);
  const entries = (data ?? [])
    .filter((c) => c.weight_kg != null)
    .map((c) => ({ date: c.date, weightKg: c.weight_kg! }));
  return weightTrend(entries).at(-1)?.trendKg ?? null;
}
