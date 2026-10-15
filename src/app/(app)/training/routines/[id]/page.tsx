"use client";

import { use } from "react";
import { RoutineEditor } from "@/components/training/RoutineEditor";
import { useRoutines } from "@/lib/queries/training";

export default function RoutinePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data: routines, isPending } = useRoutines();

  if (isPending) return <div className="surface h-64 animate-pulse" aria-busy />;
  const routine = id === "new" ? null : (routines?.find((r) => r.id === id) ?? null);
  if (id !== "new" && !routine) {
    return <p className="text-muted text-sm">ルーティンが見つかりません</p>;
  }
  const nextOrder = Math.max(-1, ...(routines ?? []).map((r) => r.order_idx)) + 1;

  return (
    <div className="flex flex-col gap-4">
      <h1 className="text-xl font-bold">{routine ? "ルーティン編集" : "ルーティンを作る"}</h1>
      <RoutineEditor key={id} routine={routine} nextOrder={nextOrder} />
    </div>
  );
}
