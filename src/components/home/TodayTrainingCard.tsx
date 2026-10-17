"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { readActiveWorkout } from "@/lib/useActiveWorkout";
import type { ActiveWorkout } from "@/lib/workout";

/** Home entry to training: resume the workout in progress, or pick a body part to start. */
export function TodayTrainingCard() {
  const [active, setActive] = useState<ActiveWorkout | null>(null);

  useEffect(() => {
    void readActiveWorkout().then(setActive);
  }, []);

  return (
    <section className="surface flex items-center justify-between gap-3 px-4 py-4">
      <p className="text-base font-bold">{active ? `${active.title} 実施中` : "トレーニング"}</p>
      <Button asChild className="px-6">
        <Link href={active ? "/training/workout" : "/training"}>
          {active ? "再開" : "部位を選んで始める"}
        </Link>
      </Button>
    </section>
  );
}
