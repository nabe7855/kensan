"use client";

import { useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { Button } from "@/components/ui/button";
import { adjustedTargets, lastWeekStart, type CheckinFacts } from "@/lib/ai/checkin";
import { mondayOf } from "@/lib/analysis";
import type { Target } from "@/lib/nutrition";
import { addDaysISO, todayISO } from "@/lib/prep";
import { aiKeys, useAiCheckins, type AiCheckin } from "@/lib/queries/ai";
import { nutritionKeys, useTargets } from "@/lib/queries/nutrition";
import { useWeekFacts } from "./useWeekFacts";

const md = (d: string) => `${Number(d.slice(5, 7))}/${Number(d.slice(8))}`;
const weekLabel = (start: string) => `${md(start)}〜${md(addDaysISO(start, 6))}`;

async function requestCheckin(facts: CheckinFacts): Promise<AiCheckin> {
  const res = await fetch("/api/ai/checkin", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(facts),
  });
  const json = (await res.json().catch(() => null)) as {
    checkin?: AiCheckin;
    error?: string;
  } | null;
  if (!res.ok || !json?.checkin) throw new Error(json?.error ?? "振り返りを作れませんでした");
  return json.checkin;
}

export function CheckinScreen() {
  const { aiEnabled } = useAppData();
  const queryClient = useQueryClient();
  const today = todayISO();
  const weekStart = lastWeekStart(mondayOf(today));
  const history = useAiCheckins();
  const { ready, facts, failed } = useWeekFacts(weekStart);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const current = history.data?.find((c) => c.week_start === weekStart) ?? null;
  const past = (history.data ?? []).filter((c) => c.week_start !== weekStart);

  async function run() {
    if (!facts) return;
    if (!navigator.onLine) return setError("振り返りには通信が必要です");
    setError(null);
    setBusy(true);
    try {
      const checkin = await requestCheckin(facts);
      queryClient.setQueryData<AiCheckin[]>(aiKeys.checkins, (list = []) => [
        checkin,
        ...list.filter((c) => c.week_start !== checkin.week_start),
      ]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "振り返りを作れませんでした");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-bold">週の振り返り</h1>
        <p className="text-muted text-sm">
          先週（<span className="num">{weekLabel(weekStart)}</span>
          ）の記録を、週平均で AI が振り返ります
        </p>
      </div>

      {!aiEnabled ? (
        <div className="surface flex flex-col gap-3 px-4 py-4">
          <p className="text-sm">AI 機能がオフになっています。</p>
          <Button asChild variant="secondary">
            <Link href="/settings">設定でオンにする</Link>
          </Button>
        </div>
      ) : current ? (
        <CheckinView checkin={current} />
      ) : (
        <div className="surface flex flex-col gap-3 px-4 py-4">
          <p className="text-muted text-sm leading-relaxed">
            体重・食事・トレーニング・コンディションの記録をまとめ、気づいた点と来週の提案を出します。
          </p>
          <Button onClick={() => void run()} disabled={!ready || busy || failed}>
            {busy ? "振り返り中…" : "先週を振り返る"}
          </Button>
        </div>
      )}

      {error && <p className="text-warn text-sm">{error}</p>}
      {failed && <p className="text-warn text-sm">記録を読み込めませんでした</p>}

      {aiEnabled && current && (
        <Button variant="ghost" onClick={() => void run()} disabled={!ready || busy}>
          {busy ? "作り直し中…" : "記録を直したので作り直す"}
        </Button>
      )}

      {past.length > 0 && (
        <section className="flex flex-col gap-3">
          <h2 className="text-muted text-xs">これまでの振り返り</h2>
          {past.map((c) => (
            <details key={c.id} className="surface px-4 py-3">
              <summary className="flex min-h-12 cursor-pointer items-center text-sm font-bold">
                <span className="num">{weekLabel(c.week_start)}</span>
              </summary>
              <div className="pt-2">
                <CheckinView checkin={c} compact />
              </div>
            </details>
          ))}
        </section>
      )}
    </div>
  );
}

function CheckinView({ checkin, compact = false }: { checkin: AiCheckin; compact?: boolean }) {
  const { result } = checkin;
  return (
    <div className="flex flex-col gap-4">
      <p
        className={
          compact ? "text-sm leading-relaxed" : "surface px-4 py-4 text-base leading-relaxed"
        }
      >
        {result.summary}
      </p>

      {result.points.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-muted text-xs">気づいた点</h2>
          {result.points.map((p, i) => (
            <div key={i} className="surface flex flex-col gap-1 px-4 py-3">
              <span className="text-muted text-xs">{p.area}</span>
              <p className="text-sm leading-relaxed">{p.text}</p>
            </div>
          ))}
        </section>
      )}

      {result.actions.length > 0 && (
        <section className="flex flex-col gap-2">
          <h2 className="text-muted text-xs">来週の提案</h2>
          {result.actions.map((a, i) => (
            <div key={i} className="surface flex flex-col gap-1 px-4 py-3">
              <p className="text-sm leading-relaxed font-bold">{a.text}</p>
              <p className="text-muted text-xs leading-relaxed">{a.reason}</p>
            </div>
          ))}
        </section>
      )}

      {checkin.kcal_delta !== 0 && !compact && <Adjustment checkin={checkin} />}

      <p className="text-ghost text-xs leading-relaxed">
        AI による振り返りです。体調に不安があるときは、専門家に相談してください。
      </p>
    </div>
  );
}

