import { z } from "zod";
import type { DailyCondition } from "@/lib/condition";
import { targetFor, type Macros, type Target } from "@/lib/nutrition";
import { addDaysISO } from "@/lib/prep";
import { PAIN_AREAS } from "@/lib/safety";

/*
 * Weekly check-in. The app works out every number here; the AI only reads these facts and
 * writes the review. Nothing in the facts is free text, so the request can't be used as a
 * general chat.
 */

const num = z.number().finite();
const avg = num.nullable();
const MacrosSchema = z.object({ kcal: num, protein_g: num, fat_g: num, carb_g: num });
const PainKey = z.enum(PAIN_AREAS.map((a) => a.key) as [string, ...string[]]);

export const CheckinFactsSchema = z.object({
  week_start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  phase: z.enum(["bulk", "maintain", "cut"]),
  prep: z.object({ days_to_contest: z.number().int(), target_loss_pct_per_week: num }).nullable(),
  weight: z.object({
    avg,
    prev_avg: avg,
    days: z.number().int().min(0).max(7),
    prev_days: z.number().int().min(0).max(7),
    /** Week-average change against the week before, % of body weight. Negative is a loss. */
    change_pct: avg,
  }),
  nutrition: z.object({
    days_logged: z.number().int().min(0).max(7),
    avg: MacrosSchema.nullable(),
    target_avg: MacrosSchema.nullable(),
  }),
  training: z.object({
    sessions: z.number().int().min(0).max(30),
    hard_sets: z.number().int().min(0).max(1000),
    prev_hard_sets: z.number().int().min(0).max(1000),
  }),
  condition: z.object({
    days: z.number().int().min(0).max(7),
    hunger: avg,
    sleep: avg,
    mood: avg,
    energy: avg,
    prev_sleep: avg,
    prev_mood: avg,
    prev_energy: avg,
    rhr: avg,
    prev_rhr: avg,
  }),
  pain: z.array(z.object({ area: PainKey, days: z.number().int().min(1).max(7) })).max(9),
  safety: z.object({
    level: z.enum(["none", "watch", "caution"]),
    signals: z.array(z.string().regex(/^[a-z_:]{1,30}$/)).max(12),
  }),
});
export type CheckinFacts = z.infer<typeof CheckinFactsSchema>;

export const CheckinResultSchema = z.object({
  summary: z.string().describe("先週の全体像を 2〜3 文で。数字は facts にあるものだけを使う"),
  points: z
    .array(
      z.object({
        area: z.enum(["体重", "食事", "トレーニング", "コンディション", "痛み"]),
        text: z.string().describe("1〜2 文。facts の数字を根拠にした事実と解釈"),
      }),
    )
    .describe("気づいた点。データがない分野は書かない。最大 4 つ"),
  actions: z
    .array(
      z.object({
        text: z.string().describe("来週やること。具体的に 1 文"),
        reason: z.string().describe("そう提案する根拠を facts から 1 文"),
      }),
    )
    .describe("来週の提案。最大 3 つ"),
  adjustment_note: z
    .string()
    .nullable()
    .describe("kcal_delta が 0 以外のときだけ、その調整の理由を 1〜2 文で。0 のときは null"),
});
export type CheckinResult = z.infer<typeof CheckinResultSchema>;

const mean = (xs: number[]) =>
  xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 100) / 100 : null;
const inWeek = (date: string, start: string) => date >= start && date <= addDaysISO(start, 6);
const round1 = (n: number) => Math.round(n * 10) / 10;

export type CheckinInput = {
  weekStart: string;
  phase: "bulk" | "maintain" | "cut";
  prep: { contestDate: string; weeklyRatePct: number } | null;
  /** At least the week and the one before it. */
  checkins: (DailyCondition & {
    weight_kg: number | null;
    rhr: number | null;
    pain_areas?: string[] | null;
  })[];
  /** Eaten macros by date. */
  macros: Record<string, Macros>;
  targets: Target[];
  workouts: { date: string; hardSets: number }[];
  safety: { level: "none" | "watch" | "caution"; signals: { key: string }[] };
};

