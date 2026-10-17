"use client";

import { ArrowDown, ArrowRight, ArrowUp } from "lucide-react";
import Link from "next/link";
import { useAppData } from "@/components/providers/AppDataProvider";
import { Button } from "@/components/ui/button";
import { activeItems, isConcerning, shouldShowWhy } from "@/lib/condition";
import { weightChartPoints } from "@/lib/home";
import { addDaysISO, todayISO } from "@/lib/prep";
import { useCheckins } from "@/lib/queries/checkins";
import { trendDirection, weightTrend } from "@/lib/trend";
import { cn } from "@/lib/utils";
import { NutritionSummary } from "./NutritionSummary";
import { PhaseCard } from "./PhaseCard";
import { TodayTrainingCard } from "./TodayTrainingCard";
import { WeightChart } from "./WeightChart";

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

  return (
    <div className="flex flex-col gap-3">
      {latest ? (
        <section className="surface flex items-end justify-between px-4 pt-3 pb-4">
          <div>
            <p className="text-muted text-sm">週平均</p>
            <p className="flex items-baseline gap-2">
              <span className="num text-[80px] leading-none">{latest.trendKg.toFixed(1)}</span>
              <span className="num text-muted text-2xl">kg</span>
              {DirectionIcon && (
                <DirectionIcon.Icon
                  aria-label={DirectionIcon.label}
                  className="text-muted size-6 self-center"
                />
              )}
            </p>
          </div>
          <div className="border-border border-l pb-1 pl-4 text-right">
            <p className="text-muted text-xs">
              {todayCheckin?.weight_kg != null ? "今朝" : "最新"}
            </p>
            <p className="num text-muted text-3xl leading-none">
              {(todayCheckin?.weight_kg ?? entries.at(-1)?.weightKg)?.toFixed(1)}
            </p>
          </div>
        </section>
      ) : (
        <section className="surface px-4 py-5">
          <p className="text-sm">体重を記録すると、7日平均のトレンドが表示されます</p>
        </section>
      )}

      {latest && (
        <section className="surface px-2 pt-3 pb-2">
          <WeightChart points={weightChartPoints(entries, today, prep)} />
        </section>
      )}

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
