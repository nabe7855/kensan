"use client";

import { ChevronRight } from "lucide-react";
import Link from "next/link";
import { checklist, countdownLabel, nextContest } from "@/lib/contest";
import { todayISO } from "@/lib/prep";
import { useContestChecks, useContestRoutines, useContests } from "@/lib/queries/contests";

/** The next contest's countdown and how many items are open today. */
export function ContestCard() {
  const today = todayISO();
  const contests = useContests();
  const routines = useContestRoutines();
  const next = nextContest(contests.data ?? [], today);
  const checks = useContestChecks(next?.id ?? null);
  if (!next) return null;
  const open = checklist(next.date, today, routines.data ?? [], checks.data ?? []).now.length;

  return (
    <Link
      href={`/contest/${next.id}`}
      className="surface border-l-accent flex min-h-14 items-center justify-between gap-2 border-l-2 px-4 py-3"
    >
      <span className="flex min-w-0 flex-col">
        <span className="text-muted text-xs">次の大会</span>
        <span className="truncate text-base font-bold">{next.name}</span>
      </span>
      <span className="flex items-center gap-2">
        <span className="flex flex-col items-end">
          <span className="num text-accent text-xl leading-none">
            {countdownLabel(next.date, today)}
          </span>
          {open > 0 && (
            <span className="text-muted text-xs">
              今やること <span className="num text-fg">{open}</span>
            </span>
          )}
        </span>
        <ChevronRight aria-hidden className="text-ghost size-4" />
      </span>
    </Link>
  );
}
