"use client";

import Link from "next/link";
import { useState } from "react";
import { useMealActions } from "@/components/nutrition/useMealActions";
import { Button } from "@/components/ui/button";
import { daysLeftInPhase, phaseOn, type Phase } from "@/lib/cut-phases";
import { daysUntilContest } from "@/lib/prep";
import { cn } from "@/lib/utils";
import { usePhasePlan } from "./usePhasePlan";

const md = (d: string) => d.slice(5).replace("-", "/");
const kcalFmt = (n: number) => n.toLocaleString("ja-JP");

const SOURCE_TEXT = {
  manual: "手入力の値",
  records: "直近 3 週の食事と体重の記録から推定",
  weight:
    "体重 ×31kcal の目安。食事と体重の記録が 10 日分ほど貯まると記録からの推定に切り替わります",
} as const;

function Timeline({ phases, today }: { phases: Phase[]; today: string }) {
  const total = phases.reduce((s, p) => s + p.weeks, 0);
  return (
    <div className="flex flex-col gap-1">
      <div className="flex h-3 gap-0.5 overflow-hidden rounded-full">
        {phases.map((p) => {
          const current = p.start <= today && today <= p.end;
          const past = p.end < today;
          return (
            <span
              key={p.key}
              style={{ flexGrow: p.weeks }}
              className={cn(current ? "bg-accent" : past ? "bg-accent/35" : "bg-border")}
            />
          );
        })}
      </div>
      <div className="flex gap-0.5">
        {phases.map((p) => (
          <span
            key={p.key}
            style={{ flexGrow: p.weeks, flexBasis: 0 }}
            className={cn(
              "truncate text-[10px]",
              p.start <= today && today <= p.end ? "text-accent font-bold" : "text-ghost",
            )}
          >
            {p.name}
          </span>
        ))}
      </div>
      <span className="sr-only">全 {Math.round(total)} 週</span>
    </div>
  );
}

