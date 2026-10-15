"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { trainingKeys } from "@/lib/queries/training";

/** Persistent per-exercise memo (seat angle etc.). Tap to edit. */
export function ExerciseNote({ exerciseId, note }: { exerciseId: string; note: string }) {
  const { userId } = useAppData();
  const { write } = useSync();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(note);

  async function save() {
    setEditing(false);
    const trimmed = value.trim();
    if (trimmed === note) return;
    queryClient.setQueryData<Map<string, string>>(trainingKeys.notes, (m) => {
      const next = new Map(m);
      next.set(exerciseId, trimmed);
      return next;
    });
    await write({
      table: "exercise_notes",
      kind: "upsert",
      onConflict: "user_id,exercise_id",
      payload: { user_id: userId, exercise_id: exerciseId, note: trimmed },
    });
  }

  if (editing) {
    return (
      <input
        autoFocus
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => e.key === "Enter" && e.currentTarget.blur()}
        maxLength={120}
        placeholder="シート角度など"
        aria-label="種目メモ"
        className="border-accent bg-card h-10 w-full rounded-md border px-3 text-sm focus:outline-none"
      />
    );
  }
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className="text-muted min-h-10 text-left text-base"
    >
      {note ? `メモ: ${note}` : <span className="text-ghost text-sm">＋ メモ</span>}
    </button>
  );
}
