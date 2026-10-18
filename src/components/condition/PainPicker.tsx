"use client";

import { PAIN_AREAS } from "@/lib/safety";
import { cn } from "@/lib/utils";

/** Tap the places that hurt or feel off (several at once). Empty means none. */
export function PainPicker({
  value,
  onChange,
  label = "痛み・違和感がある場所",
}: {
  value: string[];
  onChange: (areas: string[]) => void;
  label?: string;
}) {
  const toggle = (key: string) =>
    onChange(value.includes(key) ? value.filter((k) => k !== key) : [...value, key]);
  return (
    <fieldset className="surface flex flex-col gap-2 px-4 py-3">
      <legend className="sr-only">{label}</legend>
      <span className="flex items-baseline justify-between">
        <span className="text-sm">{label}</span>
        <span className="text-ghost text-xs">なければそのまま</span>
      </span>
      <div className="flex flex-wrap gap-1.5">
        {PAIN_AREAS.map((a) => {
          const on = value.includes(a.key);
          return (
            <button
              key={a.key}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(a.key)}
              className={cn(
                "h-10 min-w-12 rounded-md border px-3 text-sm",
                on ? "border-warn text-warn font-bold" : "border-border text-muted",
              )}
            >
              {a.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}
