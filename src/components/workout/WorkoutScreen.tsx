"use client";

import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { ExercisePicker } from "@/components/training/ExercisePicker";
import { Button } from "@/components/ui/button";
import { kvSet } from "@/lib/offline/db";
import {
  previousSetsByExercise,
  useExerciseHistory,
  useExerciseNotes,
  useExercises,
} from "@/lib/queries/training";
import { plateauNote, repPRIndexes, sessionBests } from "@/lib/plateau";
import { bestE1RM, signedDiff } from "@/lib/progress";
import { bestByExercise, type SetType } from "@/lib/strength";
import { useActiveWorkout } from "@/lib/useActiveWorkout";
import { cn } from "@/lib/utils";
import {
  DEFAULT_REST_SEC,
  DEFAULT_SETS,
  emptySet,
  prIndexes,
  summarize,
  toRows,
  type DraftSet,
} from "@/lib/workout";
import { ExerciseNote } from "./ExerciseNote";
import { RestTimer } from "./RestTimer";
import { RestPicker } from "@/components/rest/RestPicker";
import { useRestTimer } from "@/components/providers/RestTimerProvider";
import { PlateauCard } from "./PlateauCard";
import type { SetValues } from "./SetPicker";
import { prevFor, SetTable } from "./SetTable";
import { StepperBar } from "./StepperBar";

export const SUMMARY_KEY = "lastWorkoutSummary";

export type StoredSummary = {
  workoutId: string;
  title: string;
  durationMin: number;
  volumeKg: number;
  setCount: number;
  prs: { name: string; weightKg: number; reps: number }[];
  repPrs?: { name: string; weightKg: number; reps: number }[];
  /** Working volume of the same exercises last time, for the comparison. */
  prevVolumeKg?: number;
};

const num = (s: string) => (s.trim() === "" || !Number.isFinite(Number(s)) ? null : Number(s));

