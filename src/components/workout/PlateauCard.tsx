"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import type { PlateauNote } from "@/lib/plateau";

/** Phase-aware note for the current exercise, with a way to stop notes for it. */
export function PlateauCard({ note, exerciseId }: { note: PlateauNote; exerciseId: string }) {
  const router = useRouter();
  const { userId, mutedExercises } = useAppData();
  const { write } = useSync();
  const [open, setOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  if (hidden) return null;

  async function mute() {
    setHidden(true);
    await write({
      table: "profiles",
      kind: "update",
      match: { user_id: userId },
      payload: { muted_exercises: [...new Set([...mutedExercises, exerciseId])] },
    });
    router.refresh();
  }

  return (
    <section className="border-warn/60 flex flex-col gap-1.5 rounded-md border px-3 py-2.5">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-10 items-center justify-between gap-2 text-left"
      >
        <span className="text-warn text-sm font-bold">{note.title}</span>
        <span className="text-ghost text-xs">{open ? "閉じる" : "どうする？"}</span>
      </button>
      {open && (
        <>
          <ul className="flex flex-col gap-1">
            {note.suggestions.map((s) => (
              <li key={s} className="border-border border-l-2 pl-2 text-sm leading-relaxed">
                {s}
              </li>
            ))}
          </ul>
          <p className="text-ghost text-xs leading-relaxed">{note.reason}</p>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setHidden(true)}
              className="text-muted h-10 text-xs underline underline-offset-4"
            >
              今回は閉じる
            </button>
            <button
              type="button"
              onClick={() => void mute()}
              className="text-muted h-10 text-xs underline underline-offset-4"
            >
              この種目は知らせない
            </button>
          </div>
        </>
      )}
    </section>
  );
}
