"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Option = { value: string; label: string };

type Props = {
  name: string;
  options: Option[];
  defaultValue?: string;
  ariaLabel: string;
};

export function Segmented({ name, options, defaultValue, ariaLabel }: Props) {
  const [value, setValue] = useState(defaultValue ?? "");

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className="border-border grid overflow-hidden rounded-md border"
      style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}
    >
      <input type="hidden" name={name} value={value} />
      {options.map((o) => {
        const checked = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={checked}
            onClick={() => setValue(o.value)}
            className={cn(
              "border-border h-12 border-l text-sm first:border-l-0",
              checked ? "bg-accent text-bg font-bold" : "bg-bg text-muted",
            )}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
