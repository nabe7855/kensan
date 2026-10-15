import { hasUnit } from "./food-groups";
import { macrosFor, type Food, type Macros } from "./nutrition";

export type Basis = "protein_g" | "carb_g" | "kcal";

export type Substitute = {
  food: Food;
  grams: number;
  macros: Macros;
  /** Candidate minus original. */
  delta: Macros;
  score: number;
};

/** What a swap should keep equal: protein for protein foods, carbs for carb foods, else energy. */
export function basisFor(m: Macros): Basis {
  if (m.protein_g >= 5) return "protein_g";
  if (m.carb_g >= 10) return "carb_g";
  return "kcal";
}

export const BASIS_LABEL: Record<Basis, string> = {
  protein_g: "たんぱく質",
  carb_g: "炭水化物",
  kcal: "エネルギー",
};

/** A swap needing more than this is not a realistic replacement. */
export const MAX_SWAP_GRAMS = 500;

function roundGrams(food: Food, grams: number): number {
  if (hasUnit(food)) {
    const units = Math.max(0.5, Math.round((grams / food.unit_grams) * 2) / 2);
    return Math.round(units * food.unit_grams * 10) / 10;
  }
  return Math.min(1000, Math.max(5, Math.round(grams / 5) * 5));
}

/**
 * Foods that can replace `item`: grams are chosen to match the basis nutrient, then ranked by
 * how close the other macros and energy end up (P weighs most, then C, then F).
 */
export function suggestSubstitutes(
  item: { food: Food; grams: number },
  candidates: Food[],
  limit = 5,
): Substitute[] {
  const original = macrosFor(item.food, item.grams);
  const basis = basisFor(original);
  const seen = new Set<string>([item.food.id]);
  const out: Substitute[] = [];

  for (const food of candidates) {
    if (seen.has(food.id)) continue;
    seen.add(food.id);
    const per100 = food[basis];
    if (per100 <= 0) continue;
    const needed = (original[basis] / per100) * 100;
    if (needed > MAX_SWAP_GRAMS) continue; // e.g. rice can't stand in for fish protein
    const grams = roundGrams(food, needed);
    const macros = macrosFor(food, grams);
    const delta: Macros = {
      kcal: macros.kcal - original.kcal,
      protein_g: macros.protein_g - original.protein_g,
      fat_g: macros.fat_g - original.fat_g,
      carb_g: macros.carb_g - original.carb_g,
    };
    const score =
      3 * Math.abs(delta.protein_g) +
      2 * Math.abs(delta.carb_g) +
      1 * Math.abs(delta.fat_g) +
      Math.abs(delta.kcal) / 20 +
      (food.food_group === item.food.food_group ? 0 : 5);
    out.push({ food, grams, macros, delta, score });
  }
  return out.sort((a, b) => a.score - b.score).slice(0, limit);
}

/** "+2" / "−3" / "±0" for a macro difference. */
export function signed(n: number): string {
  const r = Math.round(n);
  return r > 0 ? `+${r}` : r < 0 ? `−${-r}` : "±0";
}