/** Turns a week of records (and the week before) into the facts the AI reads. */
export function buildCheckinFacts(input: CheckinInput): CheckinFacts {
  const { weekStart } = input;
  const prevStart = addDaysISO(weekStart, -7);
  const week = input.checkins.filter((c) => inWeek(c.date, weekStart));
  const prev = input.checkins.filter((c) => inWeek(c.date, prevStart));
  const values = (
    rows: typeof week,
    key: "weight_kg" | "rhr" | "hunger" | "sleep" | "mood" | "energy",
  ) => rows.map((r) => r[key]).filter((v): v is number => v != null);

  const w = values(week, "weight_kg");
  const pw = values(prev, "weight_kg");
  const wAvg = mean(w);
  const pwAvg = mean(pw);

  const days = Array.from({ length: 7 }, (_, i) => addDaysISO(weekStart, i));
  const trained = new Set(input.workouts.map((x) => x.date));
  const logged = days.filter((d) => input.macros[d] && input.macros[d]!.kcal > 0);
  const avgMacros = (list: Macros[]): Macros | null =>
    list.length
      ? {
          kcal: Math.round(list.reduce((s, m) => s + m.kcal, 0) / list.length),
          protein_g: Math.round(list.reduce((s, m) => s + m.protein_g, 0) / list.length),
          fat_g: Math.round(list.reduce((s, m) => s + m.fat_g, 0) / list.length),
          carb_g: Math.round(list.reduce((s, m) => s + m.carb_g, 0) / list.length),
        }
      : null;
  const targets = days
    .map((d) => targetFor(input.targets, d, trained.has(d) ? "train" : "off"))
    .filter((t): t is Target => t != null);

  const sets = (start: string) =>
    input.workouts.filter((x) => inWeek(x.date, start)).reduce((s, x) => s + x.hardSets, 0);

  const pain = new Map<string, number>();
  for (const c of week) for (const a of c.pain_areas ?? []) pain.set(a, (pain.get(a) ?? 0) + 1);

  return {
    week_start: weekStart,
    phase: input.phase,
    prep: input.prep
      ? {
          days_to_contest: Math.round(
            (Date.parse(input.prep.contestDate) - Date.parse(addDaysISO(weekStart, 6))) /
              86_400_000,
          ),
          target_loss_pct_per_week: input.prep.weeklyRatePct,
        }
      : null,
    weight: {
      avg: wAvg,
      prev_avg: pwAvg,
      days: w.length,
      prev_days: pw.length,
      change_pct:
        wAvg != null && pwAvg != null ? Math.round(((wAvg - pwAvg) / pwAvg) * 10000) / 100 : null,
    },
    nutrition: {
      days_logged: logged.length,
      avg: avgMacros(logged.map((d) => input.macros[d]!)),
      target_avg: avgMacros(targets),
    },
    training: {
      sessions: input.workouts.filter((x) => inWeek(x.date, weekStart)).length,
      hard_sets: sets(weekStart),
      prev_hard_sets: sets(prevStart),
    },
    condition: {
      days: week.filter((c) => c.sleep != null || c.mood != null || c.energy != null).length,
      hunger: mean(values(week, "hunger")),
      sleep: mean(values(week, "sleep")),
      mood: mean(values(week, "mood")),
      energy: mean(values(week, "energy")),
      prev_sleep: mean(values(prev, "sleep")),
      prev_mood: mean(values(prev, "mood")),
      prev_energy: mean(values(prev, "energy")),
      rhr: mean(values(week, "rhr")),
      prev_rhr: mean(values(prev, "rhr")),
    },
    pain: [...pain]
      .filter(([a]) => PAIN_AREAS.some((p) => p.key === a))
      .map(([area, d]) => ({ area, days: Math.min(d, 7) })),
    safety: {
      level: input.safety.level,
      signals: input.safety.signals.map((s) => s.key).filter((k) => /^[a-z_:]{1,30}$/.test(k)),
    },
  };
}

/**
 * Calorie change to suggest, decided by rules rather than the AI. Only during a cut with a
 * prep, and only with enough weigh-ins and food logs both weeks to trust the week averages.
 * Never suggests eating less while the safety net is raised.
 */
export function kcalDelta(f: CheckinFacts): number {
  if (f.phase !== "cut" || !f.prep || f.weight.change_pct == null) return 0;
  if (f.weight.days < 4 || f.weight.prev_days < 4 || f.nutrition.days_logged < 4) return 0;
  const loss = -f.weight.change_pct;
  const target = f.prep.target_loss_pct_per_week;
  if (loss > target + 0.4) return 100;
  if (loss < target - 0.25 && f.safety.level !== "caution") return -100;
  return 0;
}

/** Latest train/off targets moved by `delta` kcal, all of it in carbs. Null if carbs would get too low. */
export function adjustedTargets(
  targets: Target[],
  today: string,
  delta: number,
): Omit<Target, "effective_from">[] | null {
  const rows = (["train", "off"] as const)
    .map((dayType) => targetFor(targets, today, dayType))
    .filter((t): t is Target => t != null);
  if (rows.length === 0) return null;
  const carbs = delta / 4;
  const next = rows.map((t) => ({
    day_type: t.day_type,
    kcal: t.kcal + delta,
    protein_g: t.protein_g,
    fat_g: t.fat_g,
    carb_g: round1(t.carb_g + carbs),
  }));
  return next.every((t) => t.carb_g >= 50) ? next : null;
}

/** Monday of last week, the week a check-in reviews. */
export function lastWeekStart(monday: string): string {
  return addDaysISO(monday, -7);
}