function PhaseCard({ p, current, today }: { p: Phase; current: boolean; today: string }) {
  const [open, setOpen] = useState(current);
  return (
    <section
      className={cn(
        "surface flex flex-col gap-2 px-4 py-3",
        current && "border-l-accent border-l-2",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex min-h-12 items-baseline justify-between gap-2 text-left"
      >
        <span className="flex items-baseline gap-2">
          <span className={cn("text-lg font-bold", current && "text-accent")}>{p.name}</span>
          <span className="num text-muted text-sm">
            {md(p.start)}〜{md(p.end)}
          </span>
        </span>
        <span className="num text-sm">
          {kcalFmt(p.kcalRange[0])}〜{kcalFmt(p.kcalRange[1])}
          <span className="text-muted text-xs"> kcal</span>
        </span>
      </button>

      {current && (
        <p className="text-muted -mt-1 text-xs">
          今このフェーズ・残り <span className="num text-fg">{daysLeftInPhase(p, today)}</span> 日
        </p>
      )}

      {open && (
        <>
          <div className="grid grid-cols-4 gap-1.5">
            {(
              [
                ["kcal", kcalFmt(p.kcal), ""],
                ["P", p.protein_g, "g"],
                ["F", p.fat_g, "g"],
                ["C", p.carb_g, "g"],
              ] as const
            ).map(([l, v, u]) => (
              <div key={l} className="bg-bg flex flex-col rounded-md px-2 py-2">
                <span className="label-en num text-muted text-xs">{l}</span>
                <span className="num text-accent text-xl leading-none">
                  {v}
                  <span className="text-muted text-[11px]">{u}</span>
                </span>
              </div>
            ))}
          </div>
          <p className="num text-sm">
            {p.weeklyLossKg > 0 ? (
              <>
                週 −{p.weeklyLossKg.toFixed(2)}kg（{p.weeklyRatePct.toFixed(2)}%）・
                {p.startKg.toFixed(1)}→{p.endKg.toFixed(1)}kg
              </>
            ) : (
              <>体重は維持（{p.endKg.toFixed(1)}kg 前後）</>
            )}
          </p>
          <p className="text-ghost text-xs leading-relaxed">{p.reason}</p>
          <ul className="flex flex-col gap-1">
            {p.tips.map((t) => (
              <li key={t} className="border-border border-l-2 pl-2 text-sm leading-relaxed">
                {t}
              </li>
            ))}
          </ul>
          {p.tooFast && (
            <p className="text-warn text-xs leading-relaxed">
              このペースは摂取が下がりすぎます（下限で止めています）。大会日か目標体重の見直しを検討してください
            </p>
          )}
        </>
      )}
    </section>
  );
}

/** Early / mid / late / peak guideline for the active prep, with an option to schedule it as targets. */
export function PhasePlan() {
  const { prep, today, phases, maintenance, source, estimated, setMaintenance } = usePhasePlan();
  const actions = useMealActions(today);
  const [confirming, setConfirming] = useState(false);
  const [applied, setApplied] = useState(false);

  if (!prep) {
    return (
      <div className="flex flex-col gap-3">
        <h1 className="text-xl font-bold">減量フェーズ</h1>
        <p className="text-muted text-sm">
          大会日と目標体重を設定すると、フェーズ別の目安を出します
        </p>
        <Button asChild size="lg">
          <Link href="/settings/prep">プレップを設定</Link>
        </Button>
      </div>
    );
  }

  const current = phaseOn(phases, today);
  const upcoming = phases.filter((p) => p.end >= today);
  const left = daysUntilContest(prep.contest_date, today);

  async function apply() {
    for (const p of upcoming) {
      const from = p.start > today ? p.start : today;
      const row = { kcal: p.kcal, protein_g: p.protein_g, fat_g: p.fat_g, carb_g: p.carb_g };
      await actions.saveTargets(
        [
          { day_type: "train", ...row },
          { day_type: "off", ...row },
        ],
        from,
      );
    }
    setConfirming(false);
    setApplied(true);
  }

  return (
    <div className="flex flex-col gap-4 pb-6">
      <div>
        <h1 className="text-xl font-bold">減量フェーズ</h1>
        <p className="text-muted text-sm">
          {prep.contest_name}・
          {left >= 0 ? (
            <>
              あと <span className="num text-fg">{left}</span> 日
            </>
          ) : (
            "終了"
          )}
          ・
          <span className="num">
            {prep.start_weight_kg.toFixed(1)}→{prep.target_weight_kg.toFixed(1)}kg
          </span>
        </p>
      </div>

      {phases.length > 0 && <Timeline phases={phases} today={today} />}

      {maintenance !== null && (
        <section className="surface flex flex-col gap-2 px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm">維持カロリー</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="維持カロリーを 50 下げる"
                onClick={() => setMaintenance(maintenance - 50)}
                className="border-border size-12 rounded-md border text-lg"
              >
                −
              </button>
              <span className="num w-20 text-center text-2xl">{kcalFmt(maintenance)}</span>
              <button
                type="button"
                aria-label="維持カロリーを 50 上げる"
                onClick={() => setMaintenance(maintenance + 50)}
                className="border-border size-12 rounded-md border text-lg"
              >
                ＋
              </button>
            </div>
          </div>
          <p className="text-ghost text-xs leading-relaxed">
            {SOURCE_TEXT[source]}
            。各フェーズの摂取はここから体重の減り方と代謝の低下を見込んで計算しています
          </p>
          {source === "manual" && (
            <button
              type="button"
              onClick={() => setMaintenance(null)}
              className="text-ghost self-start text-xs underline underline-offset-4"
            >
              {estimated ? "記録からの推定に戻す" : "目安に戻す"}
            </button>
          )}
        </section>
      )}

      {phases.map((p) => (
        <PhaseCard key={p.key} p={p} current={current?.key === p.key} today={today} />
      ))}

      {upcoming.length > 0 &&
        (confirming ? (
          <section className="surface flex flex-col gap-3 px-4 py-3">
            <p className="text-sm leading-relaxed">
              今日から各フェーズの開始日に、目標カロリーと PFC
              が自動で切り替わるように登録します。トレ日とオフ日は同じ値になるので、必要なら食事画面の「目標を変更」で調整してください。
            </p>
            <div className="grid grid-cols-2 gap-2">
              <Button variant="ghost" onClick={() => setConfirming(false)}>
                やめる
              </Button>
              <Button onClick={() => void apply()}>登録する</Button>
            </div>
          </section>
        ) : (
          <Button
            size="lg"
            variant={applied ? "secondary" : "primary"}
            onClick={() => setConfirming(true)}
          >
            {applied ? "目標に登録しました（もう一度登録する）" : "この目安を目標に登録する"}
          </Button>
        ))}

      <p className="text-ghost text-xs leading-relaxed">
        目安は一般的な減量の進め方にもとづく出発点です。週平均の体重と体調の記録を見ながら、50〜100kcal
        単位で調整してください。
      </p>
    </div>
  );
}
