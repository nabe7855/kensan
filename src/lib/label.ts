/** 1 g of salt (食塩相当量) is 393.4 mg of sodium. */
export const SALT_TO_SODIUM_MG = 393.4;

/** What a Japanese nutrition label shows, per 100 g or per serving ("1袋（30g）当たり"). */
export type LabelInput = {
  basis: "100g" | "serving";
  /** "袋", "個", "本" … (optional with a 100 g label). */
  servingName: string;
  servingGrams: number | null;
  kcal: number;
  protein_g: number;
  fat_g: number;
  carb_g: number;
  fiber_g: number | null;
  salt_g: number | null;
};

export type FoodValues = {
  kcal: number;
  protein_g: number;
  fat_g: number;
  carb_g: number;
  fiber_g: number | null;
  sodium_mg: number | null;
  unit_name: string | null;
  unit_grams: number | null;
};

const r2 = (n: number) => Math.round(n * 100) / 100;

/**
 * The label's numbers as the app stores them: per 100 g, plus the serving as a countable unit
 * so amounts can be entered as "1袋". Null when a per-serving label has no serving weight.
 */
export function labelToFood(input: LabelInput): FoodValues | null {
  const grams = input.servingGrams && input.servingGrams > 0 ? input.servingGrams : null;
  if (input.basis === "serving" && !grams) return null;
  const k = input.basis === "serving" ? 100 / grams! : 1;
  const name = input.servingName.trim();
  const hasUnit = !!grams && (input.basis === "serving" || !!name);
  return {
    kcal: r2(input.kcal * k),
    protein_g: r2(input.protein_g * k),
    fat_g: r2(input.fat_g * k),
    carb_g: r2(input.carb_g * k),
    fiber_g: input.fiber_g === null ? null : r2(input.fiber_g * k),
    sodium_mg: input.salt_g === null ? null : r2(input.salt_g * k * SALT_TO_SODIUM_MG),
    unit_name: hasUnit ? name || "食" : null,
    unit_grams: hasUnit ? grams : null,
  };
}

/**
 * kcal from P/F/C (4/9/4) against the label. Labels round and carbs may include fiber,
 * so only a gap of more than 20 % (and 20 kcal) is worth a second look.
 */
export function kcalCheck(
  kcal: number,
  protein: number,
  fat: number,
  carb: number,
): { estimated: number; off: boolean } {
  const estimated = Math.round(protein * 4 + fat * 9 + carb * 4);
  const gap = Math.abs(kcal - estimated);
  return { estimated, off: gap > Math.max(20, estimated * 0.2) };
}
