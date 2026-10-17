"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { ScaleRow } from "@/components/condition/ScaleRow";
import { Button } from "@/components/ui/button";
import { kvDelete, kvGet } from "@/lib/offline/db";
import { percentDiff } from "@/lib/progress";
import { cn } from "@/lib/utils";
import { SUMMARY_KEY, type StoredSummary } from "./WorkoutScreen";

const FEEL = [
  { value: 1, label: "低" },
  { value: 2, label: "中" },
  { value: 3, label: "高" },
  { value: 4, label: "最大" },
];

const FIELDS = [
  { key: "pump", label: "パンプ" },
  { key: "soreness", label: "筋肉痛" },
  { key: "joint", label: "関節" },
  { key: "load_feel", label: "負荷感" },
] as const;

type FeelKey = (typeof FIELDS)[number]["key"];

function Stat({
  label,
  value,
  unit,
  note,
  noteUp,
}: {
  label: string;
  value: string;
  unit?: string;
  note?: string | null;
  noteUp?: boolean;
}) {
  return (
    <div className="surface flex flex-col px-3 py-3">
      <span className="text-muted text-xs">{label}</span>
      <span className="num text-accent mt-1 text-4xl leading-none">{value}</span>
      {unit && <span className="num text-muted text-xs">{unit}</span>}
      {note && (
        <span className={cn("num mt-1 text-xs", noteUp ? "text-accent" : "text-ghost")}>
          {note}
        </span>
      )}
    </div>
  );
}

export function SummaryScreen() {
  const router = useRouter();
  const { userId } = useAppData();
  const { write } = useSync();
  const [summary, setSummary] = useState<StoredSummary | null | undefined>(undefined);
  const [feel, setFeel] = useState<Record<FeelKey, number | null>>({
    pump: null,
    soreness: null,
    joint: null,
    load_feel: null,
  });

  useEffect(() => {
    void kvGet<StoredSummary>(SUMMARY_KEY).then((s) => setSummary(s ?? null));
  }, []);
  useEffect(() => {
    if (summary === null) router.replace("/training");
  }, [summary, router]);

  if (summary === undefined) return <div className="surface h-96 animate-pulse" aria-busy />;
  if (summary === null) return null;

  async function save() {
    if (Object.values(feel).some((v) => v !== null)) {
      await write({
        table: "workouts",
        kind: "update",
        match: { id: summary!.workoutId, user_id: userId },
        payload: feel,
      });
    }
    await kvDelete(SUMMARY_KEY);
    router.push("/training");
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h1 className="num text-5xl leading-tight">{summary.title} 完了</h1>
        <p className="num text-muted text-xl">{summary.durationMin}分</p>
      </div>

      <div className="grid grid-cols-[1.3fr_1fr_1fr] gap-2">
        <Stat
          label="総ボリューム"
          value={summary.volumeKg.toLocaleString("ja-JP")}
          unit="kg"
          note={
            summary.prevVolumeKg
              ? `前回比 ${percentDiff(summary.volumeKg, summary.prevVolumeKg)}`
              : null
          }
          noteUp={!!summary.prevVolumeKg && summary.volumeKg > summary.prevVolumeKg}
        />
        <Stat label="セット" value={String(summary.setCount)} />
        <Stat label="PR" value={String(summary.prs.length)} />
      </div>

      {summary.prs.length > 0 && (
        <section className="surface px-4 py-3">
          <h2 className="label-en num border-border border-b pb-2 text-lg">PR</h2>
          <ul>
            {summary.prs.map((p) => (
              <li
                key={p.name}
                className="text-accent border-border num border-b py-3 text-xl last:border-b-0"
              >
                {p.name} {p.weightKg}kg × {p.reps}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="text-lg font-bold">今日の感触</h2>
        {FIELDS.map((f) => (
          <ScaleRow
            key={f.key}
            label={f.label}
            options={FEEL}
            value={feel[f.key]}
            onChange={(v) => setFeel((s) => ({ ...s, [f.key]: v }))}
          />
        ))}
      </section>

      <Button size="lg" className="mt-2" onClick={save}>
        保存
      </Button>
    </div>
  );
}
