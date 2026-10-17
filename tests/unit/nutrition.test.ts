import { describe, expect, it } from "vitest";
import { fillError, fillReason, suggestFill, type FillFood } from "@/lib/fill";
import {
  dayTypeFor,
  isOver,
  macrosFor,
  mealLogId,
  slotForHour,
  sumMacros,
  targetFor,
  type Target,
} from "@/lib/nutrition";

const chicken: FillFood = {
  id: "chicken",
  name: "鶏むね",
  kcal: 105,
  protein_g: 23.3,
  fat_g: 1.9,
  carb_g: 0.1,
};
const rice: FillFood = {
  id: "rice",
  name: "白米",
  kcal: 156,
  protein_g: 2.5,
  fat_g: 0.3,
  carb_g: 37.1,
};
const oil: FillFood = {
  id: "oil",
  name: "オリーブ油",
  kcal: 894,
  protein_g: 0,
  fat_g: 100,
  carb_g: 0,
};

describe("macros", () => {
  it("scales per-100g values and sums them", () => {
    expect(macrosFor(chicken, 150).protein_g).toBeCloseTo(34.95);
    const total = sumMacros([macrosFor(chicken, 100), macrosFor(rice, 200)]);
    expect(total.kcal).toBeCloseTo(417);
    expect(total.carb_g).toBeCloseTo(74.3);
  });
});

describe("dayTypeFor / targetFor", () => {
  const routines = [{ weekdays: [1, 4], order_idx: 0 }];

  it("follows routine weekdays unless overridden", () => {
    expect(dayTypeFor("2026-10-12", routines, null)).toBe("train"); // Monday
    expect(dayTypeFor("2026-10-13", routines, null)).toBe("off");
    expect(dayTypeFor("2026-10-13", routines, "train")).toBe("train");
  });

  it("uses the latest target already in effect", () => {
    const t = (effective_from: string, day_type: "train" | "off", kcal: number): Target => ({
      effective_from,
      day_type,
      kcal,
      protein_g: 0,
      fat_g: 0,
      carb_g: 0,
    });
    const targets = [
      t("2026-10-01", "train", 2400),
      t("2026-10-10", "train", 2250),
      t("2026-10-20", "train", 2100),
      t("2026-10-01", "off", 1900),
    ];
    expect(targetFor(targets, "2026-10-15", "train")?.kcal).toBe(2250);
    expect(targetFor(targets, "2026-10-15", "off")?.kcal).toBe(1900);
    expect(targetFor(targets, "2026-09-30", "train")).toBeNull();
  });

  it("treats a target as a range", () => {
    expect(isOver("kcal", 2340, 2250)).toBe(false);
    expect(isOver("kcal", 2360, 2250)).toBe(true);
  });
});

describe("slotForHour / mealLogId", () => {
  it("maps hours to default slots", () => {
    expect(slotForHour(7)).toBe("朝");
    expect(slotForHour(12)).toBe("昼");
    expect(slotForHour(16)).toBe("トレ前");
    expect(slotForHour(21)).toBe("夜");
    expect(slotForHour(21, ["朝", "間食"])).toBe("朝");
  });

  it("is a stable, valid UUID per (user, date, slot)", () => {
    const a = mealLogId("u1", "2026-10-15", "朝");
    expect(a).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
    expect(mealLogId("u1", "2026-10-15", "朝")).toBe(a);
    expect(mealLogId("u1", "2026-10-15", "昼")).not.toBe(a);
    expect(mealLogId("u2", "2026-10-15", "朝")).not.toBe(a);
  });
});

describe("suggestFill", () => {
  it("prefers protein accuracy and returns up to 3 distinct combinations", () => {
    const remaining = { kcal: 610, protein_g: 42, fat_g: 12, carb_g: 85 };
    const s = suggestFill(remaining, [chicken, rice, oil]);
    expect(s).toHaveLength(3);
    expect(s[0]!.items.map((i) => i.food.id).sort()).toEqual(["chicken", "rice"]);
    expect(s[0]!.after.protein_g).toBeLessThan(5);
    expect(Math.abs(s[0]!.after.carb_g)).toBeLessThan(10);
    const keys = s.map((x) =>
      x.items
        .map((i) => i.food.id)
        .sort()
        .join("+"),
    );
    expect(new Set(keys).size).toBe(keys.length);
    expect(s[0]!.error).toBeLessThanOrEqual(s[1]!.error);
  });

  it("penalises overshooting more than undershooting", () => {
    const remaining = { kcal: 0, protein_g: 10, fat_g: 0, carb_g: 0 };
    expect(fillError(remaining, { ...remaining, protein_g: 12 })).toBeGreaterThan(
      fillError(remaining, { ...remaining, protein_g: 8 }),
    );
  });

  it("returns nothing when there is nothing left to fill", () => {
    expect(suggestFill({ kcal: 0, protein_g: 0, fat_g: -3, carb_g: 0 }, [chicken])).toEqual([]);
  });

  it("explains itself in one line", () => {
    const remaining = { kcal: 610, protein_g: 42, fat_g: 12, carb_g: 85 };
    const [first] = suggestFill(remaining, [chicken, rice]);
    expect(fillReason(remaining, first!)).toMatch(/^残り P42・F12・C85g に対し/);
  });
});

describe("carbsFromTarget / energySplit", () => {
  it("fills the remaining energy with carbs", async () => {
    const { carbsFromTarget } = await import("@/lib/nutrition");
    // 2250 − 200×4 − 50×9 = 1000 kcal → 250 g
    expect(carbsFromTarget(2250, 200, 50)).toBe(250);
    expect(carbsFromTarget(1800, 180, 55)).toBeCloseTo(146.3, 1);
  });

  it("never goes negative when P and F already exceed the energy", async () => {
    const { carbsFromTarget } = await import("@/lib/nutrition");
    expect(carbsFromTarget(1000, 200, 60)).toBe(0);
  });

  it("splits energy between P, F and C", async () => {
    const { energySplit } = await import("@/lib/nutrition");
    const s = energySplit({ kcal: 2250, protein_g: 200, fat_g: 50, carb_g: 250 });
    expect(s.p + s.f + s.c).toBeCloseTo(1);
    expect(s.p).toBeCloseTo(800 / 2250, 3);
  });
});
