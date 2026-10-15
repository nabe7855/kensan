"use client";

import Link from "next/link";
import { useMemo } from "react";
import { dayTotals } from "@/lib/meal-plan";
import { dayTypeFor, isOver, targetFor } from "@/lib/nutrition";
import { useDayMeals, useDayOverride, useTargets } from "@/lib/queries/nutrition";
import { useRoutines } from "@/lib/queries/training";
import { cn } from "@/lib/utils";

const ROWS = [
  { key: "protein_g", label: "P", unit: "g" },
  { key: "fat_g", label: "F", unit: "g" },
  { key: "carb_g", label: "C", unit: "g" },
  { key: "kcal", label: "kcal", unit: "" },
] as const;

/** Home card: what is left of today's PFC/kcal. Hidden until targets exist. */
export function NutritionSummary({ today }: { today: string }) {
  const meals = useDayMeals(today);
  const targets = useTargets();
  const override = useDayOverride(today);
  const routines = useRoutines();

  const eaten = useMemo(() => dayTotals(meals.data ?? []).eaten, [meals.data]);
  const dayType = dayTypeFor(today, routines.data ?? [], override.data ?? null);
  const target = targetFor(targets.data ?? [], today, dayType);
  if (!target) return null;

  return (
    <Link
      href="/nutrition"
      className="surface flex flex-col gap-3 px-4 py-4"
      aria-label="食事の残り"
    >
      {ROWS.map(({ key, label, unit }) => {
        const left = Math.round(target[key] - eaten[key]);
        const over = isOver(key, eaten[key], target[key]);
        const ratio = target[key] > 0 ? Math.min(1, eaten[key] / target[key]) : 0;
        return (
          <div key={key} className="grid grid-cols-[2.5rem_1fr_4.5rem] items-center gap-3">
            <span className="label-en num text-lg">{label}</span>
            <span className="bg-border h-3 overflow-hidden rounded-full">
              <span
                className={cn("block h-full", over ? "bg-warn" : "bg-accent")}
                style={{ width: `${ratio * 100}%` }}
              />
            </span>
            <span className={cn("num text-right text-xl", over && "text-warn")}>
              {left >= 0
                ? `${left.toLocaleString("ja-JP")}${unit}`
                : `+${(-left).toLocaleString("ja-JP")}${unit}`}
            </span>
          </div>
        );
      })}
      <span className="text-ghost text-right text-[10px]">
        残り（{dayType === "train" ? "トレ日" : "オフ日"}）
      </span>
    </Link>
  );
}
