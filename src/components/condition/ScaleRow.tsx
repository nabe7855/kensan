"use client";

import { cn } from "@/lib/utils";

type Option<T extends string | number> = { value: T; label: string };

type Props<T extends string | number> = {
  label: string;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
  /** End labels for a 1–5 scale: what 1 (bad) and 5 (good) mean. */
  anchors?: { low: string; high: string };
};

/** Tint for an unselected 1–5 option: low end amber, high end bright (never red). */
function scaleTone(v: number): string {
  if (v <= 1) return "text-warn";
  if (v === 2) return "text-warn/70";
  if (v === 3) return "text-muted";
  return "text-fg";
}

/** Labelled single-choice row. Tapping the selected option again clears it. */
export function ScaleRow<T extends string | number>({
  label,
  options,
  value,
  onChange,
  anchors,
}: Props<T>) {
  return (
    <div className="surface flex flex-col gap-1 px-4 py-3">
      <div className="flex items-center gap-3">
        <span className="w-12 shrink-0 text-base">{label}</span>
        <div
          role="radiogroup"
          aria-label={anchors ? `${label}（1 ${anchors.low} 〜 5 ${anchors.high}）` : label}
          className="border-border grid flex-1 overflow-hidden rounded-md border"
          style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
        >
          {options.map((o) => {
            const checked = o.value === value;
            return (
              <button
                key={o.value}
                type="button"
                role="radio"
                aria-checked={checked}
                onClick={() => onChange(checked ? null : o.value)}
                className={cn(
                  "border-border h-12 border-l text-base first:border-l-0",
                  typeof o.value === "number" && "num",
                  checked
                    ? "bg-accent text-bg font-bold"
                    : cn(
                        "bg-bg",
                        anchors && typeof o.value === "number" ? scaleTone(o.value) : "text-muted",
                      ),
                )}
              >
                {o.label}
              </button>
            );
          })}
        </div>
      </div>
      {anchors && (
        <div className="text-ghost flex justify-between pl-15 text-[11px]">
          <span>← {anchors.low}</span>
          <span>{anchors.high} →</span>
        </div>
      )}
    </div>
  );
}
