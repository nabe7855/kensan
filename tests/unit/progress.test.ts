import { describe, expect, it } from "vitest";
import { bestE1RM, percentDiff, setDiff, signedDiff } from "@/lib/progress";

describe("setDiff", () => {
  it("shows weight and rep changes", () => {
    expect(setDiff({ weightKg: 102.5, reps: 8 }, { weightKg: 100, reps: 8 })).toEqual({
      label: "+2.5kg",
      trend: "up",
    });
    expect(setDiff({ weightKg: 100, reps: 9 }, { weightKg: 100, reps: 8 })).toEqual({
      label: "+1回",
      trend: "up",
    });
    expect(setDiff({ weightKg: 100, reps: 8 }, { weightKg: 100, reps: 8 })).toEqual({
      label: "同じ",
      trend: "same",
    });
  });

  it("judges mixed changes by estimated 1RM", () => {
    // 105×7 (129.5) beats 100×8 (126.7)
    expect(setDiff({ weightKg: 105, reps: 7 }, { weightKg: 100, reps: 8 })).toEqual({
      label: "+5kg −1回",
      trend: "up",
    });
    expect(setDiff({ weightKg: 95, reps: 8 }, { weightKg: 100, reps: 8 })?.trend).toBe("down");
  });

  it("has nothing to compare without a previous set", () => {
    expect(setDiff({ weightKg: 100, reps: 8 }, undefined)).toBeNull();
    expect(setDiff({ weightKg: 100, reps: 8 }, { weightKg: null, reps: 8 })).toBeNull();
  });
});

describe("bestE1RM / signedDiff / percentDiff", () => {
  it("finds the best estimated 1RM", () => {
    expect(
      bestE1RM([
        { weightKg: 100, reps: 8 },
        { weightKg: 105, reps: 6 },
        { weightKg: null, reps: 5 },
      ]),
    ).toBeCloseTo(126.67, 2);
    expect(bestE1RM([])).toBeNull();
  });

  it("formats differences", () => {
    expect(signedDiff(128.34, 126.2)).toBe("+2.1");
    expect(signedDiff(120, 120.5)).toBe("−0.5");
    expect(signedDiff(1, 1)).toBe("±0");
    expect(percentDiff(12480, 11780)).toBe("+6%");
    expect(percentDiff(9700, 10000)).toBe("−3%");
    expect(percentDiff(100, 0)).toBeNull();
  });
});
