"use client";

import { useQuery } from "@tanstack/react-query";
import type { CheckinResult } from "@/lib/ai/checkin";
import { getSupabase } from "@/lib/supabase/client";

export type AiCheckin = {
  id: string;
  week_start: string;
  result: CheckinResult;
  kcal_delta: number;
  applied_at: string | null;
  created_at: string;
};

export const aiKeys = { checkins: ["ai-checkins"] as const };

/** The latest weekly check-ins, newest first. */
export function useAiCheckins() {
  return useQuery({
    queryKey: aiKeys.checkins,
    queryFn: async (): Promise<AiCheckin[]> => {
      const { data, error } = await getSupabase()
        .from("ai_checkins")
        .select("id, week_start, result, kcal_delta, applied_at, created_at")
        .order("week_start", { ascending: false })
        .limit(12);
      if (error) throw error;
      return data as unknown as AiCheckin[];
    },
  });
}

export type AiMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  created_at: string;
};

export const messagesKey = ["ai-messages"] as const;

/** The latest coach conversation, oldest first. */
export function useAiMessages() {
  return useQuery({
    queryKey: messagesKey,
    queryFn: async (): Promise<AiMessage[]> => {
      const { data, error } = await getSupabase()
        .from("ai_messages")
        .select("id, role, content, created_at")
        .order("created_at", { ascending: false })
        .limit(60);
      if (error) throw error;
      return (data as AiMessage[]).reverse();
    },
  });
}
