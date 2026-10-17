"use client";

import { Timer, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { readActiveWorkout } from "@/lib/useActiveWorkout";
import { useNow, useRestTimer } from "@/components/providers/RestTimerProvider";
import { formatRest, progress, remainingSec } from "@/lib/rest-timer";

/**
 * Running countdown pinned above the tab bar on every screen except the workout screen,
 * which shows the full timer itself. Tapping it opens the workout (or the training tab).
 */
export function GlobalRestBar() {
  const pathname = usePathname();
  const { timer, add, stop } = useRestTimer();
  const now = useNow(!!timer);
  const [inWorkout, setInWorkout] = useState(false);
  useEffect(() => {
    void readActiveWorkout().then((w) => setInWorkout(!!w));
  }, [timer]);
  if (!timer || pathname === "/training/workout") return null;
  const left = remainingSec(timer, now);

  return (
    <>
      {/* keeps page content clear of the fixed bar */}
      <div aria-hidden className="h-16" />
      <div className="kb-open:hidden fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-40">
        <div className="mx-auto max-w-[480px] px-4 pb-2">
          <div
            role="timer"
            aria-label={`レスト残り ${formatRest(left)}`}
            className="border-accent bg-card relative flex h-14 items-center gap-2 overflow-hidden rounded-md border pr-1 pl-3 shadow-lg"
          >
            <span
              aria-hidden
              className="bg-accent/15 absolute inset-y-0 left-0"
              style={{ width: `${progress(timer, now) * 100}%` }}
            />
            <Link
              href={inWorkout ? "/training/workout" : "/training"}
              className="relative flex flex-1 items-center gap-2"
            >
              <Timer className="text-accent size-5" aria-hidden />
              <span className="text-muted text-xs">レスト</span>
              <span className="num text-accent text-3xl leading-none">{formatRest(left)}</span>
            </Link>
            <button
              type="button"
              onClick={() => add(30)}
              className="num border-border relative h-10 rounded-md border px-3 text-base"
            >
              +30s
            </button>
            <button
              type="button"
              aria-label="タイマーを止める"
              onClick={stop}
              className="text-muted relative flex size-10 items-center justify-center"
            >
              <X className="size-5" />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
