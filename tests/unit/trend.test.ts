import { describe, expect, it } from "vitest";
import { trendDirection, weightTrend } from "@/lib/trend";

describe("weightTrend", () => {
  it("matches the SQL view on the PGlite fixture", () => {
    const points = weightTrend([
      { date: "2026-10-01", weightKg: 72.0 },
      { date: "2026-10-04", weightKg: 71.4 },
      { date: "2026-10-05", weightKg: 71.6 },
    ]);
    expect(points.map((p) => p.date)).toEqual([
      "2026-10-01",
      "2026-10-02",
      "2026-10-03",
      "2026-10-04",
      "2026-10-05",
    ]);
    expect(points.map((p) => p.weightKg)).toEqual([72, null, null, 71.4, 71.6]);
    expect(points[1]!.filledKg).toBeCloseTo(71.8);
    expect(points[2]!.filledKg).toBeCloseTo(71.6);
    expect(points.map((p) => p.trendKg)).toEqual([72, 71.9, 71.8, 71.7, 71.68]);
  });

  it("uses at most a 7-day window", () => {
    const entries = Array.from({ length: 10 }, (_, i) => ({
      date: `2026-10-${String(i + 1).padStart(2, "0")}`,
      weightKg: 70 + i,
    }));
    const last = weightTrend(entries).at(-1)!;
    expect(last.trendKg).toBe(76); // mean of 73..79
  });

  it("sorts unordered input and handles a single entry", () => {
    expect(weightTrend([{ date: "2026-10-03", weightKg: 70 }])).toHaveLength(1);
    const points = weightTrend([
      { date: "2026-10-02", weightKg: 71 },
      { date: "2026-10-01", weightKg: 72 },
    ]);
    expect(points.map((p) => p.date)).toEqual(["2026-10-01", "2026-10-02"]);
  });

  it("returns nothing without data", () => {
    expect(weightTrend([])).toEqual([]);
  });
});

describe("trendDirection", () => {
  const series = (weights: number[]) =>
    weightTrend(
      weights.map((w, i) => ({ date: `2026-10-${String(i + 1).padStart(2, "0")}`, weightKg: w })),
    );

  it("reports down, up and flat", () => {
    expect(trendDirection(series([72, 71.8, 71.6, 71.4, 71.2, 71, 70.8, 70.6]))).toBe("down");
    expect(trendDirection(series([70, 70.2, 70.4, 70.6, 70.8, 71, 71.2, 71.4]))).toBe("up");
    expect(trendDirection(series([70, 70.02, 70, 70.01, 70, 70.02, 70, 70.01]))).toBe("flat");
  });

  it("is null with fewer than two days", () => {
    expect(trendDirection(series([70]))).toBeNull();
  });
});
