"use client";

import { useQuery } from "@tanstack/react-query";
import { getSupabase } from "@/lib/supabase/client";

export type Exercise = {
  id: string;
  user_id: string | null;
  name_ja: string;
  name_en: string | null;
  muscle_groups: string[];
  equipment: string | null;
};

export type RoutineExercise = {
  id: string;
  exercise_id: string;
  order_idx: number;
  target_sets: number | null;
  target_reps: number | null;
  target_rir: number | null;
  rest_sec: number | null;
};

export type Routine = {
  id: string;
  name: string;
  order_idx: number;
  weekdays: number[];
  routine_exercises: RoutineExercise[];
};

export type WorkoutSummary = {
  id: string;
  routine_id: string | null;
  started_at: string;
  ended_at: string | null;
};

export type HistorySet = {
  workout_id: string;
  exercise_id: string;
  set_no: number;
  set_type: string;
  weight_kg: number | null;
  reps: number | null;
  rir: number | null;
  done_at: string | null;
};

export const trainingKeys = {
  exercises: ["exercises"] as const,
  routines: ["routines"] as const,
  workouts: (from: string, to: string) => ["workouts", from, to] as const,
  history: (exerciseIds: string[]) => ["history", [...exerciseIds].sort().join(",")] as const,
  notes: ["exercise-notes"] as const,
};

async function unwrap<T>(p: PromiseLike<{ data: T | null; error: unknown }>): Promise<T> {
  const { data, error } = await p;
  if (error) throw error;
  return data as T;
}

export function useExercises() {
  return useQuery({
    queryKey: trainingKeys.exercises,
    staleTime: 10 * 60_000,
    queryFn: () =>
      unwrap<Exercise[]>(
        getSupabase()
          .from("exercises")
          .select("id, user_id, name_ja, name_en, muscle_groups, equipment")
          .order("name_ja"),
      ),
  });
}

export function useRoutines() {
  return useQuery({
    queryKey: trainingKeys.routines,
    queryFn: async () => {
      const rows = await unwrap<Routine[]>(
        getSupabase()
          .from("routines")
          .select(
            "id, name, order_idx, weekdays, routine_exercises(id, exercise_id, order_idx, target_sets, target_reps, target_rir, rest_sec)",
          )
          .order("order_idx")
          .order("created_at"),
      );
      for (const r of rows) r.routine_exercises.sort((a, b) => a.order_idx - b.order_idx);
      return rows;
    },
  });
}

/** Workouts started between two ISO timestamps. */
export function useWorkouts(from: string, to: string) {
  return useQuery({
    queryKey: trainingKeys.workouts(from, to),
    queryFn: () =>
      unwrap<WorkoutSummary[]>(
        getSupabase()
          .from("workouts")
          .select("id, routine_id, started_at, ended_at")
          .gte("started_at", from)
          .lt("started_at", to)
          .order("started_at", { ascending: false }),
      ),
  });
}

/** Recent logged sets for the given exercises (for "previous" ghosts and PR baselines). */
export function useExerciseHistory(exerciseIds: string[]) {
  return useQuery({
    queryKey: trainingKeys.history(exerciseIds),
    enabled: exerciseIds.length > 0,
    queryFn: () =>
      unwrap<HistorySet[]>(
        getSupabase()
          .from("workout_sets")
          .select("workout_id, exercise_id, set_no, set_type, weight_kg, reps, rir, done_at")
          .in("exercise_id", exerciseIds)
          .not("done_at", "is", null)
          .order("done_at", { ascending: false })
          .limit(2000),
      ),
  });
}

export function useExerciseNotes() {
  return useQuery({
    queryKey: trainingKeys.notes,
    queryFn: async () => {
      const rows = await unwrap<{ exercise_id: string; note: string }[]>(
        getSupabase().from("exercise_notes").select("exercise_id, note"),
      );
      return new Map(rows.map((r) => [r.exercise_id, r.note]));
    },
  });
}

/** Sets from the most recent workout that included each exercise, ordered by set number. */
export function previousSetsByExercise(history: HistorySet[]): Map<string, HistorySet[]> {
  const latestWorkout = new Map<string, string>();
  for (const s of history) {
    if (!latestWorkout.has(s.exercise_id)) latestWorkout.set(s.exercise_id, s.workout_id);
  }
  const result = new Map<string, HistorySet[]>();
  for (const s of history) {
    if (latestWorkout.get(s.exercise_id) !== s.workout_id) continue;
    const list = result.get(s.exercise_id) ?? [];
    list.push(s);
    result.set(s.exercise_id, list);
  }
  for (const list of result.values()) list.sort((a, b) => a.set_no - b.set_no);
  return result;
}