/** The rule-based calorie change, applied only when the user says so. */
function Adjustment({ checkin }: { checkin: AiCheckin }) {
  const { userId } = useAppData();
  const { write } = useSync();
  const queryClient = useQueryClient();
  const targets = useTargets();
  const today = todayISO();
  const [done, setDone] = useState(!!checkin.applied_at);
  const next = targets.data ? adjustedTargets(targets.data, today, checkin.kcal_delta) : null;
  const sign = checkin.kcal_delta > 0 ? "+" : "";

  async function apply() {
    if (!next) return;
    queryClient.setQueryData<Target[]>(nutritionKeys.targets, (t) => [
      ...next.map((r) => ({ ...r, effective_from: today })),
      ...(t ?? []).filter((x) => x.effective_from !== today),
    ]);
    await write({
      table: "nutrition_targets",
      kind: "upsert",
      onConflict: "user_id,effective_from,day_type",
      payload: next.map((r) => ({ ...r, user_id: userId, effective_from: today })),
    });
    await write({
      table: "ai_checkins",
      kind: "update",
      match: { id: checkin.id },
      payload: { applied_at: new Date().toISOString() },
    });
    setDone(true);
    void queryClient.invalidateQueries({ queryKey: aiKeys.checkins });
  }

  return (
    <section className="surface flex flex-col gap-3 px-4 py-4">
      <h2 className="text-sm font-bold">
        カロリー目標の調整{" "}
        <span className="num">
          {sign}
          {checkin.kcal_delta}kcal
        </span>
      </h2>
      {checkin.result.adjustment_note && (
        <p className="text-muted text-sm leading-relaxed">{checkin.result.adjustment_note}</p>
      )}
      {next ? (
        <p className="num text-muted text-xs">
          {next
            .map(
              (t) =>
                `${t.day_type === "train" ? "トレ日" : "オフ日"} ${t.kcal}kcal（炭水化物 ${t.carb_g}g）`,
            )
            .join("　")}
        </p>
      ) : (
        <p className="text-muted text-xs">
          今の目標からは調整できません。目標は食事タブから見直してください。
        </p>
      )}
      {done ? (
        <p className="text-muted text-sm">今日から目標に反映しました</p>
      ) : (
        next && <Button onClick={() => void apply()}>今日から目標に反映する</Button>
      )}
    </section>
  );
}
