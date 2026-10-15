"use client";

import { useQueryClient } from "@tanstack/react-query";
import { Search, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { Button } from "@/components/ui/button";
import { MUSCLE_GROUPS, muscleLabel } from "@/lib/muscles";
import { trainingKeys, useExercises, type Exercise } from "@/lib/queries/training";
import { cn } from "@/lib/utils";

type Props = {
  onClose: () => void;
  onPick: (exercise: Exercise) => void;
  exclude?: string[];
};

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "h-9 shrink-0 rounded-md border px-3 text-xs",
        active ? "border-accent bg-accent text-bg font-bold" : "border-border text-muted",
      )}
    >
      {children}
    </button>
  );
}

export function ExercisePicker({ onClose, onPick, exclude = [] }: Props) {
  const { data: exercises = [] } = useExercises();
  const { userId } = useAppData();
  const { write } = useSync();
  const queryClient = useQueryClient();
  const [q, setQ] = useState("");
  const [group, setGroup] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newGroups, setNewGroups] = useState<string[]>([]);

  const list = useMemo(() => {
    const query = q.trim().toLowerCase();
    return exercises.filter(
      (e) =>
        !exclude.includes(e.id) &&
        (!group || e.muscle_groups.includes(group)) &&
        (!query ||
          e.name_ja.toLowerCase().includes(query) ||
          (e.name_en ?? "").toLowerCase().includes(query)),
    );
  }, [exercises, q, group, exclude]);

  async function create() {
    const name = newName.trim();
    if (!name) return;
    const exercise: Exercise = {
      id: crypto.randomUUID(),
      user_id: userId,
      name_ja: name,
      name_en: null,
      muscle_groups: newGroups,
      equipment: null,
    };
    queryClient.setQueryData<Exercise[]>(trainingKeys.exercises, (rows) =>
      rows ? [...rows, exercise] : [exercise],
    );
    onPick(exercise);
    await write({ table: "exercises", kind: "insert", payload: { ...exercise, is_custom: true } });
  }

  return (
    <div
      role="dialog"
      aria-modal
      aria-label="種目を選ぶ"
      className="bg-bg fixed inset-0 z-50 flex flex-col pt-[env(safe-area-inset-top)]"
    >
      <div className="mx-auto flex w-full max-w-[480px] flex-1 flex-col overflow-hidden px-4">
        <div className="flex h-14 items-center justify-between">
          <h2 className="text-lg font-bold">種目を選ぶ</h2>
          <button
            type="button"
            aria-label="閉じる"
            onClick={onClose}
            className="text-muted flex size-12 items-center justify-center"
          >
            <X className="size-5" />
          </button>
        </div>
        <label className="surface flex h-12 items-center gap-2 px-3">
          <Search className="text-ghost size-4" aria-hidden />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="種目名で検索"
            aria-label="種目名で検索"
            className="placeholder:text-ghost flex-1 bg-transparent text-base focus:outline-none"
          />
        </label>
        <div className="mt-2 flex gap-2 overflow-x-auto pb-2">
          <Chip active={group === null} onClick={() => setGroup(null)}>
            すべて
          </Chip>
          {MUSCLE_GROUPS.map((m) => (
            <Chip key={m.key} active={group === m.key} onClick={() => setGroup(m.key)}>
              {m.label}
            </Chip>
          ))}
        </div>

        <ul className="flex-1 overflow-y-auto pb-4">
          {list.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                onClick={() => onPick(e)}
                className="border-border flex min-h-14 w-full flex-col justify-center border-b px-1 py-2 text-left"
              >
                <span className="text-base">
                  {e.name_ja}
                  {e.user_id && <span className="text-ghost ml-2 text-xs">マイ種目</span>}
                </span>
                <span className="text-ghost text-xs">
                  {e.muscle_groups.map(muscleLabel).join(" ・ ")}
                </span>
              </button>
            </li>
          ))}
          {list.length === 0 && <li className="text-muted py-6 text-sm">見つかりません</li>}
        </ul>

        <div className="border-border border-t py-3 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
          {creating ? (
            <div className="flex flex-col gap-2">
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                autoFocus
                maxLength={40}
                placeholder="種目名"
                aria-label="新しい種目名"
                className="surface placeholder:text-ghost h-12 px-3 text-base focus:outline-none"
              />
              <div className="flex flex-wrap gap-2">
                {MUSCLE_GROUPS.map((m) => (
                  <Chip
                    key={m.key}
                    active={newGroups.includes(m.key)}
                    onClick={() =>
                      setNewGroups((g) =>
                        g.includes(m.key) ? g.filter((x) => x !== m.key) : [...g, m.key],
                      )
                    }
                  >
                    {m.label}
                  </Chip>
                ))}
              </div>
              <Button onClick={create} disabled={!newName.trim()}>
                作成して追加
              </Button>
            </div>
          ) : (
            <Button
              variant="outline"
              className="text-accent w-full"
              onClick={() => setCreating(true)}
            >
              ＋ 新しい種目を作る
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
