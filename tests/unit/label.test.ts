import { describe, expect, it } from "vitest";
import { kcalCheck, labelToFood } from "@/lib/label";

const base = {
  servingName: "",
  servingGrams: null,
  fiber_g: null,
  salt_g: null,
};

describe("labelToFood", () => {
  it("converts a per-serving label to per 100 g with the serving as a unit", () => {
    const f = labelToFood({
      ...base,
      basis: "serving",
      servingName: "袋",
      servingGrams: 30,
      kcal: 150,
      protein_g: 9,
      fat_g: 3,
      carb_g: 21.6,
      fiber_g: 1.5,
      salt_g: 0.3,
    })!;
    expect(f).toEqual({
      kcal: 500,
      protein_g: 30,
      fat_g: 10,
      carb_g: 72,
      fiber_g: 5,
      sodium_mg: 393.4,
      unit_name: "袋",
      unit_grams: 30,
    });
  });

  it("keeps a per-100 g label as is, with an optional serving", () => {
    const plain = labelToFood({
      ...base,
      basis: "100g",
      kcal: 105,
      protein_g: 23.3,
      fat_g: 1.9,
      carb_g: 0,
    })!;
    expect(plain.unit_name).toBeNull();
    expect(plain.kcal).toBe(105);
    const withUnit = labelToFood({
      ...base,
      basis: "100g",
      servingName: "本",
      servingGrams: 60,
      kcal: 200,
      protein_g: 10,
      fat_g: 5,
      carb_g: 28,
    })!;
    expect([withUnit.unit_name, withUnit.unit_grams, withUnit.kcal]).toEqual(["本", 60, 200]);
  });

  it("needs the serving weight for a per-serving label", () => {
    expect(
      labelToFood({ ...base, basis: "serving", kcal: 150, protein_g: 9, fat_g: 3, carb_g: 20 }),
    ).toBeNull();
  });

  it("names an unnamed serving", () => {
    const f = labelToFood({
      ...base,
      basis: "serving",
      servingGrams: 50,
      kcal: 80,
      protein_g: 4,
      fat_g: 2,
      carb_g: 11,
    })!;
    expect([f.unit_name, f.unit_grams]).toEqual(["食", 50]);
  });
});

describe("kcalCheck", () => {
  it("flags only a clear gap between kcal and P/F/C", () => {
    expect(kcalCheck(150, 9, 3, 21.6)).toEqual({ estimated: 149, off: false });
    expect(kcalCheck(300, 9, 3, 21.6).off).toBe(true);
    expect(kcalCheck(30, 1, 0, 2).off).toBe(false);
  });
});
