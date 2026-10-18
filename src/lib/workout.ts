import { detectPRs, totalVolume, workingSetCount, type LoggedSet, type SetType } from "./strength";

export const DEFAULT_REST_SEC = 90;
export const DEFAULT_SETS = 3;

export type DraftSet = {
  id: string;
  setType: SetType;
  weight: string;
  reps: string;
  rir: string;
  doneAt: string | null;
  /** Body weight used for a bodyweight set; `weight` is then the total (body + added). */
  bw?: number | null;
};

export type DraftExercise = {
  exerciseId: string;
  restSec: number;
  sets: DraftSet[];
};

export type ActiveWorkout = {
  id: string;
  routineId: string | null;
  title: string;
  startedAt: string;
  current: number;
  exercises: DraftExercise[];
  rest: { endsAt: number; totalSec: number } | null;
  /** Set when reopening a finished workout: keep its end time, and drop sets removed now. */
  editing?: { endedAt: string; savedSetIds: string[] } | null;
};

export type PlanItem = {
  exerciseId: string;
  targetSets?: number | null;
  restSec?: number | null;
};

const newId = () => crypto.randomUUID();

export function emptySet(setType: SetType = "normal"): DraftSet {
  return { id: newId(), setType, weight: "", reps: "", rir: "", doneAt: null };
}

/** Start a workout from a plan; set count follows the target, else last time, else 3. */
export function createWorkout(opts: {
  title: string;
  routineId: string | null;
  plan: PlanItem[];
  previousSetCount: (exerciseId: string) => number;
  now?: Date;
}): ActiveWorkout {
  return {
    id: newId(),
    routineId: opts.routineId,
    title: opts.title,
    startedAt: (opts.now ?? new Date()).toISOString(),
    current: 0,
    rest: null,
    exercises: opts.plan.map((p) => {
      const count = p.targetSets || opts.previousSetCount(p.exerciseId) || DEFAULT_SETS;
      return {
        exerciseId: p.exerciseId,
        restSec: p.restSec ?? DEFAULT_REST_SEC,
        sets: Array.from({ length: count }, () => emptySet()),
      };
    }),
  };
}

const num = (s: string) => {
  if (s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

/** Completed sets as logged values, in workout order. */
export function loggedSets(w: ActiveWorkout): (LoggedSet & { draft: DraftSet; setNo: number })[] {
  return w.exercises.flatMap((ex) =>
    ex.sets
      .map((s, i) => ({ s, setNo: i + 1 }))
      .filter(({ s }) => s.doneAt)
      .map(({ s, setNo }) => ({
        exerciseId: ex.exerciseId,
        setType: s.setType,
        weightKg: num(s.weight),
        reps: num(s.reps),
        draft: s,
        setNo,
      })),
  );
}

export type WorkoutSummary = {
  durationMin: number;
  volumeKg: number;
  setCount: number;
  prs: { exerciseId: string; weightKg: number; reps: number }[];
};

export function summarize(
  w: ActiveWorkout,
  previousBest: Map<string, number>,
  endedAt: Date = new Date(),
): WorkoutSummary {
  const sets = loggedSets(w);
  return {
    durationMin: Math.max(
      1,
      Math.round((endedAt.getTime() - new Date(w.startedAt).getTime()) / 60_000),
    ),
    volumeKg: Math.round(totalVolume(sets)),
    setCount: workingSetCount(sets),
    prs: detectPRs(sets, previousBest).map((i) => ({
      exerciseId: sets[i]!.exerciseId,
      weightKg: sets[i]!.weightKg!,
      reps: sets[i]!.reps!,
    })),
  };
}

/** Rows to write when the workout is finished. */
export function toRows(w: ActiveWorkout, userId: string, prIndexes: number[], endedAt: string) {
  const sets = loggedSets(w);
  const pr = new Set(prIndexes);
  return {
    workout: {
      id: w.id,
      user_id: userId,
      routine_id: w.routineId,
      started_at: w.startedAt,
      ended_at: endedAt,
    },
    sets: sets.map((s, i) => ({
      id: s.draft.id,
      user_id: userId,
      workout_id: w.id,
      exercise_id: s.exerciseId,
      set_no: s.setNo,
      set_type: s.setType,
      weight_kg: s.weightKg,
      reps: s.reps === null ? null : Math.round(s.reps),
      rir: num(s.draft.rir) === null ? null : Math.round(num(s.draft.rir)!),
      is_pr: pr.has(i),
      done_at: s.draft.doneAt,
      bodyweight_kg: s.draft.bw ?? null,
    })),
  };
}

/** Sets saved before (when editing) that are no longer done or no longer there. */
export function removedSetIds(w: ActiveWorkout): string[] {
  if (!w.editing) return [];
  const kept = new Set(loggedSets(w).map((s) => s.draft.id));
  return w.editing.savedSetIds.filter((id) => !kept.has(id));
}

export type SavedSet = {
  id: string;
  exercise_id: string;
  set_no: number;
  set_type: string;
  weight_kg: number | null;
  reps: number | null;
  rir: number | null;
  done_at: string | null;
  bodyweight_kg?: number | null;
};

const str = (n: number | null | undefined) => (n == null ? "" : String(n));

/** A finished workout reopened for editing, exercises in the order they were done. */
export function workoutFromSaved(
  saved: { id: string; title: string; started_at: string; ended_at: string | null },
  sets: SavedSet[],
  now: Date = new Date(),
): ActiveWorkout {
  const order: string[] = [];
  const byExercise = new Map<string, SavedSet[]>();
  const sorted = [...sets].sort(
    (a, b) => (a.done_at ?? "").localeCompare(b.done_at ?? "") || a.set_no - b.set_no,
  );
  for (const s of sorted) {
    if (!byExercise.has(s.exercise_id)) {
      order.push(s.exercise_id);
      byExercise.set(s.exercise_id, []);
    }
    byExercise.get(s.exercise_id)!.push(s);
  }
  return {
    id: saved.id,
    routineId: null,
    title: saved.title,
    startedAt: saved.started_at,
    current: 0,
    rest: null,
    editing: { endedAt: saved.ended_at ?? now.toISOString(), savedSetIds: sets.map((s) => s.id) },
    exercises: order.map((exerciseId) => ({
      exerciseId,
      restSec: DEFAULT_REST_SEC,
      sets: byExercise
        .get(exerciseId)!
        .sort((a, b) => a.set_no - b.set_no)
        .map((s) => ({
          id: s.id,
          setType: s.set_type as SetType,
          weight: str(s.weight_kg),
          reps: str(s.reps),
          rir: str(s.rir),
          doneAt: s.done_at ?? now.toISOString(),
          bw: s.bodyweight_kg ?? null,
        })),
    })),
  };
}

/** Indexes (into loggedSets) of PR sets, for toRows. */
export function prIndexes(w: ActiveWorkout, previousBest: Map<string, number>): number[] {
  return detectPRs(loggedSets(w), previousBest);
}

/** Body weight for a training day: that day's record, else the latest one before it. */
export function bodyweightOn(
  records: { date: string; weight_kg: number | null }[],
  date: string,
): { kg: number; date: string } | null {
  const hit = records
    .filter((r) => r.weight_kg != null && r.date <= date)
    .sort((a, b) => b.date.localeCompare(a.date))[0];
  return hit ? { kg: hit.weight_kg!, date: hit.date } : null;
}
