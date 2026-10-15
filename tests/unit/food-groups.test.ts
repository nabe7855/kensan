import { describe, expect, it } from "vitest";
import { displayAmount, foodGroupLabel, stepGrams, toGrams } from "@/lib/food-groups";

const egg = { unit_name: "個", unit_grams: 50 };
const dish = { unit_name: "人前", unit_grams: 400 };
const rice = { unit_name: null, unit_grams: null };

describe("food groups", () => {
  it("labels MEXT groups", () => {
    expect(foodGroupLabel(11)).toBe("肉類");
    expect(foodGroupLabel(null)).toBeNull();
    expect(foodGroupLabel(42)).toBeNull();
  });
});

describe("units", () => {
  it("shows countable foods in their unit and others in grams", () => {
    expect(displayAmount(egg, 100)).toEqual({ value: 2, unit: "個" });
    expect(displayAmount(egg, 75)).toEqual({ value: 1.5, unit: "個" });
    expect(displayAmount(dish, 200)).toEqual({ value: 0.5, unit: "人前" });
    expect(displayAmount(rice, 151.4)).toEqual({ value: 151, unit: "g" });
  });

  it("converts entered units back to grams", () => {
    expect(toGrams(egg, 2, true)).toBe(100);
    expect(toGrams(egg, 120, false)).toBe(120);
    expect(toGrams(rice, 3, true)).toBe(3);
  });

  it("steps by a unit, half a serving, or 5/10 g", () => {
    expect(stepGrams(egg, 100)).toBe(50);
    expect(stepGrams(dish, 400)).toBe(200);
    expect(stepGrams(rice, 150)).toBe(10);
    expect(stepGrams(rice, 40)).toBe(5);
  });
});