export function WorkoutScreen() {
  const router = useRouter();
  const { userId, showRir, trainingPhase, plateauAlerts, mutedExercises } = useAppData();
  const { write } = useSync();
  const { workout, loaded, update, clear } = useActiveWorkout();
  const { data: exercises = [] } = useExercises();
  const { data: notes } = useExerciseNotes();
  const ids = useMemo(() => workout?.exercises.map((e) => e.exerciseId) ?? [], [workout]);
  const history = useExerciseHistory(ids);
  const previous = useMemo(() => previousSetsByExercise(history.data ?? []), [history.data]);
  const names = useMemo(() => new Map(exercises.map((e) => [e.id, e.name_ja])), [exercises]);
  const pastByExercise = useMemo(() => {
    const map = new Map<
      string,
      {
        workoutId: string;
        setType: string;
        weightKg: number | null;
        reps: number | null;
        doneAt: string | null;
      }[]
    >();
    for (const h of history.data ?? []) {
      const list = map.get(h.exercise_id) ?? [];
      list.push({
        workoutId: h.workout_id,
        setType: h.set_type,
        weightKg: h.weight_kg,
        reps: h.reps,
        doneAt: h.done_at,
      });
      map.set(h.exercise_id, list);
    }
    return map;
  }, [history.data]);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [focusRow, setFocusRow] = useState<number | null>(null);
  const [picking, setPicking] = useState(false);
  const [finishing, setFinishing] = useState(false);

  const restTimer = useRestTimer();

  if (!loaded) return <div className="surface h-96 animate-pulse" aria-busy />;
  if (!workout) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-muted text-sm">進行中のワークアウトはありません</p>
        <Button onClick={() => router.push("/training")}>トレへ戻る</Button>
      </div>
    );
  }

  const current = workout.exercises[workout.current];
  const prevSets = current ? (previous.get(current.exerciseId) ?? []) : [];
  const prevBest = bestE1RM(
    prevSets
      .filter((p) => p.set_type !== "warmup")
      .map((p) => ({ weightKg: p.weight_kg, reps: p.reps })),
  );
  const nowBest = current
    ? bestE1RM(
        current.sets
          .filter((x) => x.doneAt && x.setType !== "warmup")
          .map((x) => ({ weightKg: num(x.weight), reps: num(x.reps) })),
      )
    : null;
  const repPrsFor = (ex: NonNullable<typeof current>) =>
    repPRIndexes(
      ex.sets.map((x) => ({
        setType: x.setType,
        weightKg: num(x.weight),
        reps: num(x.reps),
        done: !!x.doneAt,
      })),
      pastByExercise.get(ex.exerciseId) ?? [],
    );
  const currentRepPrs = current ? repPrsFor(current) : [];
  const note =
    current && plateauAlerts && !mutedExercises.includes(current.exerciseId)
      ? plateauNote(sessionBests(pastByExercise.get(current.exerciseId) ?? []), trainingPhase)
      : null;
  const firstOpen = current ? current.sets.findIndex((s) => !s.doneAt) : -1;
  const activeIndex =
    focusRow !== null && current?.sets[focusRow] && !current.sets[focusRow]!.doneAt
      ? focusRow
      : firstOpen;

  const patchSet = (i: number, patch: Partial<DraftSet>) =>
    update((w) => ({
      ...w,
      exercises: w.exercises.map((ex, j) =>
        j === w.current
          ? { ...ex, sets: ex.sets.map((s, k) => (k === i ? { ...s, ...patch } : s)) }
          : ex,
      ),
    }));

  function toggle(i: number, picked?: SetValues) {
    if (!current) return;
    const s = current.sets[i]!;
    if (s.doneAt && !picked) return patchSet(i, { doneAt: null });
    const prev = prevFor(prevSets, i);
    // Numbers picked in the same tap win over the (not yet updated) draft.
    const weight = picked
      ? String(picked.weight)
      : s.weight || (prev?.weight_kg != null ? String(prev.weight_kg) : "");
    const reps = picked
      ? String(picked.reps)
      : s.reps || (prev?.reps != null ? String(prev.reps) : "");
    const rir =
      picked && showRir ? String(picked.rir) : s.rir || (prev?.rir != null ? String(prev.rir) : "");
    if (!weight || !reps) {
      setFocusRow(i);
      return;
    }
    navigator.vibrate?.(30);
    setFlashId(s.id);
    setTimeout(() => setFlashId((id) => (id === s.id ? null : id)), 600);
    setFocusRow(null);
    restTimer.start();
    update((w) => ({
      ...w,
      exercises: w.exercises.map((ex, j) =>
        j === w.current
          ? {
              ...ex,
              sets: ex.sets.map((x, k) =>
                k === i ? { ...x, weight, reps, rir, doneAt: new Date().toISOString() } : x,
              ),
            }
          : ex,
      ),
    }));
  }

  function stepValue(key: "weight" | "reps", value: number) {
    if (activeIndex < 0) return;
    patchSet(activeIndex, { [key]: String(value) });
  }

  async function finish() {
    if (!workout) return;
    const doneCount = workout.exercises.reduce(
      (n, e) => n + e.sets.filter((s) => s.doneAt).length,
      0,
    );
    if (doneCount === 0) {
      if (window.confirm("確定したセットがありません。このワークアウトを破棄しますか？")) {
        await clear();
        router.push("/training");
      }
      return;
    }
    setFinishing(true);
    const best = bestByExercise(
      (history.data ?? []).map((h) => ({
        exerciseId: h.exercise_id,
        setType: h.set_type as SetType,
        weightKg: h.weight_kg,
        reps: h.reps,
      })),
    );
    const endedAt = new Date();
    const summary = summarize(workout, best, endedAt);
    const rows = toRows(workout, userId, prIndexes(workout, best), endedAt.toISOString());
    const stored: StoredSummary = {
      workoutId: workout.id,
      title: workout.title,
      durationMin: summary.durationMin,
      volumeKg: summary.volumeKg,
      setCount: summary.setCount,
      prevVolumeKg: Math.round(
        workout.exercises.reduce(
          (sum, ex) =>
            sum +
            (previous.get(ex.exerciseId) ?? [])
              .filter((p) => p.set_type !== "warmup")
              .reduce((v, p) => v + (p.weight_kg ?? 0) * (p.reps ?? 0), 0),
          0,
        ),
      ),
      prs: summary.prs.map((p) => ({
        name: names.get(p.exerciseId) ?? "",
        weightKg: p.weightKg,
        reps: p.reps,
      })),
      repPrs: workout.exercises.flatMap((ex) =>
        repPrsFor(ex)
          .map((i) => ex.sets[i]!)
          .map((s) => ({
            name: names.get(ex.exerciseId) ?? "",
            weightKg: num(s.weight)!,
            reps: num(s.reps)!,
          }))
          .filter(
            (r) =>
              !summary.prs.some(
                (p) =>
                  names.get(p.exerciseId) === r.name &&
                  p.weightKg === r.weightKg &&
                  p.reps === r.reps,
              ),
          ),
      ),
    };
    await kvSet(SUMMARY_KEY, stored);
    await write({ table: "workouts", kind: "upsert", payload: rows.workout });
    if (rows.sets.length > 0) {
      await write({ table: "workout_sets", kind: "upsert", payload: rows.sets });
    }
    await clear();
    router.push("/training/workout/done");
  }

  async function discard() {
    if (!window.confirm("このワークアウトを破棄します。入力した内容は残りません。")) return;
    await clear();
    router.push("/training");
  }

  const active = current && activeIndex >= 0 ? current.sets[activeIndex] : undefined;
  const activePrev = prevFor(prevSets, activeIndex);

  return (
    <div className={cn("flex flex-col gap-3", restTimer.timer ? "pb-56" : "pb-24")}>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {workout.exercises.map((ex, i) => {
          const done = ex.sets.filter((s) => s.doneAt).length;
          return (
            <button
              key={ex.exerciseId}
              type="button"
              onClick={() => {
                setFocusRow(null);
                update((w) => ({ ...w, current: i }));
              }}
              aria-current={i === workout.current}
              className={cn(
                "h-10 shrink-0 rounded-md border px-3 text-xs whitespace-nowrap",
                i === workout.current ? "border-accent text-fg" : "border-border text-muted",
              )}
            >
              {names.get(ex.exerciseId) ?? "…"}
              <span className="num ml-1.5">
                {done}/{ex.sets.length}
              </span>
            </button>
          );
        })}
        <button
          type="button"
          aria-label="種目を追加"
          onClick={() => setPicking(true)}
          className="border-border text-accent flex size-10 shrink-0 items-center justify-center rounded-md border"
        >
          <Plus className="size-4" />
        </button>
      </div>

      {current ? (
        <>
          <div>
            <h1 className="text-4xl leading-tight font-black">
              {names.get(current.exerciseId) ?? "…"}
            </h1>
            {(nowBest !== null || prevBest !== null) && (
              <p className="num text-muted text-sm">
                {nowBest !== null ? (
                  <>
                    推定1RM <span className="text-fg">{nowBest.toFixed(1)}</span>kg
                    {prevBest !== null && (
                      <span
                        className={cn("ml-1", nowBest > prevBest ? "text-accent" : "text-ghost")}
                      >
                        （前回 {signedDiff(nowBest, prevBest)}）
                      </span>
                    )}
                  </>
                ) : (
                  <span className="text-ghost">前回の推定1RM {prevBest!.toFixed(1)}kg</span>
                )}
              </p>
            )}
            {note && (
              <div className="mt-2">
                <PlateauCard key={current.exerciseId} note={note} exerciseId={current.exerciseId} />
              </div>
            )}
            <ExerciseNote
              key={current.exerciseId}
              exerciseId={current.exerciseId}
              note={notes?.[current.exerciseId] ?? ""}
            />
          </div>

          <SetTable
            sets={current.sets}
            previous={prevSets}
            activeIndex={activeIndex}
            flashId={flashId}
            onChange={patchSet}
            onToggle={toggle}
            onFocusRow={setFocusRow}
            showRir={showRir}
            repPrs={currentRepPrs}
          />

          <div className="flex gap-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() =>
                update((w) => ({
                  ...w,
                  exercises: w.exercises.map((ex, j) =>
                    j === w.current ? { ...ex, sets: [...ex.sets, emptySet()] } : ex,
                  ),
                }))
              }
            >
              ＋ セット
            </Button>
            <Button
              variant="ghost"
              className="flex-1"
              disabled={current.sets.length === 0 || !!current.sets.at(-1)?.doneAt}
              onClick={() =>
                update((w) => ({
                  ...w,
                  exercises: w.exercises.map((ex, j) =>
                    j === w.current ? { ...ex, sets: ex.sets.slice(0, -1) } : ex,
                  ),
                }))
              }
            >
              − セット
            </Button>
          </div>
        </>
      ) : (
        <div className="surface flex flex-col gap-3 px-4 py-6">
          <p className="text-sm">種目を追加して始めましょう</p>
          <Button onClick={() => setPicking(true)}>＋ 種目を追加</Button>
        </div>
      )}

      <section className="surface flex flex-col gap-2 px-3 py-3">
        <span className="text-muted text-xs">レストタイマー（✓ で選んだ時間が始まります）</span>
        <RestPicker compact />
      </section>

      <div className="mt-4 flex flex-col gap-2">
        <Button size="lg" disabled={finishing} onClick={finish}>
          ワークアウト完了
        </Button>
        <Button variant="ghost" onClick={discard}>
          破棄
        </Button>
      </div>

      <div className="kb-open:hidden fixed inset-x-0 bottom-[calc(4rem+env(safe-area-inset-bottom))] z-30">
        <div className="mx-auto flex max-w-[480px] flex-col gap-2 px-4 pb-2">
          {active && (
            <StepperBar
              weight={num(active.weight) ?? activePrev?.weight_kg ?? null}
              reps={num(active.reps) ?? activePrev?.reps ?? null}
              onWeight={(v) => stepValue("weight", v)}
              onReps={(v) => stepValue("reps", v)}
            />
          )}
          <RestTimer />
        </div>
      </div>

      {picking && (
        <ExercisePicker
          exclude={ids}
          onClose={() => setPicking(false)}
          onPick={(e) => {
            update((w) => ({
              ...w,
              current: w.exercises.length,
              exercises: [
                ...w.exercises,
                {
                  exerciseId: e.id,
                  restSec: DEFAULT_REST_SEC,
                  sets: Array.from({ length: DEFAULT_SETS }, () => emptySet()),
                },
              ],
            }));
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}
