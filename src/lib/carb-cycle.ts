import type { Macros } from "./nutrition";
import { addDaysISO } from "./prep";

/** Gap between training-day and off-day carbs, as a share of the daily average. */
export const CARB_SWING = 0.4;
/** Off days never go below this many grams of carbs. */
export const MIN_CARB_G = 50;
export const DEFAULT_TRAIN_DAYS = 4;

const floor5 = (n: number) => Math.floor(n / 5) * 5;

/** Typical training days per week from the last 4 weeks of session dates (1–6). */
export function trainingDaysPerWeek(dates: string[], today: string): number {
  const from = addDaysISO(today, -27);
  const days = new Set(dates.filter((d) => d >= from && d <= today)).size;
  if (days === 0) return DEFAULT_TRAIN_DAYS;
  return Math.min(6, Math.max(1, Math.round(days / 4)));
}

/**
 * Moves carbs from off days to training days while keeping the weekly total the same.
 * Protein and fat stay put. Null when carbs are too low to shift.
 */
export function carbCycle(
  avg: Macros,
  trainDays: number,
  swing = CARB_SWING,
): { train: Macros; off: Macros } | null {
  const n = Math.min(6, Math.max(1, Math.round(trainDays)));
  const c = avg.carb_g;
  // Largest gap that keeps off days at the floor.
  const maxGap = ((c - MIN_CARB_G) * 7) / n;
  const gap = Math.min(c * swing, maxGap);
  if (gap < 10) return null;

  const trainCarb = floor5(c + (gap * (7 - n)) / 7);
  const offCarb = Math.round((7 * c - n * trainCarb) / (7 - n));
  if (offCarb < MIN_CARB_G || trainCarb <= offCarb) return null;
  const day = (carb_g: number): Macros => ({
    kcal: Math.round(avg.kcal + (carb_g - c) * 4),
    protein_g: avg.protein_g,
    fat_g: avg.fat_g,
    carb_g,
  });
  return { train: day(trainCarb), off: day(offCarb) };
}
