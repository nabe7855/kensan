"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { useWeekFacts } from "@/components/checkin/useWeekFacts";
import { useAppData } from "@/components/providers/AppDataProvider";
import { Button } from "@/components/ui/button";
import { buildPeakFacts, type PeakFacts } from "@/lib/ai/peak";
import { addDaysISO, todayISO } from "@/lib/prep";
import { peakKey, useAiPeakPlan, type AiPeakPlan } from "@/lib/queries/ai";

async function requestPlan(contestId: string, facts: PeakFacts): Promise<AiPeakPlan> {
  const res = await fetch("/api/ai/peak", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ contest_id: contestId, facts }),
  });
  const json = (await res.json().catch(() => null)) as {
    plan?: AiPeakPlan;
    error?: string;
  } | null;
  if (!res.ok || !json?.plan) throw new Error(json?.error ?? "うまくまとめられませんでした");
  return json.plan;
}

const dayLabel = (n: number) => (n === 0 ? "当日" : n === 1 ? "前日" : `${n}日前`);

type Props = {
  contestId: string;
  contestDate: string;
  daysLeft: number;
  openKeys: string[];
  ownOpen: number;
};

/** AI summary of how to spend the days up to the contest, from the app's own numbers. */
export function PeakAssistant({ contestId, contestDate, daysLeft, openKeys, ownOpen }: Props) {
  const { aiEnabled, prep } = useAppData();
  const queryClient = useQueryClient();
  const today = todayISO();
  const plan = useAiPeakPlan(contestId, aiEnabled);
  const { ready, facts: week } = useWeekFacts(addDaysISO(today, -6));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  if (!aiEnabled) return null;

  const current = plan.data ?? null;
  const fresh = current?.on_date === today;

  async function run() {
    if (!week) return;
    if (!navigator.onLine) return setError("通信が必要です");
    setError(null);
    setBusy(true);
    try {
      const facts = buildPeakFacts({
        daysToContest: daysLeft,
        targetWeightKg: prep?.contest_date === contestDate ? prep.target_weight_kg : null,
        week,
        openKeys,
        ownOpen,
      });
      const next = await requestPlan(contestId, facts);
      queryClient.setQueryData(peakKey(contestId), next);
    } catch (e) {
      setError(e instanceof Error ? e.message : "うまくまとめられませんでした");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <h2 className="text-base font-bold">AI と最終調整を確認</h2>

      {current ? (
        <div className="flex flex-col gap-3">
          {!fresh && (
            <p className="text-muted text-xs">
              <span className="num">{current.on_date.slice(5).replace("-", "/")}</span>{" "}
              の記録でまとめた内容です
            </p>
          )}
          <p className="surface px-4 py-4 text-sm leading-relaxed">{current.result.summary}</p>
          <ol className="flex flex-col gap-1.5">
            {current.result.days.map((d) => (
              <li key={d.days_before} className="surface flex flex-col gap-1 px-4 py-3">
                <span className="flex items-baseline gap-2">
                  <span className="num text-accent text-sm font-bold">
                    {dayLabel(d.days_before)}
                  </span>
                  <span className="text-sm font-bold">{d.focus}</span>
                </span>
                <ul className="flex flex-col gap-0.5">
                  {d.items.map((t) => (
                    <li key={t} className="text-muted text-sm leading-relaxed">
                      {t}
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ol>
          {current.result.cautions.length > 0 && (
            <div className="border-warn flex flex-col gap-1 border-l-2 pl-3">
              {current.result.cautions.map((c) => (
                <p key={c} className="text-sm leading-relaxed">
                  {c}
                </p>
              ))}
            </div>
          )}
        </div>
      ) : (
        <p className="text-muted text-sm leading-relaxed">
          直近 7 日の記録と準備の残りから、大会当日までの過ごし方を 1 日ずつまとめます。
        </p>
      )}

      <Button
        variant={current ? "ghost" : "primary"}
        onClick={() => void run()}
        disabled={!ready || busy || plan.isPending}
      >
        {busy ? "まとめ中…" : current ? "今日の記録でまとめ直す" : "AI と最終調整を確認する"}
      </Button>
      {error && <p className="text-warn text-sm">{error}</p>}
      <p className="text-ghost text-xs leading-relaxed">
        AI
        による目安です。水分・塩分の調整や薬・サプリの量は扱いません。体調に不安があるときは、トレーナーや医師に相談してください。
      </p>
    </section>
  );
}
