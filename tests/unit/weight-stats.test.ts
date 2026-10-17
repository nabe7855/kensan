import { describe, expect, it } from "vitest";
import { headlineWeight, rangeStart, rangeStats, signedKg } from "@/lib/weight-stats";

const days = (start: string, values: number[]) =>
  values.map((weightKg, i) => {
    const d = new Date(`${start}T00:00:00Z`);
    d.setUTCDate(d.getUTCDate() + i);
    return { date: d.toISOString().slice(0, 10), weightKg };
  });

describe("rangeStart", () => {
  const entries = days("2026-01-01", [80, 79.8]);
  it("counts back from today, or starts at the first record for all", () => {
    expect(rangeStart("week", entries, "2026-10-17")).toBe("2026-10-11");
    expect(rangeStart("month", entries, "2026-10-17")).toBe("2026-09-18");
    expect(rangeStart("all", entries, "2026-10-17")).toBe("2026-01-01");
    expect(rangeStart("all", [], "2026-10-17")).toBe("2026-09-18");
  });
});

describe("rangeStats", () => {
  const entries = days(
    "2026-10-01",
    [72.0, 72.4, 71.8, 72.2, 71.9, 71.6, 72.0, 71.5, 71.4, 71.7, 71.2, 71.3, 71.0, 71.1],
  );

  it("gives average, high, low and the weekly-average change", () => {
    const s = rangeStats(entries, "2026-10-01", "2026-10-14")!;
    expect(s.count).toBe(14);
    expect(s.max).toEqual({ kg: 72.4, date: "2026-10-02" });
    expect(s.min).toEqual({ kg: 71.0, date: "2026-10-13" });
    expect(s.avg).toBeCloseTo(71.65, 2);
    expect(s.trendChange!).toBeLessThan(0);
    expect(s.perWeek!).toBeLessThan(0);
  });

  it("has no change for less than a week of data, and nothing for an empty range", () => {
    expect(rangeStats(entries, "2026-10-01", "2026-10-03")!.trendChange).toBeNull();
    expect(rangeStats(entries, "2026-11-01", "2026-11-07")).toBeNull();
  });
});

describe("headlineWeight", () => {
  it("prefers today, else the latest record", () => {
    const e = days("2026-10-15", [72.1, 72.5]);
    expect(headlineWeight(e, "2026-10-16")).toEqual({
      kg: 72.5,
      date: "2026-10-16",
      isToday: true,
    });
    expect(headlineWeight(e, "2026-10-17")?.isToday).toBe(false);
    expect(headlineWeight([], "2026-10-17")).toBeNull();
  });
});

it("formats signed kilograms", () => {
  expect(signedKg(0.34)).toBe("+0.3");
  expect(signedKg(-1.26)).toBe("−1.3");
  expect(signedKg(0.01)).toBe("±0.0");
});
