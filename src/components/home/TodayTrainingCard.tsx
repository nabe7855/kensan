"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { startWorkout } from "@/components/training/startWorkout";
import { Button } from "@/components/ui/button";
import { useRoutines } from "@/lib/queries/training";
import { routineForDate } from "@/lib/routines";
import { readActiveWorkout } from "@/lib/useActiveWorkout";
import type { ActiveWorkout } from "@/lib/workout";

/** "今日のトレ" card: today's routine with a start button, or resume. Hidden on off days. */
export function TodayTrainingCard({ today }: { today: string }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data: routines } = useRoutines();
  const [active, setActive] = useState<ActiveWorkout | null>(null);
  const [starting, setStarting] = useState(false);

  useEffect(() => {
    void readActiveWorkout().then(setActive);
  }, []);

  const routine = routines ? routineForDate(routines, today) : null;

  if (active) {
    return (
      <section className="surface flex flex-col gap-3 px-4 py-4">
        <p className="num text-2xl">{active.title} 実施中</p>
        <Button asChild size="lg">
          <Link href="/training/workout">再開</Link>
        </Button>
      </section>
    );
  }
  if (!routine) return null;

  return (
    <section className="surface flex flex-col gap-3 px-4 py-4">
      <p className="num text-2xl">今日のトレ: {routine.name}</p>
      <Button
        size="lg"
        disabled={starting}
        onClick={async () => {
          setStarting(true);
          await startWorkout(queryClient, {
            title: routine.name,
            routineId: routine.id,
            plan: routine.routine_exercises.map((re) => ({
              exerciseId: re.exercise_id,
              targetSets: re.target_sets,
              restSec: re.rest_sec,
            })),
          });
          router.push("/training/workout");
        }}
      >
        開始
      </Button>
    </section>
  );
}
