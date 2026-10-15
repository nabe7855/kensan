"use client";

import { useState } from "react";
import { hasUnit, toGrams } from "@/lib/food-groups";
import { macrosFor, type Food } from "@/lib/nutrition";
import { cn } from "@/lib/utils";
import { Keypad } from "./Keypad";

type Props = {
  food: Food;
  initialGrams?: number;
  submitLabel?: string;
  onSubmit: (grams: number) => void;
};

const PRESETS = [0.5, 1, 1.5, 2];

/** Amount for one food: grams on the keypad, or its unit (個 / 人前 ...) with quick presets. */
export function AmountEntry({ food, initialGrams, submitLabel = "追加", onSubmit }: Props) {
  const unit = hasUnit(food) ? food : null;
  const [inUnits, setInUnits] = useState(!!unit && !initialGrams);
  const [value, setValue] = useState(initialGrams ? String(initialGrams) : unit ? "1" : "");
  const n = Number(value) || 0;
  const grams = toGrams(food, n, inUnits);
  const m = macrosFor(food, grams);

  function switchMode(next: boolean) {
    if (!unit || next === inUnits) return;
    setValue(
      next ? String(Math.round((grams / unit.unit_grams) * 2) / 2 || 1) : String(Math.round(grams)),
    );
    setInUnits(next);
  }

  return (
    <div className="flex flex-col gap-3">
      <p className="text-lg leading-snug">
        {food.name}
        {(food.source === "dish" || food.source === "sample") && (
          <span className="border-border text-ghost ml-2 rounded-sm border px-1 text-[10px]">
            目安
          </span>
        )}
      </p>
      {unit && (
        <div className="flex items-center gap-2">
          <div className="border-border grid grid-cols-2 overflow-hidden rounded-md border">
            {[true, false].map((u) => (
              <button
                key={String(u)}
                type="button"
                aria-pressed={inUnits === u}
                onClick={() => switchMode(u)}
                className={cn(
                  "h-10 px-4 text-sm",
                  inUnits === u ? "bg-accent text-bg font-bold" : "bg-bg text-muted",
                )}
              >
                {u ? unit.unit_name : "g"}
              </button>
            ))}
          </div>
          <span className="text-ghost text-xs">
            1{unit.unit_name} = {unit.unit_grams}g
          </span>
        </div>
      )}
      {unit && inUnits && (
        <div className="grid grid-cols-4 gap-1.5">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setValue(String(p))}
              className={cn(
                "num h-11 rounded-md border text-lg",
                n === p ? "border-accent text-accent" : "border-border text-muted",
              )}
            >
              {p}
            </button>
          ))}
        </div>
      )}
      <p className="flex items-baseline justify-end gap-2">
        <span className="num text-accent text-7xl leading-none">{value || "0"}</span>
        <span className="num text-muted text-2xl">{inUnits && unit ? unit.unit_name : "g"}</span>
      </p>
      <p className="num text-muted text-right text-sm">
        {inUnits && <span className="mr-2">{Math.round(grams)}g ・</span>}
        {Math.round(m.kcal)} kcal ・ P {m.protein_g.toFixed(1)} ・ F {m.fat_g.toFixed(1)} ・ C{" "}
        {m.carb_g.toFixed(1)}
      </p>
      <Keypad
        value={value}
        onChange={setValue}
        submitLabel={submitLabel}
        disabled={grams <= 0}
        onSubmit={() => onSubmit(grams)}
      />
    </div>
  );
}
