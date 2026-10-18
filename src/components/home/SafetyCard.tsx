"use client";

import { ShieldAlert, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { kvGet, kvSet } from "@/lib/offline/db";
import { addDaysISO, todayISO } from "@/lib/prep";
import { useCheckins } from "@/lib/queries/checkins";
import { jstMidnight, useSessions } from "@/lib/queries/training";
import { evaluateSafety, type WorkoutDay } from "@/lib/safety";
import { jstDate } from "@/lib/sessions";

const DISMISS_KEY = "safetyDismissed";

/**
 * Safety net on Home: shows only when several warning signs pile up (or the same place keeps
 * hurting), with why and what to try. Amber, never red; can be closed for today.
 */
export function SafetyCard() {
  const today = todayISO();
  const { trackLibido, trainingPhase } = useAppData();
  const checkins = useCheckins(addDaysISO(today, -34), today);
  const sessions = useSessions(
    jstMidnight(addDaysISO(today, -34)),
    jstMidnight(addDaysISO(today, 1)),
  );
  const [dismissed, setDismissed] = useState<string | null>(null);
  useEffect(() => {
    void kvGet<string>(DISMISS_KEY).then((v) => setDismissed(v ?? null));
  }, []);

  const safety = useMemo(() => {
    const workouts: WorkoutDay[] = (sessions.data ?? []).map((s) => ({
      date: jstDate(s.started_at),
      hardSets: s.sets.filter((x) => x.set_type !== "warmup" && (x.reps ?? 0) > 0).length,
      joint: s.joint,
      pain_areas: s.pain_areas ?? [],
    }));
    return evaluateSafety({
      checkins: checkins.data ?? [],
      workouts,
      today,
      trackLibido,
      cutting: trainingPhase === "cut",
    });
  }, [checkins.data, sessions.data, today, trackLibido, trainingPhase]);

  // Closing hides today's set of signs; a new sign shows the card again.
  const stamp = `${today}:${safety.signals.map((s) => s.key).join(",")}`;
  if (safety.level !== "caution" || dismissed === stamp) return null;

  return (
    <section
      aria-label="セーフティネット"
      className="surface border-warn/70 flex flex-col gap-3 border px-4 py-3"
    >
      <div className="flex items-start justify-between gap-2">
        <h2 className="text-warn flex items-center gap-2 text-base font-bold">
          <ShieldAlert aria-hidden className="size-5" />
          体のサインが重なっています
        </h2>
        <button
          type="button"
          aria-label="今日は閉じる"
          onClick={() => {
            setDismissed(stamp);
            void kvSet(DISMISS_KEY, stamp);
          }}
          className="text-ghost -mt-2 -mr-2 flex size-10 items-center justify-center"
        >
          <X className="size-4" />
        </button>
      </div>
      <ul className="flex flex-col gap-2.5">
        {safety.signals.map((s) => (
          <li key={s.key} className="border-warn/50 flex flex-col gap-0.5 border-l-2 pl-3">
            <span className="text-sm font-bold">{s.title}</span>
            <span className="text-muted text-xs leading-relaxed">{s.reason}</span>
            <span className="text-sm leading-relaxed">→ {s.tip}</span>
          </li>
        ))}
      </ul>
      <p className="text-ghost text-xs leading-relaxed">
        普段のあなたの記録と比べた目安です。診断ではありません。痛みが強い・続く場合は医療機関に相談してください。
      </p>
      <Link
        href="/condition"
        className="text-accent self-start text-sm underline underline-offset-4"
      >
        今日の体調を記録・見直す
      </Link>
    </section>
  );
}
