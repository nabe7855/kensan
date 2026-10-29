export type Macros = { kcal: number; protein_g: number; fat_g: number; carb_g: number };

export type Food = Macros & {
  id: string;
  name: string;
  user_id: string | null;
  is_cooked: boolean;
  source: string;
  food_group: number | null;
  unit_name: string | null;
  unit_grams: number | null;
};

export const ZERO: Macros = { kcal: 0, protein_g: 0, fat_g: 0, carb_g: 0 };

export const DEFAULT_SLOTS = ["朝", "昼", "トレ前", "夜"];

/**
 * kcal per 100 g counted from P/F/C at 4 / 9 / 4, the same way targets are built, so eaten
 * totals and targets add up. Food-table energy uses food-specific factors (and counts fiber
 * inside carbs differently), so it never quite matches. The one exception is energy the
 * macros don't carry — alcohol (7 kcal/g): when the listed value is far above the P/F/C sum,
 * the listed value is kept.
 */
export function foodKcal(food: Macros): number {
  const pfc = food.protein_g * 4 + food.fat_g * 9 + food.carb_g * 4;
  return food.kcal - pfc > Math.max(10, pfc * 0.3) ? food.kcal : pfc;
}

/** Macros for `grams` of a food whose values are per 100 g. */
export function macrosFor(food: Macros, grams: number): Macros {
  const f = grams / 100;
  return {
    kcal: foodKcal(food) * f,
    protein_g: food.protein_g * f,
    fat_g: food.fat_g * f,
    carb_g: food.carb_g * f,
  };
}

export function sumMacros(list: Macros[]): Macros {
  return list.reduce(
    (a, m) => ({
      kcal: a.kcal + m.kcal,
      protein_g: a.protein_g + m.protein_g,
      fat_g: a.fat_g + m.fat_g,
      carb_g: a.carb_g + m.carb_g,
    }),
    ZERO,
  );
}

export function subtractMacros(a: Macros, b: Macros): Macros {
  return {
    kcal: a.kcal - b.kcal,
    protein_g: a.protein_g - b.protein_g,
    fat_g: a.fat_g - b.fat_g,
    carb_g: a.carb_g - b.carb_g,
  };
}

export type DayType = "train" | "off";

/** Train/off day: a day with a recorded workout is a training day, unless the user overrode it. */
export function dayTypeFor(trained: boolean, override: DayType | null): DayType {
  if (override) return override;
  return trained ? "train" : "off";
}

export type Target = Macros & { effective_from: string; day_type: DayType };

/** Latest target for the day type that is effective on `date`. */
export function targetFor(targets: Target[], date: string, dayType: DayType): Target | null {
  return (
    targets
      .filter((t) => t.day_type === dayType && t.effective_from <= date)
      .sort((a, b) => b.effective_from.localeCompare(a.effective_from))[0] ?? null
  );
}

/** Tolerance band around a target (requirements §5: goals are ranges). */
export const TOLERANCE: Macros = { kcal: 100, protein_g: 10, fat_g: 5, carb_g: 15 };

export function isOver(key: keyof Macros, eaten: number, target: number): boolean {
  return eaten > target + TOLERANCE[key];
}

/** Slot that fits the time of day (hour in local time). */
export function slotForHour(hour: number, slots: string[] = DEFAULT_SLOTS): string {
  if (slots.length === 0) return "朝";
  const preset: [number, string][] = [
    [10, "朝"],
    [15, "昼"],
    [18, "トレ前"],
    [24, "夜"],
  ];
  const name = preset.find(([h]) => hour < h)?.[1];
  return name && slots.includes(name) ? name : slots[0]!;
}

/**
 * Deterministic UUID for (user, date, slot) so every device creates the same meal_logs row
 * and queued item inserts always reference an id that will exist.
 */
export function mealLogId(userId: string, date: string, slot: string): string {
  const input = `${userId}|${date}|${slot}`;
  let h1 = 0x811c9dc5,
    h2 = 0x01000193,
    h3 = 0xdeadbeef,
    h4 = 0x41c6ce57;
  for (let i = 0; i < input.length; i++) {
    const c = input.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193);
    h2 = Math.imul(h2 ^ c, 0x5bd1e995);
    h3 = Math.imul(h3 ^ c, 0x85ebca6b);
    h4 = Math.imul(h4 ^ c, 0xc2b2ae35);
  }
  const hex = [h1, h2, h3, h4].map((h) => (h >>> 0).toString(16).padStart(8, "0")).join("");
  const variant = ((parseInt(hex[16]!, 16) & 0x3) | 0x8).toString(16);
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-5${hex.slice(13, 16)}-${variant}${hex.slice(17, 20)}-${hex.slice(20, 32)}`;
}

/** Carbs that fill the energy left after protein (4 kcal/g) and fat (9 kcal/g). Never negative. */
export function carbsFromTarget(kcal: number, proteinG: number, fatG: number): number {
  return Math.max(0, Math.round(((kcal - proteinG * 4 - fatG * 9) / 4) * 10) / 10);
}

/** Share of energy from P, F and C (0–1 each) for a target. */
export function energySplit(m: Macros): { p: number; f: number; c: number } {
  const total = m.protein_g * 4 + m.fat_g * 9 + m.carb_g * 4;
  if (total <= 0) return { p: 0, f: 0, c: 0 };
  return {
    p: (m.protein_g * 4) / total,
    f: (m.fat_g * 9) / total,
    c: (m.carb_g * 4) / total,
  };
}
