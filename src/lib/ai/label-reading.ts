import { z } from "zod";

/** What the model reads off a Japanese nutrition label, numbers exactly as printed. */
export const LabelReadingSchema = z.object({
  found: z.boolean().describe("false when no nutrition facts table is visible"),
  name: z.string().nullable().describe("product name if printed, else null"),
  basis: z.enum(["100g", "serving"]).describe("100g when values are per 100 g or 100 ml"),
  serving_name: z.string().nullable().describe("counter word of the serving: 袋, 個, 本, 枚, 食…"),
  serving_grams: z.number().nullable().describe("serving weight in g or ml, if printed"),
  kcal: z.number().nullable(),
  protein_g: z.number().nullable(),
  fat_g: z.number().nullable(),
  carb_g: z.number().nullable().describe("炭水化物 only; null when the label shows only 糖質"),
  sugar_g: z.number().nullable().describe("糖質, if printed"),
  fiber_g: z.number().nullable().describe("食物繊維, if printed"),
  salt_g: z.number().nullable().describe("食塩相当量 in g, if printed"),
  sodium_mg: z.number().nullable().describe("ナトリウム in mg, if printed"),
});

export type LabelReading = z.infer<typeof LabelReadingSchema>;

export const SERVING_UNITS = ["袋", "個", "本", "枚", "パック", "食"] as const;

/** Values for the new-food form, as strings; empty where the label didn't show it. */
export type LabelFormValues = {
  name: string;
  basis: "100g" | "serving";
  servingName: string | null;
  servingGrams: string;
  kcal: string;
  protein_g: string;
  fat_g: string;
  carb_g: string;
  fiber_g: string;
  salt_g: string;
};

const round = (n: number, digits = 1) => {
  const f = 10 ** digits;
  return Math.round(n * f) / f;
};
const str = (n: number | null) => (n === null || !Number.isFinite(n) || n < 0 ? "" : String(n));

/**
 * Turns what was read into form values. The arithmetic lives here, not in the model:
 * 炭水化物 = 糖質 + 食物繊維 when only those are printed, and 食塩相当量 = ナトリウム × 2.54.
 */
export function readingToForm(r: LabelReading): LabelFormValues {
  const carb = r.carb_g ?? (r.sugar_g !== null ? round(r.sugar_g + (r.fiber_g ?? 0)) : null);
  const salt = r.salt_g ?? (r.sodium_mg !== null ? round((r.sodium_mg * 2.54) / 1000, 2) : null);
  const unit = SERVING_UNITS.find((u) => r.serving_name?.includes(u)) ?? null;
  return {
    name: r.name?.trim() ?? "",
    basis: r.basis,
    servingName: unit,
    servingGrams: str(r.serving_grams),
    kcal: str(r.kcal),
    protein_g: str(r.protein_g),
    fat_g: str(r.fat_g),
    carb_g: str(carb),
    fiber_g: str(r.fiber_g),
    salt_g: str(salt),
  };
}
