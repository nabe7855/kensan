"use client";

import { useNow, useRestTimer } from "@/components/providers/RestTimerProvider";
import { Button } from "@/components/ui/button";
import { formatRest, progress, remainingSec } from "@/lib/rest-timer";
import { COLORS } from "@/lib/tokens";

const R = 44;
const C = 2 * Math.PI * R;

/** Full rest timer (ring, +30s, skip) for the running countdown. Renders nothing when idle. */
export function RestTimer() {
  const { timer, add, stop } = useRestTimer();
  const now = useNow(!!timer);
  if (!timer) return null;

  return (
    <div className="surface flex items-center gap-3 px-3 py-3" role="timer" aria-live="off">
      <div className="relative size-24 shrink-0">
        <svg viewBox="0 0 100 100" className="size-full -rotate-90" aria-hidden>
          <circle cx="50" cy="50" r={R} fill="none" stroke={COLORS.border} strokeWidth="6" />
          <circle
            cx="50"
            cy="50"
            r={R}
            fill="none"
            stroke={COLORS.accent}
            strokeWidth="6"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - progress(timer, now))}
            strokeLinecap="round"
          />
        </svg>
        <span className="num absolute inset-0 flex items-center justify-center text-3xl">
          {formatRest(remainingSec(timer, now))}
        </span>
      </div>
      <Button size="lg" className="flex-1 text-xl" onClick={() => add(30)}>
        +30s
      </Button>
      <Button size="lg" variant="secondary" className="flex-1" onClick={stop}>
        スキップ
      </Button>
    </div>
  );
}
