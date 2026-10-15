import { describe, expect, it } from "vitest";
import {
  goalLine,
  goalWeightAt,
  projectedWeight,
  reachesTarget,
  requiredWeeklyRate,
  suggestedWeeklyRate,
  weeksBetween,
} from "@/lib/prep";

describe("weeksBetween", () => {
  it("returns fractional weeks", () => {
    expect(weeksBetween("2026-10-15", "2026-10-29")).toBe(2);
    expect(weeksBetween("2026-10-15", "2026-10-18")).toBeCloseTo(3 / 7);
  });
});

describe("requiredWeeklyRate", () => {
  it("compounds so the curve lands exactly on the target", () => {
    const r = requiredWeeklyRate(78, 70, 26);
    expect(projectedWeight(78, r, 26)).toBeCloseTo(70, 6);
  });

  it("is 0 when no loss is needed or no time remains", () => {
    expect(requiredWeeklyRate(70, 72, 10)).toBe(0);
    expect(requiredWeeklyRate(78, 70, 0)).toBe(0);
  });
});

describe("suggestedWeeklyRate", () => {
  it("rounds the required rate up to 0.05 so the target is still reached", () => {
    // 78 -> 70 in 26 weeks needs ~0.4157 %/week
    expect(suggestedWeeklyRate(78, 70, 26)).toBe(0.45);
    expect(reachesTarget(78, 70, 0.45, 26)).toBe(true);
  });

  it("caps at 1.0 %/week", () => {
    expect(suggestedWeeklyRate(80, 70, 8)).toBe(1);
    expect(reachesTarget(80, 70, 1, 8)).toBe(false);
  });

  it("never goes below the 0.25 %/week minimum", () => {
    expect(suggestedWeeklyRate(70.5, 70, 30)).toBe(0.25);
  });

  it("keeps exact steps without bumping them up", () => {
    const weeks = Math.log(70 / 78) / Math.log(1 - 0.005);
    expect(suggestedWeeklyRate(78, 70, weeks)).toBe(0.5);
  });
});

describe("goalWeightAt / goalLine", () => {
  it("never drops below the target", () => {
    expect(goalWeightAt(78, 70, 1, 52)).toBe(70);
  });

  it("starts at the start weight and has a point per week plus the contest day", () => {
    const line = goalLine(78, 70, 0.5, 2.5);
    expect(line.map((p) => p.week)).toEqual([0, 1, 2, 2.5]);
    expect(line[0]?.weightKg).toBe(78);
    expect(line[1]?.weightKg).toBeCloseTo(77.61, 2);
  });

  it("handles a contest day on a whole week without duplicating it", () => {
    expect(goalLine(78, 70, 0.5, 2).map((p) => p.week)).toEqual([0, 1, 2]);
  });
});
