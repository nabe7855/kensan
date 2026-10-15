/** MEXT 8th edition food groups (食品群). 18 is used for prepared foods and our dish library. */
export const FOOD_GROUPS = [
  { id: 1, label: "穀類" },
  { id: 2, label: "いも" },
  { id: 3, label: "砂糖・甘味" },
  { id: 4, label: "豆類" },
  { id: 5, label: "種実" },
  { id: 6, label: "野菜" },
  { id: 7, label: "果実" },
  { id: 8, label: "きのこ" },
  { id: 9, label: "藻類" },
  { id: 10, label: "魚介" },
  { id: 11, label: "肉類" },
  { id: 12, label: "卵類" },
  { id: 13, label: "乳類" },
  { id: 14, label: "油脂" },
  { id: 15, label: "菓子" },
  { id: 16, label: "飲料" },
  { id: 17, label: "調味料" },
  { id: 18, label: "調理済み" },
] as const;

const LABELS = new Map<number, string>(FOOD_GROUPS.map((g) => [g.id, g.label]));

export function foodGroupLabel(id: number | null | undefined): string | null {
  return id == null ? null : (LABELS.get(id) ?? null);
}

export type Unit = { unit_name: string | null; unit_grams: number | null };

/** Whether amounts for this food are entered in its countable unit (個, 枚, 人前 ...). */
export function hasUnit(food: Unit): food is { unit_name: string; unit_grams: number } {
  return !!food.unit_name && !!food.unit_grams && food.unit_grams > 0;
}

/** Grams → amount shown to the user (units rounded to 0.5, otherwise grams). */
export function displayAmount(food: Unit, grams: number): { value: number; unit: string } {
  if (hasUnit(food)) {
    return { value: Math.round((grams / food.unit_grams) * 2) / 2, unit: food.unit_name };
  }
  return { value: Math.round(grams), unit: "g" };
}

/** Amount entered in the food's unit (or grams) → grams to store. */
export function toGrams(food: Unit, value: number, inUnits: boolean): number {
  return inUnits && hasUnit(food) ? Math.round(value * food.unit_grams * 10) / 10 : value;
}

/** Step for − / + buttons: half a unit, or 10 g (5 g for small amounts). */
export function stepGrams(food: Unit, grams: number): number {
  if (hasUnit(food)) return food.unit_grams / (food.unit_name === "人前" ? 2 : 1);
  return grams < 50 ? 5 : 10;
}
