"use client";

import type { QueryClient } from "@tanstack/react-query";
import { saveActiveWorkout } from "@/lib/useActiveWorkout";
import { createWorkout, type PlanItem } from "@/lib/workout";
import {
  fetchHistory,
  previousSetsByExercise,
  trainingKeys,
  type HistorySet,
} from "@/lib/queries/training";

/** Create a workout from a plan and store it locally. Falls back to defaults when offline. */
export async function startWorkout(
  queryClient: QueryClient,
  opts: { title: string; routineId: string | null; plan: PlanItem[] },
) {
  const ids = opts.plan.map((p) => p.exerciseId);
  let previous = new Map<string, HistorySet[]>();
  if (ids.length > 0) {
    try {
      const history = await queryClient.fetchQuery({
        queryKey: trainingKeys.history(ids),
        queryFn: () => fetchHistory(ids),
      });
      previous = previousSetsByExercise(history);
    } catch {
      // offline: use target/default set counts
    }
  }
  const workout = createWorkout({
    ...opts,
    previousSetCount: (id) => previous.get(id)?.length ?? 0,
  });
  await saveActiveWorkout(workout);
  return workout;
}
