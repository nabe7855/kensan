"use client";

import { useQueryClient } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { Button } from "@/components/ui/button";
import {
  trainingKeys,
  useExercises,
  type Routine,
  type RoutineExercise,
} from "@/lib/queries/training";
import { cn } from "@/lib/utils";
import { DEFAULT_REST_SEC } from "@/lib/workout";
import { ExercisePicker } from "./ExercisePicker";

const WEEKDAYS = [
  { value: 1, label: "月" },
  { value: 2, label: "火" },
  { value: 3, label: "水" },
  { value: 4, label: "木" },
  { value: 5, label: "金" },
  { value: 6, label: "土" },
  { value: 0, label: "日" },
];

type Item = RoutineExercise;

const toInt = (s: string) => {
  const n = parseInt(s, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
};

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
}) {
  return (
    <label className="flex flex-col items-center gap-0.5">
      <span className="text-ghost text-[10px]">{label}</span>
      <input
        inputMode="numeric"
        value={value ?? ""}
        onChange={(e) => onChange(toInt(e.target.value))}
        className="num bg-bg border-border h-10 w-full rounded-md border text-center text-lg focus:outline-none"
      />
    </label>
  );
}

export function RoutineEditor({
  routine,
  nextOrder,
}: {
  routine: Routine | null;
  nextOrder: number;
}) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { userId } = useAppData();
  const { write } = useSync();
  const { data: exercises = [] } = useExercises();
  const names = useMemo(() => new Map(exercises.map((e) => [e.id, e.name_ja])), [exercises]);

  const [id] = useState(() => routine?.id ?? crypto.randomUUID());
  const [name, setName] = useState(routine?.name ?? "");
  const [weekdays, setWeekdays] = useState<number[]>(routine?.weekdays ?? []);
  const [items, setItems] = useState<Item[]>(routine?.routine_exercises ?? []);
  const [picking, setPicking] = useState(false);
  const [saving, setSaving] = useState(false);

  const patch = (i: number, p: Partial<Item>) =>
    setItems((list) => list.map((it, j) => (j === i ? { ...it, ...p } : it)));
  const move = (i: number, d: -1 | 1) =>
    setItems((list) => {
      const next = [...list];
      const j = i + d;
      if (j < 0 || j >= next.length) return list;
      [next[i], next[j]] = [next[j]!, next[i]!];
      return next;
    });

  async function save() {
    if (!name.trim()) return;
    setSaving(true);
    const ordered = items.map((it, i) => ({ ...it, order_idx: i }));
    const saved: Routine = {
      id,
      name: name.trim(),
      order_idx: routine?.order_idx ?? nextOrder,
      weekdays: [...weekdays].sort(),
      routine_exercises: ordered,
    };
    queryClient.setQueryData<Routine[]>(trainingKeys.routines, (rows) => {
      const others = (rows ?? []).filter((r) => r.id !== id);
      return [...others, saved].sort((a, b) => a.order_idx - b.order_idx);
    });

    await write({
      table: "routines",
      kind: "upsert",
      payload: {
        id,
        user_id: userId,
        name: saved.name,
        order_idx: saved.order_idx,
        weekdays: saved.weekdays,
      },
    });
    await write({ table: "routine_exercises", kind: "delete", match: { routine_id: id } });
    if (ordered.length > 0) {
      await write({
        table: "routine_exercises",
        kind: "insert",
        payload: ordered.map((it) => ({ ...it, routine_id: id, user_id: userId })),
      });
    }
    router.push("/training");
  }

  async function remove() {
    if (!routine || !window.confirm(`「${routine.name}」を削除します。記録は残ります。`)) return;
    queryClient.setQueryData<Routine[]>(trainingKeys.routines, (rows) =>
      (rows ?? []).filter((r) => r.id !== routine.id),
    );
    await write({ table: "routines", kind: "delete", match: { id: routine.id } });
    router.push("/training");
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={30}
        placeholder="ルーティン名（例: Push A）"
        aria-label="ルーティン名"
        className="surface num placeholder:text-ghost h-14 px-4 text-2xl focus:outline-none"
      />

      <div className="surface flex flex-col gap-2 px-4 py-3">
        <span className="text-sm">曜日</span>
        <div className="grid grid-cols-7 gap-1">
          {WEEKDAYS.map((w) => {
            const on = weekdays.includes(w.value);
            return (
              <button
                key={w.value}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setWeekdays((d) => (on ? d.filter((x) => x !== w.value) : [...d, w.value]))
                }
                className={cn(
                  "h-12 rounded-md border text-sm",
                  on ? "border-accent bg-accent text-bg font-bold" : "border-border text-muted",
                )}
              >
                {w.label}
              </button>
            );
          })}
        </div>
        <span className="text-ghost text-xs">選んだ曜日はトレ日として扱います</span>
      </div>

      <ul className="flex flex-col gap-2">
        {items.map((it, i) => (
          <li key={it.id} className="surface flex flex-col gap-2 px-3 py-3">
            <div className="flex items-center gap-1">
              <span className="flex-1 truncate text-base">{names.get(it.exercise_id) ?? "…"}</span>
              <button
                type="button"
                aria-label="上へ"
                onClick={() => move(i, -1)}
                className="text-muted flex size-10 items-center justify-center"
              >
                <ArrowUp className="size-4" />
              </button>
              <button
                type="button"
                aria-label="下へ"
                onClick={() => move(i, 1)}
                className="text-muted flex size-10 items-center justify-center"
              >
                <ArrowDown className="size-4" />
              </button>
              <button
                type="button"
                aria-label="外す"
                onClick={() => setItems((l) => l.filter((_, j) => j !== i))}
                className="text-muted flex size-10 items-center justify-center"
              >
                <Trash2 className="size-4" />
              </button>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <NumField
                label="セット"
                value={it.target_sets}
                onChange={(v) => patch(i, { target_sets: v })}
              />
              <NumField
                label="回数"
                value={it.target_reps}
                onChange={(v) => patch(i, { target_reps: v })}
              />
              <NumField
                label="RIR"
                value={it.target_rir}
                onChange={(v) => patch(i, { target_rir: v })}
              />
              <NumField
                label="レスト秒"
                value={it.rest_sec}
                onChange={(v) => patch(i, { rest_sec: v })}
              />
            </div>
          </li>
        ))}
      </ul>

      <Button variant="outline" className="text-accent" onClick={() => setPicking(true)}>
        ＋ 種目を追加
      </Button>

      <Button size="lg" className="mt-3" disabled={saving || !name.trim()} onClick={save}>
        保存
      </Button>
      {routine && (
        <Button variant="ghost" onClick={remove}>
          このルーティンを削除
        </Button>
      )}

      {picking && (
        <ExercisePicker
          exclude={items.map((i) => i.exercise_id)}
          onClose={() => setPicking(false)}
          onPick={(e) => {
            setItems((l) => [
              ...l,
              {
                id: crypto.randomUUID(),
                exercise_id: e.id,
                order_idx: l.length,
                target_sets: 3,
                target_reps: 10,
                target_rir: 2,
                rest_sec: DEFAULT_REST_SEC,
              },
            ]);
            setPicking(false);
          }}
        />
      )}
    </div>
  );
}
