"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { savePrep, type FormState } from "@/app/onboarding/actions";
import {
  MAX_WEEKLY_RATE_PCT,
  MIN_WEEKLY_RATE_PCT,
  WEEKLY_RATE_STEP,
  daysUntilContest,
  goalLine,
  projectedWeight,
  reachesTarget,
  requiredWeeklyRate,
  suggestedWeeklyRate,
  weeksBetween,
} from "@/lib/prep";
import { cn } from "@/lib/utils";
import { GoalLineChart } from "./GoalLineChart";

export type PrepInitial = {
  id: string;
  contest_name: string;
  contest_date: string;
  start_date: string;
  start_weight_kg: number;
  target_weight_kg: number;
  weekly_rate_pct: number;
  why_text: string | null;
  reverse_enabled: boolean;
};

type Props = {
  today: string;
  defaultStartKg?: number;
  skipHref?: string;
  /** Existing prep to edit in place (keeps its start date). */
  initial?: PrepInitial;
  /** Where to go after saving. */
  next?: "/home" | "/onboarding/done";
};

const toKg = (s: string) => {
  const n = Number(s);
  return s.trim() !== "" && Number.isFinite(n) && n > 0 ? n : null;
};

function WeightCard({
  label,
  name,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="surface flex flex-col px-4 py-4">
      <span className="text-sm">{label}</span>
      <span className="mt-2 flex items-baseline gap-1">
        <input
          name={name}
          inputMode="decimal"
          required
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="num text-accent placeholder:text-ghost w-full min-w-0 bg-transparent text-[56px] leading-none focus:outline-none"
        />
        <span className="num text-muted text-base">kg</span>
      </span>
    </label>
  );
}

