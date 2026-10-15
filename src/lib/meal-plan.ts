import { macrosFor, sumMacros, ZERO, type Food, type Macros } from "./nutrition";

export type PlanItem = { id: string; grams: number; food: Food };

export type PlanMeal = {
  slot: string;
  eatenAt: string | null;
  title: string | null;
  templateId: string | null;
  items: PlanItem[];
};

export const mealMacros = (meal: Pick<PlanMeal, "items">): Macros =>
  sumMacros(meal.items.map((i) => macrosFor(i.food, i.grams)));

/** Eaten (confirmed) and planned (not yet eaten) totals for the day. */
export function dayTotals(meals: PlanMeal[]): { eaten: Macros; planned: Macros } {
  const eaten = meals.filter((m) => m.eatenAt);
  const planned = meals.filter((m) => !m.eatenAt);
  return {
    eaten: eaten.length ? sumMacros(eaten.map(mealMacros)) : ZERO,
    planned: planned.length ? sumMacros(planned.map(mealMacros)) : ZERO,
  };
}

/** Share of the meal's energy that comes from protein (0–1). */
export function proteinShare(m: Macros): number {
  return m.kcal > 0 ? Math.min(1, (m.protein_g * 4) / m.kcal) : 0;
}

/** Per-meal protein guide for a cut: about 20 g or more per main meal. */
export const MEAL_PROTEIN_MIN = 20;

/** Gentle note for a substantial meal that is light on protein (shown in amber, never red). */
export function lowProteinNote(m: Macros): string | null {
  if (m.kcal < 250 || m.protein_g >= MEAL_PROTEIN_MIN) return null;
  return `たんぱく質 ${Math.round(m.protein_g)}g。1食 ${MEAL_PROTEIN_MIN}g 前後を目安にすると筋量を保ちやすい`;
}

export type TemplateLike = { id: string; name: string; group_name: string | null };

/** Templates in the same variant group as `templateId` (including itself), for the chips. */
export function variantsOf<T extends TemplateLike>(templates: T[], templateId: string | null): T[] {
  const current = templates.find((t) => t.id === templateId);
  if (!current?.group_name) return current ? [current] : [];
  return templates.filter((t) => t.group_name === current.group_name);
}

/** Short label for a variant chip: the part of the name that differs within the group. */
export function variantLabel(name: string, group: string | null): string {
  if (!group) return name;
  const trimmed = name.replace(group, "").replace(/^[\s/／・:：-]+|[\s/／・:：-]+$/g, "");
  return trimmed || name;
}
