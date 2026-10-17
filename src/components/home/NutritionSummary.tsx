"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { TargetEditor } from "@/components/nutrition/TargetEditor";
import { useMealActions } from "@/components/nutrition/useMealActions";
import { dayTotals } from "@/lib/meal-plan";
import { dayTypeFor, isOver, targetFor } from "@/lib/nutrition";
import { useDayMeals, useDayOverride, useTargets } from "@/lib/queries/nutrition";
import { useTrainedOn } from "@/lib/queries/training";
import { cn } from "@/lib/utils";

const ROWS = [
  { key: "kcal", label: "kcal", unit: "" },
  { key: "protein_g", label: "P", unit: "g" },
  { key: "fat_g", label: "F", unit: "g" },
  { key: "carb_g", label: "C", unit: "g" },
] as const;

/** Home card: what is left of today's kcal/PFC, with the targets editable in place. */
export function NutritionSummary({ today }: { today: string }) {
  const meals = useDayMeals(today);
  const targets = useTargets();
  const override = useDayOverride(today);
  const trained = useTrainedOn(today);
  const actions = useMealActions(today);
  const [editing, setEditing] = useState(false);

  const eaten = useMemo(() => dayTotals(meals.data ?? []).eaten, [meals.data]);
  const dayType = dayTypeFor(trained, override.data ?? null);
  const target = targetFor(targets.data ?? [], today, dayType);
  const dayLabel = dayType === "train" ? "トレ日" : "オフ日";

  if (targets.isPending) return null;

  const editor = (
    <TargetEditor
      today={today}
      targets={targets.data ?? []}
      initialDayType={dayType}
      onSave={(row) => {
        void actions.saveTargets([row], today);
        setEditing(false);
      }}
      onCancel={target ? () => setEditing(false) : undefined}
    />
  );

  if (!target) {
    return (
      <section className="surface flex flex-col gap-3 px-4 py-4">
        <p className="text-sm">
          目標カロリーと PFC を決めましょう。カロリー → P → F の順に入れると、C
          は残りから自動で決まります
        </p>
        {editor}
      </section>
    );
  }

  return (
    <section className="surface flex flex-col gap-3 px-4 py-4">
      <div className="flex items-baseline justify-between">
        <span className="text-muted text-xs">今日の残り（{dayLabel}）</span>
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          aria-expanded={editing}
          className="text-ghost h-8 text-xs underline underline-offset-4"
        >
          {editing ? "閉じる" : "目標を調整"}
        </button>
      </div>
      {ROWS.map(({ key, label, unit }) => {
        const left = Math.round(target[key] - eaten[key]);
        const over = isOver(key, eaten[key], target[key]);
        const ratio = target[key] > 0 ? Math.min(1, eaten[key] / target[key]) : 0;
        return (
          <div key={key} className="grid grid-cols-[2.5rem_1fr_5rem] items-center gap-3">
            <span className={cn("label-en num", key === "kcal" ? "text-base" : "text-lg")}>
              {label}
            </span>
            <span className="bg-border h-3 overflow-hidden rounded-full">
              <span
                className={cn("block h-full", over ? "bg-warn" : "bg-accent")}
                style={{ width: `${ratio * 100}%` }}
              />
            </span>
            <span className="flex flex-col items-end leading-none">
              <span className={cn("num text-xl", over && "text-warn")}>
                {left >= 0
                  ? `${left.toLocaleString("ja-JP")}${unit}`
                  : `+${(-left).toLocaleString("ja-JP")}${unit}`}
              </span>
              <span className="num text-ghost text-[10px]">
                /{Math.round(target[key]).toLocaleString("ja-JP")}
                {unit}
              </span>
            </span>
          </div>
        );
      })}
      {editing ? (
        <div className="border-border border-t pt-3">{editor}</div>
      ) : (
        <Link
          href="/nutrition"
          className="text-ghost self-end text-xs underline underline-offset-4"
        >
          食事を記録する
        </Link>
      )}
    </section>
  );
}
