"use client";

import { ChevronRight, Sparkles } from "lucide-react";
import Link from "next/link";
import { useAppData } from "@/components/providers/AppDataProvider";
import { lastWeekStart } from "@/lib/ai/checkin";
import { mondayOf } from "@/lib/analysis";
import { todayISO } from "@/lib/prep";
import { useAiCheckins } from "@/lib/queries/ai";

/** Home link to the weekly check-in, only for people who turned AI on. */
export function CheckinCard() {
  const { aiEnabled } = useAppData();
  const { data } = useAiCheckins();
  if (!aiEnabled) return null;
  const weekStart = lastWeekStart(mondayOf(todayISO()));
  const done = data?.some((c) => c.week_start === weekStart);

  return (
    <Link
      href="/checkin"
      className="surface flex min-h-12 items-center gap-3 px-4 py-3 active:opacity-90"
    >
      <Sparkles aria-hidden className="text-muted size-5" />
      <span className="flex-1 text-sm">
        {done ? "先週の振り返りを読む" : "先週を AI と振り返る"}
      </span>
      <ChevronRight aria-hidden className="text-ghost size-5" />
    </Link>
  );
}
