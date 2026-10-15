import { describe, expect, it } from "vitest";
import {
  dayTotals,
  lowProteinNote,
  proteinShare,
  variantLabel,
  variantsOf,
  type PlanMeal,
} from "@/lib/meal-plan";
import type { Food } from "@/lib/nutrition";

const food = (id: string, kcal: number, p: number, f: number, c: number): Food => ({
  id,
  name: id,
  user_id: null,
  is_cooked: false,
  source: "sample",
  food_group: null,
  unit_name: null,
  unit_grams: null,
  kcal,
  protein_g: p,
  fat_g: f,
  carb_g: c,
});
const rice = food("rice", 156, 2.5, 0.3, 37.1);
const chicken = food("chicken", 105, 23.3, 1.9, 0.1);

const meal = (slot: string, eaten: boolean, items: [Food, number][]): PlanMeal => ({
  slot,
  eatenAt: eaten ? "2026-10-15T08:00:00Z" : null,
  title: null,
  templateId: null,
  items: items.map(([f, g], i) => ({ id: `${slot}${i}`, food: f, grams: g })),
});

describe("dayTotals", () => {
  it("splits eaten and planned", () => {
    const t = dayTotals([meal("朝", true, [[rice, 100]]), meal("昼", false, [[chicken, 100]])]);
    expect(t.eaten.kcal).toBeCloseTo(156);
    expect(t.planned.protein_g).toBeCloseTo(23.3);
  });

  it("is zero without meals", () => {
    expect(dayTotals([]).eaten.kcal).toBe(0);
  });
});

describe("protein guidance", () => {
  it("computes protein's share of energy", () => {
    expect(proteinShare({ kcal: 400, protein_g: 30, fat_g: 0, carb_g: 0 })).toBeCloseTo(0.3);
    expect(proteinShare({ kcal: 0, protein_g: 0, fat_g: 0, carb_g: 0 })).toBe(0);
  });

  it("notes substantial meals that are light on protein only", () => {
    expect(lowProteinNote({ kcal: 500, protein_g: 12, fat_g: 10, carb_g: 90 })).toMatch(/12g/);
    expect(lowProteinNote({ kcal: 500, protein_g: 30, fat_g: 10, carb_g: 60 })).toBeNull();
    expect(lowProteinNote({ kcal: 150, protein_g: 2, fat_g: 0, carb_g: 35 })).toBeNull();
  });
});

describe("variants", () => {
  const templates = [
    { id: "a", name: "1食目 鯖", group_name: "1食目" },
    { id: "b", name: "1食目 鶏むね", group_name: "1食目" },
    { id: "c", name: "夜固定", group_name: null },
  ];

  it("lists the group of the applied set", () => {
    expect(variantsOf(templates, "a").map((t) => t.id)).toEqual(["a", "b"]);
    expect(variantsOf(templates, "c").map((t) => t.id)).toEqual(["c"]);
    expect(variantsOf(templates, null)).toEqual([]);
  });

  it("shortens chip labels to what differs", () => {
    expect(variantLabel("1食目 鯖", "1食目")).toBe("鯖");
    expect(variantLabel("1食目／鶏むね", "1食目")).toBe("鶏むね");
    expect(variantLabel("夜固定", null)).toBe("夜固定");
  });
});
