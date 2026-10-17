"use client";

import { Check } from "lucide-react";
import type { HistorySet } from "@/lib/queries/training";
import { SET_TYPES, nextSetType } from "@/lib/strength";
import { setDiff } from "@/lib/progress";
import { cn } from "@/lib/utils";
import type { DraftSet } from "@/lib/workout";

type Props = {
  sets: DraftSet[];
  previous: HistorySet[];
  activeIndex: number;
  flashId: string | null;
  onChange: (index: number, patch: Partial<DraftSet>) => void;
  onToggle: (index: number) => void;
  onFocusRow: (index: number) => void;
};

const fmt = (n: number | null | undefined) => (n == null ? "" : String(n));

export function prevFor(previous: HistorySet[], i: number): HistorySet | undefined {
  return previous[i] ?? previous.at(-1);
}

const cell = "border-border border-l first:border-l-0";
const input =
  "num h-11 w-full rounded-md bg-transparent text-center text-2xl placeholder:text-ghost focus:outline-none";

export function SetTable({
  sets,
  previous,
  activeIndex,
  flashId,
  onChange,
  onToggle,
  onFocusRow,
}: Props) {
  return (
    <div className="border-border overflow-hidden rounded-md border">
      <div className="border-border text-muted grid grid-cols-[3rem_1.4fr_1fr_0.8fr_0.8fr_3rem] border-b text-xs">
        {["SET", "前回", "kg", "回", "RIR", "✓"].map((h) => (
          <span key={h} className={cn(cell, "label-en py-2 text-center")}>
            {h}
          </span>
        ))}
      </div>
      {sets.map((s, i) => {
        const prev = prevFor(previous, i);
        const done = !!s.doneAt;
        const type = SET_TYPES.find((t) => t.key === s.setType)!;
        const active = i === activeIndex && !done;
        const diff =
          done && s.setType !== "warmup" && s.weight !== "" && s.reps !== ""
            ? setDiff(
                { weightKg: Number(s.weight), reps: Number(s.reps) },
                prev && { weightKg: prev.weight_kg, reps: prev.reps },
              )
            : null;
        return (
          <div key={s.id} className="border-border border-b last:border-b-0">
            <div
              className={cn(
                "grid grid-cols-[3rem_1.4fr_1fr_0.8fr_0.8fr_3rem] items-center transition-shadow duration-500",
                flashId === s.id && "shadow-[inset_0_0_0_2px_var(--color-accent)]",
              )}
            >
              <button
                type="button"
                onClick={() => onChange(i, { setType: nextSetType(s.setType) })}
                aria-label={`セット${i + 1}（${type.label}）。タップで種別を変更`}
                className={cn(cell, "num flex h-14 items-center justify-center gap-0.5 text-xl")}
              >
                {i + 1}
                {type.short && <span className="text-accent text-xs">{type.short}</span>}
              </button>
              <span
                className={cn(cell, "num text-ghost flex h-14 items-center justify-center text-lg")}
              >
                {prev ? `${fmt(prev.weight_kg)} × ${fmt(prev.reps)}` : "—"}
              </span>
              {(
                [
                  ["weight", "kg", prev?.weight_kg, "decimal"],
                  ["reps", "回", prev?.reps, "numeric"],
                  ["rir", "RIR", prev?.rir, "numeric"],
                ] as const
              ).map(([key, label, ph, mode]) => (
                <span key={key} className={cn(cell, "px-1 py-1.5")}>
                  <input
                    inputMode={mode}
                    aria-label={`セット${i + 1} ${label}`}
                    value={s[key]}
                    placeholder={fmt(ph)}
                    disabled={done}
                    onFocus={() => onFocusRow(i)}
                    onChange={(e) => onChange(i, { [key]: e.target.value })}
                    className={cn(input, active && "border-accent border", done && "text-fg")}
                  />
                </span>
              ))}
              <span className={cn(cell, "flex h-14 items-center justify-center")}>
                <button
                  type="button"
                  onClick={() => onToggle(i)}
                  aria-label={done ? `セット${i + 1}の確定を取り消す` : `セット${i + 1}を確定`}
                  aria-pressed={done}
                  className="flex size-12 items-center justify-center"
                >
                  <span
                    className={cn(
                      "flex size-8 items-center justify-center rounded-full border-2",
                      done ? "border-accent bg-accent text-bg" : "border-ghost",
                    )}
                  >
                    {done && <Check className="size-5" strokeWidth={3} />}
                  </span>
                </button>
              </span>
            </div>
            {diff && (
              <p
                className={cn(
                  "num -mt-1 pb-1.5 pl-[3rem] text-xs",
                  diff.trend === "up" ? "text-accent" : "text-ghost",
                )}
              >
                前回比 {diff.label}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
