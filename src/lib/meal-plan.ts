import { macrosFor, sumMacros, ZERO, type Food, type Macros } from "./nutrition";

export type PlanItem = { id: string; grams: number; food: Food };

export type PlanMeal = {
  slot: string;
  createdAt: string;
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

const NUMBERED = /^(\d+)食目$/;

/** Name for the next meal of the day: one more than the highest "N食目", never a duplicate. */
export function nextMealName(existing: string[]): string {
  const highest = Math.max(0, ...existing.map((s) => Number(NUMBERED.exec(s)?.[1] ?? 0)));
  let n = Math.max(highest, existing.length) + 1;
  while (existing.includes(`${n}食目`)) n++;
  return `${n}食目`;
}

/** Whether a slot name is a plain ordinal ("2食目") rather than a custom name ("朝"). */
export function isOrdinalSlot(slot: string): boolean {
  return NUMBERED.test(slot);
}

/** The day's meal names in order: logged meals by creation time, then unsaved new ones; at least "1食目". */
export function mealOrder(
  logged: { slot: string; createdAt: string }[],
  pending: string[],
): string[] {
  const names = [...logged]
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
    .map((m) => m.slot);
  for (const p of pending) if (!names.includes(p)) names.push(p);
  return names.length > 0 ? names : ["1食目"];
}
