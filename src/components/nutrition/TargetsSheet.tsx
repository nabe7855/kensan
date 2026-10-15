"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sheet } from "@/components/ui/sheet";
import { targetFor, type DayType, type Target } from "@/lib/nutrition";

type Props = {
  today: string;
  targets: Target[];
  onClose: () => void;
  onSave: (rows: Omit<Target, "effective_from">[]) => void;
};

const FIELDS = [
  { key: "kcal", label: "kcal" },
  { key: "protein_g", label: "P (g)" },
  { key: "fat_g", label: "F (g)" },
  { key: "carb_g", label: "C (g)" },
] as const;

type Draft = Record<(typeof FIELDS)[number]["key"], string>;

const fromTarget = (t: Target | null): Draft => ({
  kcal: t ? String(t.kcal) : "",
  protein_g: t ? String(t.protein_g) : "",
  fat_g: t ? String(t.fat_g) : "",
  carb_g: t ? String(t.carb_g) : "",
});

/** PFC targets for training and off days, effective from today. */
export function TargetsSheet({ today, targets, onClose, onSave }: Props) {
  const [drafts, setDrafts] = useState<Record<DayType, Draft>>({
    train: fromTarget(targetFor(targets, today, "train")),
    off: fromTarget(targetFor(targets, today, "off")),
  });

  const parse = (d: Draft) => {
    const vals = FIELDS.map((f) => Number(d[f.key]));
    return FIELDS.every((f) => d[f.key].trim() !== "") &&
      vals.every((v) => Number.isFinite(v) && v >= 0)
      ? { kcal: vals[0]!, protein_g: vals[1]!, fat_g: vals[2]!, carb_g: vals[3]! }
      : null;
  };

  function save() {
    const rows: Omit<Target, "effective_from">[] = [];
    for (const day of ["train", "off"] as const) {
      const v = parse(drafts[day]);
      if (v) rows.push({ day_type: day, ...v });
    }
    if (rows.length > 0) onSave(rows);
    onClose();
  }

  return (
    <Sheet title="PFC 目標" onClose={onClose}>
      <div className="flex flex-1 flex-col gap-4 overflow-y-auto pb-4">
        {(["train", "off"] as const).map((day) => (
          <section key={day} className="surface flex flex-col gap-2 px-4 py-3">
            <h3 className="text-sm">{day === "train" ? "トレ日" : "オフ日"}</h3>
            <div className="grid grid-cols-4 gap-2">
              {FIELDS.map((f) => (
                <label key={f.key} className="flex flex-col items-center gap-0.5">
                  <span className="text-ghost text-[10px]">{f.label}</span>
                  <input
                    inputMode="decimal"
                    value={drafts[day][f.key]}
                    onChange={(e) =>
                      setDrafts((d) => ({ ...d, [day]: { ...d[day], [f.key]: e.target.value } }))
                    }
                    className="num bg-bg border-border h-12 w-full rounded-md border text-center text-xl focus:outline-none"
                  />
                </label>
              ))}
            </div>
          </section>
        ))}
        <p className="text-ghost text-xs leading-relaxed">
          今日から適用します。目標は幅（kcal ±100、P ±10g、F ±5g、C
          ±15g）で扱い、超えた分だけアンバーで示します。
        </p>
        <Button size="lg" onClick={save}>
          保存
        </Button>
      </div>
    </Sheet>
  );
}
