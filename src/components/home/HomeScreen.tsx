"use client";

import { ArrowDown, ArrowRight, ArrowUp, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useAppData } from "@/components/providers/AppDataProvider";
import { Button } from "@/components/ui/button";
import { activeItems, isConcerning, shouldShowWhy } from "@/lib/condition";
import { weightChartPoints } from "@/lib/home";
import { addDaysISO, todayISO } from "@/lib/prep";
import { useCheckins } from "@/lib/queries/checkins";
import { trendDirection, weightTrend } from "@/lib/trend";
import { cn } from "@/lib/utils";
import { headlineWeight } from "@/lib/weight-stats";
import { ContestCard } from "./ContestCard";
import { SafetyCard } from "./SafetyCard";
import { NutritionSummary } from "./NutritionSummary";
import { PhaseCard } from "./PhaseCard";
import { TodayTrainingCard } from "./TodayTrainingCard";
import { WeightChart } from "./WeightChart";

const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8))}`;

const DIRECTION = {
  down: { Icon: ArrowDown, label: "7日前より低い" },
  up: { Icon: ArrowUp, label: "7日前より高い" },
  flat: { Icon: ArrowRight, label: "7日前と同じ" },
} as const;

export function HomeScreen() {
  const { prep, trackLibido } = useAppData();
  const today = todayISO();
  const { data, isPending, isError } = useCheckins(addDaysISO(today, -40), today);

  if (isError) {
    return (
      <p className="text-warn text-sm">読み込めませんでした。電波の良い場所で開き直してください</p>
    );
  }
  if (isPending) return <div className="surface h-96 animate-pulse" aria-busy />;

  const entries = data
    .filter((c) => c.weight_kg != null)
    .map((c) => ({ date: c.date, weightKg: c.weight_kg! }));
  const trend = weightTrend(entries);
  const latest = trend.at(-1);
  const direction = trendDirection(trend);
  const todayCheckin = data.find((c) => c.date === today) ?? null;
  const showWhy = !!prep?.why_text && shouldShowWhy(data, today, trackLibido);
  const DirectionIcon = direction ? DIRECTION[direction] : null;
  const headline = headlineWeight(entries, today);

  return (
    <div className="flex flex-col gap-3">
      {headline && latest ? (
        <Link
          href="/weight"
          aria-label="体重の詳細を開く"
          className="surface flex flex-col gap-1 px-4 pt-3 pb-2 active:opacity-90"
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex flex-col">
              <span className="text-muted text-sm">
                {headline.isToday ? "今朝" : `最新（${md(headline.date)}）`}
              </span>
              <span className="flex items-baseline gap-1.5">
                <span className="num text-[88px] leading-none tracking-tight">
                  {headline.kg.toFixed(1)}
                </span>
                <span className="num text-muted text-2xl">kg</span>
              </span>
            </div>
            <div className="flex flex-col items-end gap-1 pt-1">
              <span className="text-muted text-xs">週平均</span>
              <span className="flex items-center gap-1">
                <span className="num text-2xl leading-none">{latest.trendKg.toFixed(1)}</span>
                {DirectionIcon && (
                  <DirectionIcon.Icon
                    aria-label={DirectionIcon.label}
                    className="text-muted size-4"
                  />
                )}
              </span>
              <span className="text-ghost flex items-center text-xs">
                詳細
                <ChevronRight aria-hidden className="size-3.5" />
              </span>
            </div>
          </div>
          <WeightChart points={weightChartPoints(entries, today, prep)} height="h-36" />
        </Link>
      ) : (
        <section className="surface px-4 py-5">
          <p className="text-sm">体重を記録すると、ここに大きく表示されます</p>
        </section>
      )}

      <SafetyCard />
      <ContestCard />
      <PhaseCard />
      <NutritionSummary today={today} />

      <TodayTrainingCard />

      {showWhy && (
        <section className="surface border-l-accent border-l-2 px-4 py-4">
          <p className="text-muted text-xs">なぜやるのか</p>
          <p className="mt-2 text-base leading-relaxed whitespace-pre-wrap">{prep!.why_text}</p>
          <p className="text-ghost mt-3 text-xs">ここ3日、体調スコアが普段より低めです</p>
        </section>
      )}

      {todayCheckin ? (
        <Link
          href="/condition"
          aria-label="今日のチェックインを編集"
          className="grid gap-2"
          style={{
            gridTemplateColumns: `repeat(${activeItems(trackLibido).length}, minmax(0, 1fr))`,
          }}
        >
          {activeItems(trackLibido).map((item) => {
            const v = todayCheckin[item.key];
            return (
              <div key={item.key} className="surface flex flex-col items-center py-3">
                <span className="text-muted text-xs">{item.label}</span>
                <span
                  className={cn(
                    "num mt-1 text-4xl leading-none",
                    v == null ? "text-ghost" : isConcerning(item.key, v) ? "text-warn" : "text-fg",
                  )}
                >
                  {v ?? "—"}
                </span>
              </div>
            );
          })}
        </Link>
      ) : (
        <section className="surface flex flex-col gap-3 px-4 py-4">
          <p className="text-sm">今朝のチェックインがまだです</p>
          <Button asChild size="lg">
            <Link href="/condition">チェックインする</Link>
          </Button>
        </section>
      )}
    </div>
  );
}
