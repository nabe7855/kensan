import { macrosFor, sumMacros, type Macros } from "./nutrition";

export type FillFood = Macros & { id: string; name: string };

export type FillItem<F extends FillFood = FillFood> = { food: F; grams: number };

export type FillSuggestion<F extends FillFood = FillFood> = {
  items: FillItem<F>[];
  provides: Macros;
  /** Remaining after eating the suggestion. */
  after: Macros;
  error: number;
};

const WEIGHTS = { protein_g: 3, carb_g: 2, fat_g: 1 } as const;
const OVERSHOOT = 1.5;

/** Weighted distance between what is left and what a combination provides (P first, then C, F). */
export function fillError(remaining: Macros, provides: Macros): number {
  let e = 0;
  for (const key of ["protein_g", "carb_g", "fat_g"] as const) {
    const diff = remaining[key] - provides[key];
    e += WEIGHTS[key] * (diff < 0 ? -diff * OVERSHOOT : diff);
  }
  return e;
}

/**
 * Requirements §9: for the remaining PFC, search 1–2 food combinations from the user's
 * top foods in 10 g steps and return the 3 with the smallest error.
 */
export function suggestFill<F extends FillFood>(
  remaining: Macros,
  foods: F[],
  { step = 10, maxGrams = 500, limit = 3 } = {},
): FillSuggestion<F>[] {
  if (remaining.protein_g <= 0 && remaining.carb_g <= 0 && remaining.fat_g <= 0) return [];
  const candidates = foods.slice(0, 20);
  const steps = Math.floor(maxGrams / step);
  const errorOf = (p: number, f: number, c: number) => {
    let e = 0;
    const dp = remaining.protein_g - p;
    const dc = remaining.carb_g - c;
    const df = remaining.fat_g - f;
    e += WEIGHTS.protein_g * (dp < 0 ? -dp * OVERSHOOT : dp);
    e += WEIGHTS.carb_g * (dc < 0 ? -dc * OVERSHOOT : dc);
    e += WEIGHTS.fat_g * (df < 0 ? -df * OVERSHOOT : df);
    return e;
  };

  // Best grams for every single food and every pair, using plain numbers in the hot loop.
  const combos: { a: number; ga: number; b: number; gb: number; error: number }[] = [];
  for (let i = 0; i < candidates.length; i++) {
    const A = candidates[i]!;
    let single = { a: i, ga: 0, b: -1, gb: 0, error: Infinity };
    const pairBest = candidates.map(() => ({ ga: 0, gb: 0, error: Infinity }));
    for (let x = 1; x <= steps; x++) {
      const fa = (x * step) / 100;
      const pa = A.protein_g * fa;
      const fta = A.fat_g * fa;
      const ca = A.carb_g * fa;
      const e1 = errorOf(pa, fta, ca);
      if (e1 < single.error) single = { a: i, ga: x * step, b: -1, gb: 0, error: e1 };
      for (let j = i + 1; j < candidates.length; j++) {
        const B = candidates[j]!;
        const pb = pairBest[j]!;
        for (let y = 1; y <= steps; y++) {
          const fb = (y * step) / 100;
          const e2 = errorOf(pa + B.protein_g * fb, fta + B.fat_g * fb, ca + B.carb_g * fb);
          if (e2 < pb.error) {
            pb.error = e2;
            pb.ga = x * step;
            pb.gb = y * step;
          }
        }
      }
    }
    combos.push(single);
    for (let j = i + 1; j < candidates.length; j++) {
      const pb = pairBest[j]!;
      combos.push({ a: i, ga: pb.ga, b: j, gb: pb.gb, error: pb.error });
    }
  }

  return combos
    .sort((x, y) => x.error - y.error)
    .slice(0, limit)
    .map((c) => {
      const items: FillItem<F>[] = [{ food: candidates[c.a]!, grams: c.ga }];
      if (c.b >= 0) items.push({ food: candidates[c.b]!, grams: c.gb });
      const provides = sumMacros(items.map((it) => macrosFor(it.food, it.grams)));
      return {
        items,
        provides,
        error: c.error,
        after: {
          kcal: remaining.kcal - provides.kcal,
          protein_g: remaining.protein_g - provides.protein_g,
          fat_g: remaining.fat_g - provides.fat_g,
          carb_g: remaining.carb_g - provides.carb_g,
        },
      };
    });
}

/** One-line reason shown with the suggestion (requirements: every suggestion has a reason). */
export function fillReason(remaining: Macros, s: FillSuggestion): string {
  const r = (n: number) => Math.round(n);
  return `残り P${r(remaining.protein_g)}・F${r(remaining.fat_g)}・C${r(remaining.carb_g)}g に対し、P優先で最も近い組合せ。食べた後の残り P${r(s.after.protein_g)}・F${r(s.after.fat_g)}・C${r(s.after.carb_g)}g`;
}
