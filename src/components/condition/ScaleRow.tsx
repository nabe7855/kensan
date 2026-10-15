"use client";

import { cn } from "@/lib/utils";

type Option<T extends string | number> = { value: T; label: string };

type Props<T extends string | number> = {
  label: string;
  options: Option<T>[];
  value: T | null;
  onChange: (value: T | null) => void;
};

/** Labelled single-choice row. Tapping the selected option again clears it. */
export function ScaleRow<T extends string | number>({ label, options, value, onChange }: Props<T>) {
  return (
    <div className="surface flex items-center gap-3 px-4 py-3">
      <span className="w-12 shrink-0 text-base">{label}</span>
      <div
        role="radiogroup"
        aria-label={label}
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
                checked ? "bg-accent text-bg font-bold" : "bg-bg text-muted",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
