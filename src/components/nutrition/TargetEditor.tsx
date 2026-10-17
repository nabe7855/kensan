"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  carbsFromTarget,
  energySplit,
  targetFor,
  type DayType,
  type Target,
} from "@/lib/nutrition";
import { cn } from "@/lib/utils";

type Props = {
  today: string;
  targets: Target[];
  initialDayType: DayType;
  onSave: (row: Omit<Target, "effective_from">) => void;
  onCancel?: () => void;
};

const num = (s: string) => {
  const n = Number(s);
  return s.trim() !== "" && Number.isFinite(n) && n >= 0 ? n : null;
};

function Field({
  label,
  unit,
  value,
  onChange,
  hint,
  big,
}: {
  label: string;
  unit: string;
  value: string;
  onChange: (v: string) => void;
  hint?: string;
  big?: boolean;
}) {
  return (
    <label className="border-border flex items-center justify-between gap-3 border-t py-2 first:border-t-0">
      <span className="flex flex-col">
        <span className={cn(big ? "text-base font-bold" : "text-sm")}>{label}</span>
        {hint && <span className="num text-ghost text-[11px]">{hint}</span>}
      </span>
      <span className="flex items-baseline gap-1">
        <input
          inputMode="numeric"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={cn(
            "num bg-bg border-border focus:border-accent w-24 rounded-md border text-right focus:outline-none",
            big ? "h-12 px-2 text-3xl" : "h-11 px-2 text-2xl",
          )}
        />
        <span className="text-muted w-7 text-xs">{unit}</span>
      </span>
    </label>
  );
}

/** Daily target in the order the user decides it: kcal → P → F, with C filling the rest. */
export function TargetEditor({ today, targets, initialDayType, onSave, onCancel }: Props) {
  const [dayType, setDayType] = useState<DayType>(initialDayType);
  const load = (d: DayType) => {
    const t = targetFor(targets, today, d);
    return {
      kcal: t ? String(Math.round(t.kcal)) : "",
      p: t ? String(Math.round(t.protein_g)) : "",
      f: t ? String(Math.round(t.fat_g)) : "",
    };
  };
  const [draft, setDraft] = useState(() => load(initialDayType));

  const kcal = num(draft.kcal);
  const p = num(draft.p);
  const f = num(draft.f);
  const c = kcal !== null && p !== null && f !== null ? carbsFromTarget(kcal, p, f) : null;
  const overshoot = kcal !== null && p !== null && f !== null && p * 4 + f * 9 > kcal;
  const split =
    kcal !== null && p !== null && f !== null && c !== null
      ? energySplit({ kcal, protein_g: p, fat_g: f, carb_g: c })
      : null;
  const pct = (x: number) => `${Math.round(x * 100)}%`;

  function switchDay(d: DayType) {
    setDayType(d);
    setDraft(load(d));
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="border-border grid grid-cols-2 overflow-hidden rounded-md border">
        {(["train", "off"] as const).map((d) => (
          <button
            key={d}
            type="button"
            aria-pressed={dayType === d}
            onClick={() => switchDay(d)}
            className={cn(
              "h-10 text-sm",
              dayType === d ? "bg-accent text-bg font-bold" : "bg-bg text-muted",
            )}
          >
            {d === "train" ? "トレ日" : "オフ日"}
          </button>
        ))}
      </div>

      <div className="flex flex-col">
        <Field
          big
          label="目標カロリー"
          unit="kcal"
          value={draft.kcal}
          onChange={(v) => setDraft({ ...draft, kcal: v })}
        />
        <Field
          label="P たんぱく質"
          unit="g"
          value={draft.p}
          onChange={(v) => setDraft({ ...draft, p: v })}
          hint={
            p !== null
              ? `${Math.round(p * 4)} kcal${split ? ` ・ ${pct(split.p)}` : ""}`
              : "1g = 4kcal"
          }
        />
        <Field
          label="F 脂質"
          unit="g"
          value={draft.f}
          onChange={(v) => setDraft({ ...draft, f: v })}
          hint={
            f !== null
              ? `${Math.round(f * 9)} kcal${split ? ` ・ ${pct(split.f)}` : ""}`
              : "1g = 9kcal"
          }
        />
        <div className="border-border flex items-center justify-between gap-3 border-t py-2">
          <span className="flex flex-col">
            <span className="text-sm">C 炭水化物</span>
            <span className="num text-ghost text-[11px]">
              残りのカロリーから自動{split ? ` ・ ${pct(split.c)}` : ""}
            </span>
          </span>
          <span className="flex items-baseline gap-1">
            <span className="num text-accent w-24 text-right text-3xl">{c ?? "—"}</span>
            <span className="text-muted w-7 text-xs">g</span>
          </span>
        </div>
      </div>

      {overshoot && (
        <p role="alert" className="text-warn text-xs leading-relaxed">
          P と F だけで目標カロリーを超えています。カロリーを上げるか、P / F を下げてください
        </p>
      )}

      <div className="flex gap-2 pt-1">
        <Button
          className="flex-1"
          disabled={kcal === null || p === null || f === null || overshoot}
          onClick={() =>
            kcal !== null &&
            p !== null &&
            f !== null &&
            c !== null &&
            onSave({ day_type: dayType, kcal, protein_g: p, fat_g: f, carb_g: c })
          }
        >
          {dayType === "train" ? "トレ日" : "オフ日"}の目標を保存
        </Button>
        {onCancel && (
          <Button variant="ghost" onClick={onCancel}>
            閉じる
          </Button>
        )}
      </div>
      <p className="text-ghost text-[11px]">今日から適用します。過去の日の目標は変わりません</p>
    </div>
  );
}
