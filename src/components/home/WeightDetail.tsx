"use client";

import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { weightChartPoints } from "@/lib/home";
import { todayISO } from "@/lib/prep";
import { useCheckins } from "@/lib/queries/checkins";
import { weightTrend } from "@/lib/trend";
import { cn } from "@/lib/utils";
import {
  headlineWeight,
  RANGES,
  rangeStart,
  rangeStats,
  signedKg,
  type RangeKey,
} from "@/lib/weight-stats";
import { WeightChart } from "./WeightChart";

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];
const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8))}`;
const full = (d: string) =>
  `${Number(d.slice(0, 4))}年${Number(d.slice(5, 7))}月${Number(d.slice(8))}日（${WEEKDAYS[new Date(`${d}T00:00:00`).getDay()]}）`;
const daysBetween = (a: string, b: string) =>
  Math.round(
    (new Date(`${b}T00:00:00Z`).getTime() - new Date(`${a}T00:00:00Z`).getTime()) / 86_400_000,
  ) + 1;

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-bg flex flex-col rounded-md px-3 py-2.5">
      <span className="text-muted text-xs">{label}</span>
      <span className="num text-2xl leading-tight">{value}</span>
      {sub && <span className="num text-ghost text-[11px]">{sub}</span>}
    </div>
  );
}

/** Weight over a chosen range: tap the chart for a day, with range stats and the records. */
export function WeightDetail() {
  const today = todayISO();
  const { prep } = useAppData();
  const { data, isPending, isError } = useCheckins("2000-01-01", today);
  const [range, setRange] = useState<RangeKey>("month");
  const [selected, setSelected] = useState<string | null>(null);

  const entries = useMemo(
    () =>
      (data ?? [])
        .filter((c) => c.weight_kg != null)
        .map((c) => ({ date: c.date, weightKg: c.weight_kg! })),
    [data],
  );
  const trendByDate = useMemo(
    () => new Map(weightTrend(entries).map((p) => [p.date, p])),
    [entries],
  );
  const from = rangeStart(range, entries, today);
  const points = useMemo(
    () => weightChartPoints(entries, today, prep, daysBetween(from, today)),
    [entries, today, prep, from],
  );
  const stats = rangeStats(entries, from, today);
  const headline = headlineWeight(entries, today);

  if (isError) {
    return (
      <p className="text-warn text-sm">読み込めませんでした。電波の良い場所で開き直してください</p>
    );
  }
  if (isPending) return <div className="surface h-96 animate-pulse" aria-busy />;

  const focus = selected ? trendByDate.get(selected) : null;
  const shownKg = selected ? (focus?.weightKg ?? null) : (headline?.kg ?? null);
  const shownDate = selected ?? headline?.date ?? today;
  const shownTrend = trendByDate.get(shownDate)?.trendKg ?? null;
  const records = entries.filter((e) => e.date >= from).reverse();

  return (
    <div className="flex flex-col gap-4 pb-6">
      <Link href="/home" className="text-muted -ml-2 flex h-10 w-fit items-center text-sm">
        <ChevronLeft aria-hidden className="size-5" />
        ホーム
      </Link>

      <div
        role="tablist"
        aria-label="期間"
        className="bg-card grid grid-cols-5 gap-1 rounded-md p-1"
      >
        {RANGES.map((r) => (
          <button
            key={r.key}
            type="button"
            role="tab"
            aria-selected={range === r.key}
            onClick={() => {
              setRange(r.key);
              setSelected(null);
            }}
            className={cn(
              "h-10 rounded-md text-sm",
              range === r.key ? "bg-fg text-bg font-bold" : "text-muted",
            )}
          >
            {r.label}
          </button>
        ))}
      </div>

      <section className="flex flex-col items-center gap-1" aria-live="polite">
        <p className="flex items-baseline gap-1.5">
          <span className="num text-[72px] leading-none tracking-tight">
            {shownKg !== null ? shownKg.toFixed(1) : "—"}
          </span>
          <span className="num text-muted text-2xl">kg</span>
        </p>
        <p className="text-muted text-sm">
          {full(shownDate)}
          {shownTrend !== null && (
            <span className="num text-ghost ml-2">7日平均 {shownTrend.toFixed(1)}</span>
          )}
        </p>
        {selected && (
          <button
            type="button"
            onClick={() => setSelected(null)}
            className="text-ghost h-8 text-xs underline underline-offset-4"
          >
            最新に戻す
          </button>
        )}
      </section>

      <section className="surface px-2 pt-3 pb-2">
        <WeightChart
          key={range}
          points={points}
          label={`${RANGES.find((r) => r.key === range)!.label}の体重`}
          height="h-64"
          axisDates
          selected={selected}
          onSelect={setSelected}
        />
        <p className="text-ghost flex items-center gap-3 px-2 pt-1 text-[11px]">
          <span className="flex items-center gap-1">
            <span aria-hidden className="bg-ghost inline-block size-1.5 rounded-full" />
            毎日の体重
          </span>
          <span className="flex items-center gap-1">
            <span aria-hidden className="bg-accent inline-block h-0.5 w-4" />
            7日平均
          </span>
          {prep && (
            <span className="flex items-center gap-1">
              <span aria-hidden className="border-fg/70 inline-block w-4 border-t border-dashed" />
              目標ライン
            </span>
          )}
          <span className="ml-auto">グラフをタップで日付を選択</span>
        </p>
      </section>

      {stats ? (
        <section className="grid grid-cols-2 gap-2">
          <Stat label="平均" value={`${stats.avg.toFixed(1)}kg`} sub={`${stats.count}日分の記録`} />
          <Stat
            label="7日平均の変化"
            value={stats.trendChange !== null ? `${signedKg(stats.trendChange)}kg` : "—"}
            sub={
              stats.perWeek !== null
                ? `週あたり ${signedKg(stats.perWeek)}kg`
                : "1週間分そろうと表示します"
            }
          />
          <Stat label="最高" value={`${stats.max.kg.toFixed(1)}kg`} sub={md(stats.max.date)} />
          <Stat label="最低" value={`${stats.min.kg.toFixed(1)}kg`} sub={md(stats.min.date)} />
        </section>
      ) : (
        <p className="surface text-muted px-4 py-4 text-sm">この期間の記録はありません</p>
      )}
      <p className="text-ghost text-xs leading-relaxed">
        日々の体重は水分や食事で上下します。判断は 7 日平均の動きで見てください。
      </p>

      {records.length > 0 && (
        <section className="flex flex-col">
          <h2 className="text-muted mb-1 text-xs">記録</h2>
          <ul className="surface divide-border divide-y">
            {records.slice(0, 120).map((e) => (
              <li key={e.date}>
                <button
                  type="button"
                  onClick={() => setSelected(e.date)}
                  className={cn(
                    "flex min-h-12 w-full items-center justify-between px-4 text-left",
                    selected === e.date && "bg-bg",
                  )}
                >
                  <span className="text-sm">{full(e.date)}</span>
                  <span className="num text-lg">{e.weightKg.toFixed(1)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
