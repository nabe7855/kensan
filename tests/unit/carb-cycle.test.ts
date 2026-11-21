import { describe, expect, it } from "vitest";
import { carbCycle, MIN_CARB_G, trainingDaysPerWeek } from "@/lib/carb-cycle";

const avg = { kcal: 2000, protein_g: 160, fat_g: 50, carb_g: 200 };
const week = (r: { train: { carb_g: number }; off: { carb_g: number } }, n: number) =>
  r.train.carb_g * n + r.off.carb_g * (7 - n);

describe("carbCycle", () => {
  it("shifts carbs to training days and keeps the week the same", () => {
    const r = carbCycle(avg, 4)!;
    expect(r.train).toEqual({ kcal: 2120, protein_g: 160, fat_g: 50, carb_g: 230 });
    expect(r.off).toEqual({ kcal: 1840, protein_g: 160, fat_g: 50, carb_g: 160 });
    expect(Math.abs(week(r, 4) - 7 * 200)).toBeLessThanOrEqual(3);
  });

  it("keeps off days above the floor", () => {
    const r = carbCycle({ ...avg, carb_g: 60 }, 4)!;
    expect(r.off.carb_g).toBeGreaterThanOrEqual(MIN_CARB_G);
    expect(r.train.carb_g).toBeGreaterThan(r.off.carb_g);
  });

  it("does nothing when carbs are already low", () => {
    expect(carbCycle({ ...avg, carb_g: 52 }, 4)).toBeNull();
  });
});

describe("trainingDaysPerWeek", () => {
  it("averages the last 4 weeks", () => {
    const dates = Array.from(
      { length: 12 },
      (_, i) => `2026-11-${String(i * 2 + 1).padStart(2, "0")}`,
    );
    expect(trainingDaysPerWeek([...dates, dates[0]!], "2026-11-24")).toBe(3);
  });

  it("falls back to 4 without sessions", () => {
    expect(trainingDaysPerWeek([], "2026-11-24")).toBe(4);
  });
});
