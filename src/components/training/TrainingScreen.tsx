"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { addDaysISO, todayISO } from "@/lib/prep";
import { jstMidnight, useSessions } from "@/lib/queries/training";
import {
  BODY_PARTS,
  exercisesOf,
  jstDate,
  lastSessionFor,
  partLabel,
  partsText,
  planFromSession,
  sessionParts,
  type BodyPart,
} from "@/lib/sessions";
import { readActiveWorkout } from "@/lib/useActiveWorkout";
import { cn } from "@/lib/utils";
import type { ActiveWorkout } from "@/lib/workout";
import { RestPicker } from "@/components/rest/RestPicker";
import { RestTimer } from "@/components/workout/RestTimer";
import { MonthCalendar } from "./MonthCalendar";
import { startWorkout } from "./startWorkout";

const pad = (n: number) => String(n).padStart(2, "0");
const fmtSet = (w: number | null, r: number | null) => `${w ?? "—"}×${r ?? "—"}`;

function daysAgo(date: string, today: string): string {
  const d = Math.round(
    (new Date(`${today}T00:00:00`).getTime() - new Date(`${date}T00:00:00`).getTime()) / 86_400_000,
  );
  return d === 0 ? "今日" : d === 1 ? "昨日" : `${d}日前`;
}

export function TrainingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const today = todayISO();
  const [ty, tm, td] = today.split("-").map(Number) as [number, number, number];
  const [month, setMonth] = useState({ y: ty, m: tm });
  const [part, setPart] = useState<BodyPart | null>(null);
  const [active, setActive] = useState<ActiveWorkout | null>(null);
  const [starting, setStarting] = useState(false);

  const recent = useSessions(
    jstMidnight(addDaysISO(today, -180)),
    jstMidnight(addDaysISO(today, 1)),
  );
  const monthStart = `${month.y}-${pad(month.m)}-01`;
  const nextMonth = month.m === 12 ? `${month.y + 1}-01-01` : `${month.y}-${pad(month.m + 1)}-01`;
  const monthSessions = useSessions(jstMidnight(monthStart), jstMidnight(nextMonth));

  useEffect(() => {
    void readActiveWorkout().then(setActive);
  }, []);

  const labels = useMemo(() => {
    const byDay = new Map<number, BodyPart[]>();
    for (const s of monthSessions.data ?? []) {
      const day = Number(jstDate(s.started_at).split("-")[2]);
      const merged = [...(byDay.get(day) ?? []), ...sessionParts(s)];
      byDay.set(day, [...new Set(merged)].slice(0, 3));
    }
    return new Map([...byDay].map(([d, parts]) => [d, partsText(parts) || "トレ"]));
  }, [monthSessions.data]);

  const last = part && recent.data ? lastSessionFor(recent.data, part) : null;
  const isCurrentMonth = month.y === ty && month.m === tm;

  async function begin(title: string, plan: ReturnType<typeof planFromSession>) {
    setStarting(true);
    await startWorkout(queryClient, { title, routineId: null, plan });
    router.push("/training/workout");
  }

  function shiftMonth(delta: number) {
    setMonth(({ y, m }) => {
      const n = m + delta;
      return n < 1 ? { y: y - 1, m: 12 } : n > 12 ? { y: y + 1, m: 1 } : { y, m: n };
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {active && (
        <section className="surface border-l-accent flex flex-col gap-3 border-l-2 px-4 py-4">
          <p className="text-xl font-bold">{active.title} 実施中</p>
          <Button asChild size="lg">
            <Link href="/training/workout">再開</Link>
          </Button>
        </section>
      )}

      {!active && (
        <section className="flex flex-col gap-3">
          <h2 className="text-xl font-bold">トレーニングを始める</h2>
          <div className="grid grid-cols-3 gap-2">
            {BODY_PARTS.map((p) => (
              <button
                key={p.key}
                type="button"
                aria-pressed={part === p.key}
                onClick={() => setPart(part === p.key ? null : p.key)}
                className={cn(
                  "h-14 rounded-md border text-lg font-bold",
                  part === p.key ? "border-accent bg-accent text-bg" : "border-border text-fg",
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {part && (
            <div className="surface flex flex-col gap-3 px-4 py-4">
              {recent.isPending ? (
                <p className="text-muted text-sm">前回の記録を読み込み中…</p>
              ) : last ? (
                <>
                  <p className="text-sm">
                    前回の{partLabel(part)}トレ{" "}
                    <span className="num text-accent">
                      {jstDate(last.started_at).slice(5).replace("-", "/")}
                    </span>
                    <span className="text-ghost ml-2 text-xs">
                      {daysAgo(jstDate(last.started_at), today)}
                    </span>
                  </p>
                  <ul className="flex flex-col gap-1.5">
                    {exercisesOf(last).map((e) => (
                      <li key={e.exerciseId} className="flex flex-col">
                        <span className="text-base">{e.name}</span>
                        <span className="num text-muted text-sm">
                          {e.sets
                            .filter((s) => s.set_type !== "warmup")
                            .map((s) => fmtSet(s.weight_kg, s.reps))
                            .join(" ・ ")}
                        </span>
                      </li>
                    ))}
                  </ul>
                  <Button
                    size="lg"
                    disabled={starting}
                    onClick={() =>
                      begin(partsText(sessionParts(last)) || partLabel(part), planFromSession(last))
                    }
                  >
                    同じ内容で始める
                  </Button>
                  <Button
                    variant="ghost"
                    disabled={starting}
                    onClick={() => begin(partLabel(part), [])}
                  >
                    種目を選んで始める
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-muted text-sm">{partLabel(part)}の記録はまだありません</p>
                  <Button size="lg" disabled={starting} onClick={() => begin(partLabel(part), [])}>
                    種目を選んで始める
                  </Button>
                </>
              )}
            </div>
          )}

          {!part && (
            <Button variant="ghost" disabled={starting} onClick={() => begin("フリー", [])}>
              部位を選ばずに始める
            </Button>
          )}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-bold">レストタイマー</h2>
        <RestTimer />
        <RestPicker />
      </section>

      <section className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">
            <span className="num">{month.y}</span>年<span className="num">{month.m}</span>月
          </h2>
          <div className="flex">
            <button
              type="button"
              aria-label="前の月"
              onClick={() => shiftMonth(-1)}
              className="text-muted flex size-12 items-center justify-center"
            >
              <ChevronLeft className="size-5" />
            </button>
            <button
              type="button"
              aria-label="次の月"
              disabled={isCurrentMonth}
              onClick={() => shiftMonth(1)}
              className="text-muted flex size-12 items-center justify-center disabled:opacity-30"
            >
              <ChevronRight className="size-5" />
            </button>
          </div>
        </div>
        <MonthCalendar
          year={month.y}
          month={month.m}
          labels={labels}
          today={isCurrentMonth ? td : undefined}
          lastDay={isCurrentMonth ? td : undefined}
          hrefFor={(d) => `/report/${month.y}-${pad(month.m)}-${pad(d)}`}
        />
        <p className="text-ghost text-xs">
          日付をタップすると、その日のレポート（トレ・食事・体調）を開きます
        </p>
      </section>
    </div>
  );
}
