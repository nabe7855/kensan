import { describe, expect, it } from "vitest";
import type { Food } from "@/lib/nutrition";
import { basisFor, signed, suggestSubstitutes } from "@/lib/substitute";

const food = (
  id: string,
  group: number,
  kcal: number,
  p: number,
  f: number,
  c: number,
  unit?: [string, number],
): Food => ({
  id,
  name: id,
  user_id: null,
  is_cooked: false,
  source: "sample",
  food_group: group,
  unit_name: unit?.[0] ?? null,
  unit_grams: unit?.[1] ?? null,
  kcal,
  protein_g: p,
  fat_g: f,
  carb_g: c,
});

const saba = food("saba", 10, 174, 20.9, 10.7, 0.2);
const chickenBreast = food("chickenBreast", 11, 105, 23.3, 1.9, 0.1);
const tuna = food("tuna", 10, 70, 16, 0.7, 0.2);
const salmon = food("salmon", 10, 124, 22.3, 4.1, 0.1);
const egg = food("egg", 12, 142, 12.2, 10.2, 0.4, ["個", 50]);
const rice = food("rice", 1, 156, 2.5, 0.3, 37.1);
const oats = food("oats", 1, 350, 13.7, 5.7, 69.1);
const oil = food("oil", 14, 894, 0, 100, 0);

describe("basisFor", () => {
  it("keeps protein for protein foods, carbs for carb foods, else energy", () => {
    expect(basisFor({ kcal: 200, protein_g: 25, fat_g: 10, carb_g: 0 })).toBe("protein_g");
    expect(basisFor({ kcal: 230, protein_g: 4, fat_g: 0, carb_g: 55 })).toBe("carb_g");
    expect(basisFor({ kcal: 90, protein_g: 0, fat_g: 10, carb_g: 0 })).toBe("kcal");
  });
});

describe("suggestSubstitutes", () => {
  it("matches protein and prefers the same food group", () => {
    const s = suggestSubstitutes({ food: saba, grams: 120 }, [
      chickenBreast,
      tuna,
      salmon,
      rice,
      saba,
    ]);
    expect(s.map((x) => x.food.id)).not.toContain("saba");
    expect(s.map((x) => x.food.id)).not.toContain("rice"); // too little protein to make up
    const salmonSwap = s.find((x) => x.food.id === "salmon")!;
    expect(Math.abs(salmonSwap.delta.protein_g)).toBeLessThan(1.5);
    expect(salmonSwap.grams % 5).toBe(0);
    expect(s[0]!.food.food_group).toBe(10);
  });

  it("matches carbs for a carb food", () => {
    const [first] = suggestSubstitutes({ food: rice, grams: 150 }, [oats]);
    expect(first!.grams).toBe(80); // 55.65 g carbs / 69.1 per 100 g ≈ 80.5 → 80
  });

  it("rounds countable foods to half units", () => {
    const [first] = suggestSubstitutes({ food: chickenBreast, grams: 50 }, [egg]);
    expect(first!.grams % 25).toBe(0);
  });

  it("skips foods without the basis nutrient", () => {
    expect(suggestSubstitutes({ food: saba, grams: 120 }, [oil])).toEqual([]);
  });
});

describe("signed", () => {
  it("formats differences", () => {
    expect(signed(2.4)).toBe("+2");
    expect(signed(-3.2)).toBe("−3");
    expect(signed(0.2)).toBe("±0");
  });
});
