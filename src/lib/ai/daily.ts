import { z } from "zod";
import { macrosFor, type Macros } from "@/lib/nutrition";
import { addDaysISO } from "@/lib/prep";

/*
 * Day-by-day records for the coach, so it can suggest why a single morning's weight moved.
 * Still numbers and fixed keys only; judgements stay on the weekly averages.
 */

/** Days of daily rows the coach sees: this week and the one before. */
export const DAILY_DAYS = 14;
const MAX_MEALS = 8;
const MAX_FOODS = 12;
const NAME_CHARS = 30;

export const SALT_LEVELS = [
  { value: "low", label: "少" },
  { value: "normal", label: "普通" },
  { value: "high", label: "多" },
] as const;
export type SaltLevel = (typeof SALT_LEVELS)[number]["value"];

const Time = z.string().regex(/^\d{2}:\d{2}$/);
/** Meal time on the meal's own date; past midnight reads 24:00 and later. */
const MealTime = z.string().regex(/^\d{2}:\d{2}$/);
const score = z.number().int().min(1).max(5).nullable();
const grams = z.number().finite().min(0);

export const DayFactSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  weight_kg: z.number().finite().nullable(),
  weighed_at: Time.nullable(),
  meals: z
    .array(
      z.object({
        at: MealTime,
        kcal: grams,
        protein_g: grams,
        fat_g: grams,
        carb_g: grams,
        foods: z.array(z.object({ name: z.string().max(NAME_CHARS), g: grams })).max(MAX_FOODS),
      }),
    )
    .max(MAX_MEALS),
  /** Salt from foods that carry sodium data, in g. Null when nothing logged has it. */
  salt_g: grams.nullable(),
  /** Share of logged kcal whose food has sodium data, 0..1. */
  salt_coverage: z.number().min(0).max(1).nullable(),
  /** The morning entry: how salty the day before felt. */
  prev_day_salt_feel: z.enum(["low", "normal", "high"]).nullable(),
  sleep: score,
  energy: score,
  bowel: z.enum(["good", "normal", "bad"]).nullable(),
});
export type DayFact = z.infer<typeof DayFactSchema>;
export const DailyFactsSchema = z.array(DayFactSchema).max(DAILY_DAYS);

export type DayCheckin = {
  date: string;
  weight_kg: number | null;
  weighed_at: string | null;
  salt_level: string | null;
  sleep: number | null;
  energy: number | null;
  bowel: string | null;
};
export type MealFood = Macros & { name: string; sodium_mg: number | null };
export type LoggedMeal = {
  date: string;
  eaten_at: string;
  items: { grams: number; food: MealFood }[];
};

/** "HH:MM" in JST. */
export function jstTime(iso: string): string {
  return new Date(Date.parse(iso) + 9 * 3600_000).toISOString().slice(11, 16);
}

/**
 * "HH:MM" from the meal's date at 00:00 JST, so a late snack filed under that day reads
 * e.g. 25:30 instead of looking like the next morning.
 */
export function mealTime(date: string, iso: string): string {
  const min = Math.floor((Date.parse(iso) - Date.parse(`${date}T00:00:00+09:00`)) / 60_000);
  if (min < 0 || min >= 48 * 60) return jstTime(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(Math.floor(min / 60))}:${pad(min % 60)}`;
}

/** Sodium (mg) to salt equivalent (g), as on Japanese labels. */
export const saltFromSodium = (mg: number) => (mg * 2.54) / 1000;

const r1 = (n: number) => Math.round(n * 10) / 10;
const oneOf = <T extends string>(v: string | null, keys: readonly T[]): T | null =>
  v !== null && (keys as readonly string[]).includes(v) ? (v as T) : null;

export function buildDailyFacts(input: {
  today: string;
  checkins: DayCheckin[];
  meals: LoggedMeal[];
  days?: number;
}): DayFact[] {
  const days = input.days ?? DAILY_DAYS;
  const out: DayFact[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const date = addDaysISO(input.today, -i);
    const c = input.checkins.find((x) => x.date === date);
    const meals = input.meals
      .filter((m) => m.date === date)
      .sort((a, b) => a.eaten_at.localeCompare(b.eaten_at))
      .slice(0, MAX_MEALS);

    let kcal = 0;
    let knownKcal = 0;
    let salt = 0;
    let anySalt = false;
    const mealFacts = meals.map((m) => {
      const t = { kcal: 0, protein_g: 0, fat_g: 0, carb_g: 0 };
      for (const it of m.items) {
        const x = macrosFor(it.food, it.grams);
        t.kcal += x.kcal;
        t.protein_g += x.protein_g;
        t.fat_g += x.fat_g;
        t.carb_g += x.carb_g;
        if (it.food.sodium_mg != null) {
          anySalt = true;
          knownKcal += x.kcal;
          salt += saltFromSodium((it.food.sodium_mg * it.grams) / 100);
        }
      }
      kcal += t.kcal;
      return {
        at: mealTime(date, m.eaten_at),
        kcal: Math.round(t.kcal),
        protein_g: r1(t.protein_g),
        fat_g: r1(t.fat_g),
        carb_g: r1(t.carb_g),
        foods: m.items
          .slice(0, MAX_FOODS)
          .map((it) => ({ name: it.food.name.slice(0, NAME_CHARS), g: Math.round(it.grams) })),
      };
    });

    if (!c && mealFacts.length === 0) continue;
    out.push({
      date,
      weight_kg: c?.weight_kg ?? null,
      weighed_at: c?.weight_kg != null && c.weighed_at ? jstTime(c.weighed_at) : null,
      meals: mealFacts,
      salt_g: anySalt ? r1(salt) : null,
      salt_coverage: anySalt && kcal > 0 ? Math.round((knownKcal / kcal) * 100) / 100 : null,
      prev_day_salt_feel: oneOf(c?.salt_level ?? null, ["low", "normal", "high"] as const),
      sleep: c?.sleep ?? null,
      energy: c?.energy ?? null,
      bowel: oneOf(c?.bowel ?? null, ["good", "normal", "bad"] as const),
    });
  }
  return out;
}
