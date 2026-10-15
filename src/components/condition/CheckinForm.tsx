"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { useSync } from "@/components/providers/SyncProvider";
import { Button } from "@/components/ui/button";
import { activeItems, type ConditionKey } from "@/lib/condition";
import { checkinKeys, type CheckinRow } from "@/lib/queries/checkins";
import { ScaleRow } from "./ScaleRow";

const ONE_TO_FIVE = [1, 2, 3, 4, 5].map((v) => ({ value: v, label: String(v) }));
const BOWEL = [
  { value: "good", label: "良" },
  { value: "normal", label: "普通" },
  { value: "bad", label: "悪" },
];

type Props = {
  date: string;
  existing: CheckinRow | null;
  lastWeightKg: number | null;
};

const parseNum = (s: string, min: number, max: number) => {
  if (s.trim() === "") return null;
  const n = Number(s);
  return Number.isFinite(n) && n >= min && n <= max ? n : undefined;
};

export function CheckinForm({ date, existing, lastWeightKg }: Props) {
  const router = useRouter();
  const { userId, trackLibido } = useAppData();
  const { write } = useSync();
  const queryClient = useQueryClient();

  const [weight, setWeight] = useState(existing?.weight_kg?.toFixed(1) ?? "");
  const [scores, setScores] = useState<Record<ConditionKey, number | null>>({
    hunger: existing?.hunger ?? null,
    sleep: existing?.sleep ?? null,
    mood: existing?.mood ?? null,
    energy: existing?.energy ?? null,
    libido: existing?.libido ?? null,
  });
  const [bowel, setBowel] = useState<string | null>(existing?.bowel ?? null);
  const [note, setNote] = useState(existing?.note ?? "");
  const [showDetail, setShowDetail] = useState(existing?.rhr != null || existing?.temp_c != null);
  const [rhr, setRhr] = useState(existing?.rhr?.toString() ?? "");
  const [temp, setTemp] = useState(existing?.temp_c?.toFixed(1) ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const weightKg = parseNum(weight, 20, 300);
    const rhrNum = parseNum(rhr, 20, 200);
    const tempNum = parseNum(temp, 33, 42);
    if (weightKg === undefined) return setError("体重は 20〜300 kg で入力してください");
    if (rhrNum === undefined) return setError("心拍は 20〜200 で入力してください");
    if (tempNum === undefined) return setError("体温は 33〜42 ℃ で入力してください");

    setSaving(true);
    setError(null);
    const row: CheckinRow = {
      date,
      weight_kg: weightKg,
      ...scores,
      libido: trackLibido ? scores.libido : (existing?.libido ?? null),
      bowel,
      note: note.trim() || null,
      rhr: rhrNum === null ? null : Math.round(rhrNum),
      temp_c: tempNum,
    };
    for (const [key, rows] of queryClient.getQueriesData<CheckinRow[]>({
      queryKey: checkinKeys.all,
    })) {
      const [, from, to] = key as ReturnType<typeof checkinKeys.range>;
      if (!rows || date < from || date > to) continue;
      queryClient.setQueryData(
        key,
        [...rows.filter((r) => r.date !== date), row].sort((a, b) => a.date.localeCompare(b.date)),
      );
    }
    await write({
      table: "daily_checkins",
      kind: "upsert",
      onConflict: "user_id,date",
      payload: { user_id: userId, ...row },
    });
    router.push("/home");
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <label className="surface flex items-end justify-between px-4 pt-4 pb-3">
        <span className="text-muted self-start text-sm">今朝の体重</span>
        <span className="flex items-baseline gap-2">
          <input
            name="weight_kg"
            inputMode="decimal"
            autoComplete="off"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder={lastWeightKg?.toFixed(1) ?? "70.0"}
            aria-label="体重 (kg)"
            className="num text-accent placeholder:text-ghost w-48 bg-transparent text-right text-[80px] leading-none focus:outline-none"
          />
          <span className="num text-muted text-2xl">kg</span>
        </span>
      </label>

      {activeItems(trackLibido).map((item) => (
        <ScaleRow
          key={item.key}
          label={item.label}
          options={ONE_TO_FIVE}
          value={scores[item.key]}
          onChange={(v) => setScores((s) => ({ ...s, [item.key]: v }))}
        />
      ))}
      <ScaleRow label="便通" options={BOWEL} value={bowel} onChange={setBowel} />

      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        maxLength={140}
        placeholder="ひとこと"
        aria-label="ひとこと"
        className="surface placeholder:text-ghost focus:border-accent h-14 px-4 text-base focus:outline-none"
      />

      {showDetail ? (
        <div className="grid grid-cols-2 gap-2">
          <label className="surface flex flex-col gap-1 px-4 py-3">
            <span className="text-muted text-xs">安静時心拍</span>
            <span className="flex items-baseline gap-1">
              <input
                inputMode="numeric"
                value={rhr}
                onChange={(e) => setRhr(e.target.value)}
                placeholder="—"
                className="num placeholder:text-ghost w-full bg-transparent text-3xl focus:outline-none"
              />
              <span className="text-muted text-xs">bpm</span>
            </span>
          </label>
          <label className="surface flex flex-col gap-1 px-4 py-3">
            <span className="text-muted text-xs">起床時体温</span>
            <span className="flex items-baseline gap-1">
              <input
                inputMode="decimal"
                value={temp}
                onChange={(e) => setTemp(e.target.value)}
                placeholder="—"
                className="num placeholder:text-ghost w-full bg-transparent text-3xl focus:outline-none"
              />
              <span className="text-muted text-xs">℃</span>
            </span>
          </label>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowDetail(true)}
          className="text-ghost h-12 self-start text-sm underline underline-offset-4"
        >
          心拍・体温も記録する
        </button>
      )}

      {error && (
        <p role="alert" className="text-warn text-sm">
          {error}
        </p>
      )}

      <Button type="submit" size="lg" className="mt-2 w-full" disabled={saving}>
        記録
      </Button>
    </form>
  );
}
