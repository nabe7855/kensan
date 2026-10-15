"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Plus } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { addDaysISO, todayISO } from "@/lib/prep";
import { useExercises, useRoutines, useWorkouts, type Routine } from "@/lib/queries/training";
import { routineForDate } from "@/lib/routines";
import { readActiveWorkout } from "@/lib/useActiveWorkout";
import type { ActiveWorkout } from "@/lib/workout";
import { MonthCalendar } from "./MonthCalendar";
import { startWorkout } from "./startWorkout";

const jstMidnight = (date: string) => `${date}T00:00:00+09:00`;

const jstDate = (iso: string) =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date(iso));

export function TrainingScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const today = todayISO();
  const [y, m, d] = today.split("-").map(Number) as [number, number, number];
  const pad = (n: number) => String(n).padStart(2, "0");
  const monthStart = jstMidnight(`${y}-${pad(m)}-01`);
  const monthEnd = jstMidnight(m === 12 ? `${y + 1}-01-01` : `${y}-${pad(m + 1)}-01`);

  const routines = useRoutines();
  const exercises = useExercises();
  const monthWorkouts = useWorkouts(monthStart, monthEnd);
  const recent = useWorkouts(jstMidnight(addDaysISO(today, -120)), monthEnd);
  const [active, setActive] = useState<ActiveWorkout | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    void readActiveWorkout().then(setActive);
  }, []);

  const names = useMemo(
    () => new Map(exercises.data?.map((e) => [e.id, e.name_ja]) ?? []),
    [exercises.data],
  );
  const lastByRoutine = useMemo(() => {
    const map = new Map<string, string>();
    for (const w of recent.data ?? []) {
      if (w.routine_id && !map.has(w.routine_id)) map.set(w.routine_id, jstDate(w.started_at));
    }
    return map;
  }, [recent.data]);
  const marked = useMemo(
    () =>
      new Set((monthWorkouts.data ?? []).map((w) => Number(jstDate(w.started_at).split("-")[2]))),
    [monthWorkouts.data],
  );

  async function begin(routine: Routine | null) {
    setStarting(true);
    await startWorkout(queryClient, {
      title: routine?.name ?? "フリー",
      routineId: routine?.id ?? null,
      plan:
        routine?.routine_exercises.map((re) => ({
          exerciseId: re.exercise_id,
          targetSets: re.target_sets,
          restSec: re.rest_sec,
        })) ?? [],
    });
    router.push("/training/workout");
  }

  const todayRoutine = routines.data ? routineForDate(routines.data, today) : null;

  return (
    <div className="flex flex-col gap-6">
      {active ? (
        <section className="surface border-l-accent flex flex-col gap-3 border-l-2 px-4 py-4">
          <p className="text-xl font-bold">{active.title} 実施中</p>
          <Button asChild size="lg">
            <Link href="/training/workout">再開</Link>
          </Button>
        </section>
      ) : todayRoutine ? (
        <section className="surface border-l-accent flex flex-col gap-3 border-l-2 px-4 py-4">
          <p className="num text-3xl">今日: {todayRoutine.name}</p>
          <p className="text-muted text-sm leading-relaxed">
            {todayRoutine.routine_exercises.map((re) => names.get(re.exercise_id)).join(" ・ ")}
          </p>
          <Button
            size="lg"
            className="self-end px-10"
            disabled={starting}
            onClick={() => begin(todayRoutine)}
          >
            開始
          </Button>
        </section>
      ) : null}

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">ルーティン</h2>
        {routines.isPending ? (
          <div className="surface h-24 animate-pulse" aria-busy />
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {routines.data?.map((r) => (
              <Link
                key={r.id}
                href={`/training/routines/${r.id}`}
                className="surface flex min-h-20 flex-col justify-center px-4 py-3"
              >
                <span className="num truncate text-2xl">{r.name}</span>
                <span className="text-muted mt-1 text-xs">
                  {r.routine_exercises.length}種目
                  {lastByRoutine.has(r.id) &&
                    ` ・ 前回 ${lastByRoutine.get(r.id)!.slice(5).replace("-", "/")}`}
                </span>
              </Link>
            ))}
          </div>
        )}
        <Button asChild variant="outline" className="text-accent">
          <Link href="/training/routines/new">
            <Plus className="size-4" aria-hidden /> ルーティンを作る
          </Link>
        </Button>
        {!active && (
          <Button variant="ghost" disabled={starting} onClick={() => begin(null)}>
            ルーティンなしで始める
          </Button>
        )}
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-xl font-bold">今月</h2>
        <MonthCalendar year={y} month={m} marked={marked} today={d} />
      </section>
    </div>
  );
}
