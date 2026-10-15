import { describe, expect, it } from "vitest";
import { goalOn, weightChartPoints } from "@/lib/home";

const prep = {
  start_date: "2026-10-01",
  contest_date: "2027-04-18",
  start_weight_kg: 78,
  target_weight_kg: 70,
  weekly_rate_pct: 0.5,
};

describe("goalOn", () => {
  it("is the start weight on day one and null outside the prep", () => {
    expect(goalOn(prep, "2026-10-01")).toBe(78);
    expect(goalOn(prep, "2026-10-08")).toBeCloseTo(78 * 0.995);
    expect(goalOn(prep, "2026-09-30")).toBeNull();
    expect(goalOn(prep, "2027-04-19")).toBeNull();
    expect(goalOn(null, "2026-10-08")).toBeNull();
  });
});

describe("weightChartPoints", () => {
  it("returns exactly `days` rows ending today, with trend carried from earlier data", () => {
    const entries = [
      { date: "2026-10-01", weightKg: 72 },
      { date: "2026-10-05", weightKg: 71.6 },
      { date: "2026-10-10", weightKg: 71 },
    ];
    const rows = weightChartPoints(entries, "2026-10-10", prep, 5);
    expect(rows.map((r) => r.date)).toEqual([
      "2026-10-06",
      "2026-10-07",
      "2026-10-08",
      "2026-10-09",
      "2026-10-10",
    ]);
    expect(rows[0]!.weightKg).toBeNull();
    expect(rows[0]!.trendKg).not.toBeNull();
    expect(rows[4]!.weightKg).toBe(71);
    expect(rows[4]!.goalKg).not.toBeNull();
  });

  it("leaves trend empty after the last measurement", () => {
    const rows = weightChartPoints([{ date: "2026-10-01", weightKg: 72 }], "2026-10-03", null, 3);
    expect(rows.map((r) => r.trendKg)).toEqual([72, null, null]);
  });
});
