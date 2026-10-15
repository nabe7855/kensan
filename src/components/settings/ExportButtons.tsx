"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { toCsv } from "@/lib/csv";
import { todayISO } from "@/lib/prep";
import { getSupabase } from "@/lib/supabase/client";

function download(filename: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const jst = (iso: string | null) =>
  iso
    ? new Intl.DateTimeFormat("sv-SE", {
        timeZone: "Asia/Tokyo",
        dateStyle: "short",
        timeStyle: "medium",
      }).format(new Date(iso))
    : "";

/** Fetch every row in pages of 1000 (PostgREST's default cap). */
async function all<T>(
  fetchPage: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: unknown }>,
) {
  const rows: T[] = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await fetchPage(from, from + 999);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) return rows;
  }
}

type SetRow = {
  set_no: number;
  set_type: string;
  weight_kg: number | null;
  reps: number | null;
  rir: number | null;
  is_pr: boolean;
  done_at: string | null;
  exercises: { name_ja: string } | null;
  workouts: { started_at: string } | null;
};

type MealRow = {
  grams: number;
  meal_logs: { date: string; slot: string } | null;
  foods: { name: string; kcal: number; protein_g: number; fat_g: number; carb_g: number } | null;
};

export function ExportButtons() {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const supabase = getSupabase();
  const stamp = todayISO();

  async function run(kind: string, task: () => Promise<void>) {
    setBusy(kind);
    setError(null);
    try {
      await task();
    } catch {
      setError("書き出せませんでした。電波の良い場所でもう一度お試しください");
    } finally {
      setBusy(null);
    }
  }

  const exportCheckins = () =>
    run("checkins", async () => {
      const rows = await all((a, b) =>
        supabase
          .from("daily_checkins")
          .select("date, weight_kg, hunger, sleep, mood, energy, libido, bowel, note, rhr, temp_c")
          .order("date")
          .range(a, b),
      );
      download(
        `kensan-checkins-${stamp}.csv`,
        toCsv(rows, [
          { header: "日付", value: (r) => r.date },
          { header: "体重kg", value: (r) => r.weight_kg },
          { header: "空腹", value: (r) => r.hunger },
          { header: "睡眠", value: (r) => r.sleep },
          { header: "気分", value: (r) => r.mood },
          { header: "活力", value: (r) => r.energy },
          { header: "性欲", value: (r) => r.libido },
          { header: "便通", value: (r) => r.bowel },
          { header: "ひとこと", value: (r) => r.note },
          { header: "安静時心拍", value: (r) => r.rhr },
          { header: "起床時体温", value: (r) => r.temp_c },
        ]),
      );
    });

  const exportTraining = () =>
    run("training", async () => {
      const rows = await all<SetRow>(
        (a, b) =>
          supabase
            .from("workout_sets")
            .select(
              "set_no, set_type, weight_kg, reps, rir, is_pr, done_at, exercises(name_ja), workouts(started_at)",
            )
            .order("done_at")
            .range(a, b) as unknown as PromiseLike<{ data: SetRow[] | null; error: unknown }>,
      );
      download(
        `kensan-training-${stamp}.csv`,
        toCsv(rows, [
          { header: "ワークアウト開始", value: (r) => jst(r.workouts?.started_at ?? null) },
          { header: "種目", value: (r) => r.exercises?.name_ja },
          { header: "セット", value: (r) => r.set_no },
          { header: "種別", value: (r) => r.set_type },
          { header: "kg", value: (r) => r.weight_kg },
          { header: "回", value: (r) => r.reps },
          { header: "RIR", value: (r) => r.rir },
          { header: "PR", value: (r) => (r.is_pr ? 1 : 0) },
          { header: "確定時刻", value: (r) => jst(r.done_at) },
        ]),
      );
    });

  const exportMeals = () =>
    run("meals", async () => {
      const rows = await all<MealRow>(
        (a, b) =>
          supabase
            .from("meal_log_items")
            .select("grams, meal_logs(date, slot), foods(name, kcal, protein_g, fat_g, carb_g)")
            .order("created_at")
            .range(a, b) as unknown as PromiseLike<{ data: MealRow[] | null; error: unknown }>,
      );
      const per = (r: MealRow, k: "kcal" | "protein_g" | "fat_g" | "carb_g") =>
        r.foods ? Math.round(((r.foods[k] * r.grams) / 100) * 10) / 10 : null;
      download(
        `kensan-meals-${stamp}.csv`,
        toCsv(rows, [
          { header: "日付", value: (r) => r.meal_logs?.date },
          { header: "食事枠", value: (r) => r.meal_logs?.slot },
          { header: "食品", value: (r) => r.foods?.name },
          { header: "g", value: (r) => r.grams },
          { header: "kcal", value: (r) => per(r, "kcal") },
          { header: "P", value: (r) => per(r, "protein_g") },
          { header: "F", value: (r) => per(r, "fat_g") },
          { header: "C", value: (r) => per(r, "carb_g") },
        ]),
      );
    });

  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-3 gap-2">
        <Button variant="secondary" disabled={!!busy} onClick={exportTraining}>
          トレ
        </Button>
        <Button variant="secondary" disabled={!!busy} onClick={exportMeals}>
          食事
        </Button>
        <Button variant="secondary" disabled={!!busy} onClick={exportCheckins}>
          チェックイン
        </Button>
      </div>
      {busy && <p className="text-muted text-sm">書き出し中…</p>}
      {error && (
        <p role="alert" className="text-warn text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
