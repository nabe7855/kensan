"use client";

import { Delete } from "lucide-react";
import { cn } from "@/lib/utils";

type Props = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  submitLabel?: string;
  disabled?: boolean;
};

const KEYS = ["7", "8", "9", "4", "5", "6", "1", "2", "3"];
const key = "num bg-card border-border active:bg-border h-14 rounded-md border text-3xl";

/** Gram keypad (mockup 03): digits, backspace and a submit key. */
export function Keypad({ value, onChange, onSubmit, submitLabel = "追加", disabled }: Props) {
  const press = (d: string) => onChange(value === "0" ? d : (value + d).slice(0, 4));
  return (
    <div className="grid grid-cols-3 gap-1.5">
      {KEYS.map((k) => (
        <button key={k} type="button" className={key} onClick={() => press(k)}>
          {k}
        </button>
      ))}
      <button type="button" className={key} onClick={() => press("0")}>
        0
      </button>
      <button
        type="button"
        aria-label="1文字消す"
        className={cn(key, "flex items-center justify-center")}
        onClick={() => onChange(value.slice(0, -1))}
      >
        <Delete className="size-6" />
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={onSubmit}
        className="bg-accent text-bg h-14 rounded-md text-xl font-bold disabled:opacity-40"
      >
        {submitLabel}
      </button>
    </div>
  );
}
