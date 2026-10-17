"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { usePhasePlan } from "@/components/plan/usePhasePlan";
import { daysLeftInPhase, phaseOn } from "@/lib/cut-phases";

/** Today's prep phase and its calorie guideline, linking to the full plan. */
export function PhaseCard() {
  const { prep, phases, today } = usePhasePlan();
  const p = phaseOn(phases, today);
  if (!prep || !p) return null;
  return (
    <Link
      href="/plan"
      className="surface flex min-h-14 items-center justify-between gap-2 px-4 py-3"
    >
      <span className="flex flex-col">
        <span className="text-muted text-xs">減量フェーズ</span>
        <span className="text-base">
          <span className="text-accent font-bold">{p.name}</span>
          <span className="text-muted text-sm">
            ・残り<span className="num text-fg">{daysLeftInPhase(p, today)}</span>日
          </span>
        </span>
      </span>
      <span className="flex items-center gap-1">
        <span className="num text-lg">{p.kcal.toLocaleString("ja-JP")}</span>
        <span className="text-muted text-xs">kcal 目安</span>
        <ChevronRight aria-hidden className="text-ghost size-4" />
      </span>
    </Link>
  );
}
