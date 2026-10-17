"use client";

import { Check } from "lucide-react";
import { useState } from "react";
import { Sheet } from "@/components/ui/sheet";
import type { HistorySet } from "@/lib/queries/training";
import { formatRest, setIntervals } from "@/lib/rest-timer";
import { SET_TYPES, type SetType } from "@/lib/strength";
import { setDiff } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { startingValues } from "@/lib/wheel";
import type { DraftSet } from "@/lib/workout";
import { SetPicker, type SetValues } from "./SetPicker";

type Props = {
  sets: DraftSet[];
  previous: HistorySet[];
  activeIndex: number;
  flashId: string | null;
  onChange: (index: number, patch: Partial<DraftSet>) => void;
  /** Check a set off (or undo); `values` are numbers picked in the same tap. */
  onToggle: (index: number, values?: SetValues) => void;
  onFocusRow: (index: number) => void;
  showRir?: boolean;
  repPrs?: number[];
};

const fmt = (n: number | null | undefined) => (n == null ? "" : String(n));

export function prevFor(previous: HistorySet[], i: number): HistorySet | undefined {
  return previous[i] ?? previous.at(-1);
}

const cell = "border-border border-l first:border-l-0";
const valueButton = "num flex h-11 w-full items-center justify-center rounded-md text-2xl";

export function SetTable({
  sets,
  previous,
  activeIndex,
  flashId,
  onChange,
  onToggle,
  onFocusRow,
  showRir = false,
  repPrs = [],
}: Props) {
  const [picking, setPicking] = useState<number | null>(null);
  const [editing, setEditing] = useState<number | null>(null);
  const toPatch = (v: SetValues): Partial<DraftSet> => ({
    weight: String(v.weight),
    reps: String(v.reps),
    ...(showRir ? { rir: String(v.rir) } : {}),
  });
  const cols = showRir
    ? "grid-cols-[3rem_1.4fr_1fr_0.8fr_0.8fr_3rem]"
    : "grid-cols-[3rem_1.4fr_1.1fr_0.9fr_3rem]";
  const intervals = setIntervals(sets.map((s) => s.doneAt));
  const fields = (
    [
      ["weight", "kg", "decimal"],
      ["reps", "回", "numeric"],
      ["rir", "RIR", "numeric"],
    ] as const
  ).filter(([key]) => showRir || key !== "rir");
  return (
    <div className="border-border overflow-hidden rounded-md border">
      <div className={cn("border-border text-muted grid border-b text-xs", cols)}>
        {["SET", "前回", "kg", "回", ...(showRir ? ["RIR"] : []), "✓"].map((h) => (
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
                "grid items-center transition-shadow duration-500",
                cols,
                flashId === s.id && "shadow-[inset_0_0_0_2px_var(--color-accent)]",
              )}
            >
              <button
                type="button"
                onClick={() => setPicking(i)}
                aria-label={`セット${i + 1}（${type.label}）。タップで追い込み方を選ぶ`}
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
              {fields.map(([key, label]) => {
                const ghost = fmt(
                  key === "weight" ? prev?.weight_kg : key === "reps" ? prev?.reps : prev?.rir,
                );
                return (
                  <span key={key} className={cn(cell, "px-1 py-1.5")}>
                    <button
                      type="button"
                      aria-label={`セット${i + 1} ${label}：${s[key] || "未入力"}。タップで選ぶ`}
                      onClick={() => {
                        onFocusRow(i);
                        setEditing(i);
                      }}
                      className={cn(
                        valueButton,
                        active && "border-accent border",
                        s[key] ? "text-fg" : "text-ghost",
                      )}
                    >
                      {s[key] || ghost || "—"}
                    </button>
                  </span>
                );
              })}
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
            {(diff || intervals[i] !== null || type.short || repPrs.includes(i)) && done && (
              <p className="num -mt-1 flex flex-wrap gap-x-3 pb-1.5 pl-[3rem] text-xs">
                {repPrs.includes(i) && <span className="text-accent font-bold">レップPR</span>}
                {type.key !== "normal" && <span className="text-accent">{type.label}</span>}
                {diff && (
                  <span className={diff.trend === "up" ? "text-accent" : "text-ghost"}>
                    前回比 {diff.label}
                  </span>
                )}
                {intervals[i] !== null && (
                  <span className="text-ghost">前のセットから {formatRest(intervals[i]!)}</span>
                )}
              </p>
            )}
          </div>
        );
      })}
      {editing !== null && sets[editing] && (
        <SetPicker
          title={`セット${editing + 1}`}
          initial={startingValues(sets[editing]!, prevFor(previous, editing), sets[editing - 1])}
          previous={prevFor(previous, editing) ?? null}
          showRir={showRir}
          canComplete={!sets[editing]!.doneAt}
          onApply={(v) => onChange(editing, toPatch(v))}
          onComplete={(v) => {
            onChange(editing, toPatch(v));
            onToggle(editing, v);
          }}
          onClose={() => setEditing(null)}
        />
      )}
      {picking !== null && (
        <Sheet title={`セット${picking + 1}の追い込み方`} onClose={() => setPicking(null)}>
          <ul className="flex flex-col gap-2 overflow-y-auto pb-6">
            {SET_TYPES.map((t) => {
              const selected = sets[picking]?.setType === t.key;
              return (
                <li key={t.key}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => {
                      onChange(picking, { setType: t.key as SetType });
                      setPicking(null);
                    }}
                    className={cn(
                      "flex min-h-14 w-full flex-col items-start rounded-md border px-3 py-2 text-left",
                      selected ? "border-accent" : "border-border",
                    )}
                  >
                    <span className="flex items-baseline gap-2">
                      <span className={cn("text-base font-bold", selected && "text-accent")}>
                        {t.label}
                      </span>
                      {t.short && <span className="num text-ghost text-xs">{t.short}</span>}
                    </span>
                    <span className="text-muted text-xs leading-relaxed">{t.note}</span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Sheet>
      )}
    </div>
  );
}
