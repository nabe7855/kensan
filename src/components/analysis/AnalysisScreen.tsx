"use client";

import { useAppData } from "@/components/providers/AppDataProvider";
import { WeightChart } from "@/components/home/WeightChart";
import { conditionHeatmap, mondayOf, weeklyWeightLine } from "@/lib/analysis";
import { weightChartPoints } from "@/lib/home";
import { addDaysISO, todayISO } from "@/lib/prep";
import { useWeeklyReports, useWeeklyVolume } from "@/lib/queries/analysis";
import { useCheckins } from "@/lib/queries/checkins";
import { BodyHeatmap } from "./BodyHeatmap";
import { ConditionHeatmap } from "./ConditionHeatmap";
import { PartSetsCard } from "./PartSetsCard";

const WEEKS = 12;

function Stat({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-muted text-[11px]">{label}</span>
      <span className="num text-2xl leading-tight">
        {value}
        {unit && <span className="text-muted ml-0.5 text-xs">{unit}</span>}
      </span>
    </div>
  );
}

export function AnalysisScreen() {
  const { prep, trackLibido } = useAppData();
  const today = todayISO();
  const thisMonday = mondayOf(today);
  const checkins = useCheckins(addDaysISO(today, -(WEEKS * 7 + 6)), today);
  const volume = useWeeklyVolume(thisMonday);
  const reports = useWeeklyReports(addDaysISO(thisMonday, -7));

  const entries = (checkins.data ?? [])
    .filter((c) => c.weight_kg != null)
    .map((c) => ({ date: c.date, weightKg: c.weight_kg! }));
  const thisWeek = reports.data?.find((r) => r.week_start === thisMonday) ?? null;
  const lastWeek = reports.data?.find((r) => r.week_start === addDaysISO(thisMonday, -7)) ?? null;
  const weightLine = weeklyWeightLine(thisWeek, lastWeek);

  if (checkins.isError) {
    return (
      <p className="text-warn text-sm">読み込めませんでした。電波の良い場所で開き直してください</p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <section className="surface px-2 pt-3 pb-2">
        <p className="label-en num flex items-center gap-2 px-2 text-sm">
          WEEK AVG <span aria-hidden className="bg-accent inline-block h-0.5 w-8" />
          <span className="text-ghost ml-auto text-[10px] normal-case">{WEEKS}週</span>
        </p>
        {entries.length > 0 ? (
          <WeightChart
            points={weightChartPoints(entries, today, prep, WEEKS * 7)}
            label={`直近${WEEKS}週の体重`}
          />
        ) : (
          <p className="text-muted px-2 py-8 text-sm">体重を記録すると表示されます</p>
        )}
        {weightLine && <p className="text-muted px-2 pt-1 text-sm">{weightLine}</p>}
      </section>

      <section className="surface px-3 py-3">
        <ConditionHeatmap rows={conditionHeatmap(checkins.data ?? [], today, trackLibido)} />
      </section>

      <PartSetsCard monday={thisMonday} today={today} />

      <section className="surface px-3 py-4">
        <h2 className="text-muted mb-2 text-xs">今週の筋群別セット数（ウォームアップ除く）</h2>
        <BodyHeatmap sets={volume.data ?? {}} />
      </section>

      {thisWeek && (
        <section className="surface grid grid-cols-3 gap-3 px-4 py-3">
          <Stat label="今週のセット" value={String(thisWeek.total_sets)} />
          <Stat
            label="平均 kcal"
            value={
              thisWeek.avg_kcal != null
                ? Math.round(thisWeek.avg_kcal).toLocaleString("ja-JP")
                : "—"
            }
          />
          <Stat
            label="平均睡眠"
            value={thisWeek.avg_sleep != null ? thisWeek.avg_sleep.toFixed(1) : "—"}
            unit="/5"
          />
        </section>
      )}
    </div>
  );
}