export function PrepForm({ today, defaultStartKg, skipHref, initial, next }: Props) {
  const [state, action, pending] = useActionState<FormState, FormData>(savePrep, {});
  const [startDate, setStartDate] = useState(initial?.start_date ?? today);
  const [contestName, setContestName] = useState(initial?.contest_name ?? "");
  const [contestDate, setContestDate] = useState(initial?.contest_date ?? "");
  const [startKg, setStartKg] = useState(
    (initial?.start_weight_kg ?? defaultStartKg)?.toFixed(1) ?? "",
  );
  const [targetKg, setTargetKg] = useState(initial?.target_weight_kg.toFixed(1) ?? "");
  const [manualRate, setManualRate] = useState<number | null>(initial?.weekly_rate_pct ?? null);
  const [why, setWhy] = useState(initial?.why_text ?? "");
  const [reverse, setReverse] = useState(initial?.reverse_enabled ?? false);

  const plan = useMemo(() => {
    const start = toKg(startKg);
    const target = toKg(targetKg);
    if (!start || !target || !contestDate || target >= start) return null;
    const weeks = weeksBetween(startDate, contestDate);
    if (weeks <= 0) return null;
    const rate = manualRate ?? suggestedWeeklyRate(start, target, weeks);
    return {
      start,
      target,
      weeks,
      rate,
      required: requiredWeeklyRate(start, target, weeks),
      projected: projectedWeight(start, rate, weeks),
      reaches: reachesTarget(start, target, rate, weeks),
      points: goalLine(start, target, rate, weeks),
      daysLeft: daysUntilContest(contestDate, today),
    };
  }, [startKg, targetKg, contestDate, manualRate, today, startDate]);

  const rate = plan?.rate ?? manualRate ?? 0.5;

  return (
    <form action={action} className="flex flex-1 flex-col gap-3">
      {initial && <input type="hidden" name="prep_id" value={initial.id} />}
      {next && <input type="hidden" name="next" value={next} />}
      <label className="surface flex h-14 items-center justify-between gap-4 px-4">
        <span className="shrink-0 text-sm">大会</span>
        <input
          name="contest_name"
          required
          maxLength={60}
          value={contestName}
          onChange={(e) => setContestName(e.target.value)}
          placeholder="FWJ 東京 2027"
          className="text-fg placeholder:text-ghost min-w-0 flex-1 bg-transparent text-right text-base focus:outline-none"
        />
      </label>

      <label className="surface flex h-14 items-center justify-between gap-4 px-4">
        <span className="flex shrink-0 flex-col">
          <span className="text-sm">減量開始日</span>
          <span className="text-ghost text-[11px]">すでに始めていれば過去の日付に</span>
        </span>
        <input
          name="start_date"
          type="date"
          required
          max={today}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value || today)}
          className="num text-fg min-w-0 flex-1 bg-transparent text-right text-lg [color-scheme:dark] focus:outline-none"
        />
      </label>

      <label className="surface flex h-14 items-center justify-between gap-4 px-4">
        <span className="shrink-0 text-sm">大会日</span>
        <input
          name="contest_date"
          type="date"
          required
          min={today}
          value={contestDate}
          onChange={(e) => setContestDate(e.target.value)}
          className="num text-fg min-w-0 flex-1 bg-transparent text-right text-lg [color-scheme:dark] focus:outline-none"
        />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <WeightCard
          label="開始体重"
          name="start_weight_kg"
          value={startKg}
          onChange={setStartKg}
          placeholder="78.0"
        />
        <WeightCard
          label="目標体重"
          name="target_weight_kg"
          value={targetKg}
          onChange={setTargetKg}
          placeholder="70.0"
        />
      </div>

      <div className="surface flex flex-col px-4 pt-4 pb-3">
        <div className="flex items-baseline justify-between">
          <label htmlFor="weekly_rate_pct" className="text-sm">
            週ペース
          </label>
          <span className="flex items-baseline gap-1">
            <span className="num text-accent text-4xl">{rate.toFixed(2)}</span>
            <span className="text-muted text-xs">%/週</span>
          </span>
        </div>
        <input
          id="weekly_rate_pct"
          name="weekly_rate_pct"
          type="range"
          min={MIN_WEEKLY_RATE_PCT}
          max={MAX_WEEKLY_RATE_PCT}
          step={WEEKLY_RATE_STEP}
          value={rate}
          onChange={(e) => setManualRate(Number(e.target.value))}
          className="accent-accent mt-4 h-12 w-full"
        />

        {plan ? (
          <>
            <GoalLineChart points={plan.points} startKg={plan.start} targetKg={plan.target} />
            <p
              className={cn(
                "mt-2 text-xs leading-relaxed",
                plan.reaches ? "text-muted" : "text-warn",
              )}
            >
              {plan.reaches
                ? `大会日（D-${plan.daysLeft}）に目標 ${plan.target.toFixed(1)}kg へ。必要ペースは ${plan.required.toFixed(2)}%/週`
                : plan.required > MAX_WEEKLY_RATE_PCT
                  ? `目標まで ${plan.required.toFixed(2)}%/週が必要。上限 1.0%/週では大会日の予測は ${plan.projected.toFixed(1)}kg`
                  : `このペースでは大会日の予測は ${plan.projected.toFixed(1)}kg。必要ペースは ${plan.required.toFixed(2)}%/週`}
            </p>
            {manualRate !== null && (
              <button
                type="button"
                onClick={() => setManualRate(null)}
                className="text-ghost mt-1 self-start py-2 text-xs underline underline-offset-4"
              >
                推奨ペースに戻す
              </button>
            )}
          </>
        ) : (
          <p className="text-ghost mt-2 text-xs">大会日と体重を入れると目標ラインを表示します</p>
        )}
      </div>

      <label className="surface flex flex-col gap-3 px-4 py-4">
        <span className="text-sm">なぜやるのか</span>
        <textarea
          name="why_text"
          rows={3}
          maxLength={500}
          value={why}
          onChange={(e) => setWhy(e.target.value)}
          placeholder="きつい時に表示されます"
          className="border-border bg-bg text-fg placeholder:text-ghost focus:border-accent resize-none rounded-md border px-3 py-3 text-sm focus:outline-none"
        />
      </label>

      <div className="surface flex h-14 items-center justify-between px-4">
        <span id="reverse-label" className="text-sm">
          リバースダイエット計画も作る
        </span>
        <button
          type="button"
          role="switch"
          aria-checked={reverse}
          aria-labelledby="reverse-label"
          onClick={() => setReverse((v) => !v)}
          className="flex h-12 w-14 items-center justify-end"
        >
          <span
            className={cn(
              "border-border flex h-7 w-12 items-center rounded-full border px-0.5 transition-colors",
              reverse ? "bg-accent justify-end" : "bg-card justify-start",
            )}
          >
            <span className="bg-fg size-6 rounded-full" />
          </span>
        </button>
        {reverse && <input type="hidden" name="reverse_plan" value="on" />}
      </div>

      {state.error && (
        <p role="alert" className="text-warn text-sm">
          {state.error}
        </p>
      )}

      <div className="mt-auto flex flex-col gap-2 pt-4">
        <Button type="submit" size="lg" className="w-full" disabled={pending}>
          {initial ? "保存" : "プレップ開始"}
        </Button>
        {skipHref && (
          <Button asChild variant="ghost">
            <Link href={skipHref}>今はスキップ</Link>
          </Button>
        )}
      </div>
    </form>
  );
}
