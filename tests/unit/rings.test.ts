import { describe, expect, it } from "vitest";
import { dashOffset, prepProgress, ringProgress } from "@/lib/rings";

describe("ringProgress", () => {
  it("caps the ring but not the percentage", () => {
    expect(ringProgress(96, 150)).toEqual({ ratio: 0.64, pct: 64 });
    expect(ringProgress(180, 150)).toEqual({ ratio: 1, pct: 120 });
    expect(ringProgress(-5, 150)).toEqual({ ratio: 0, pct: 0 });
  });

  it("has no ring without a target", () => {
    expect(ringProgress(50, null)).toBeNull();
    expect(ringProgress(50, 0)).toBeNull();
  });
});

describe("prepProgress", () => {
  it("counts days from start to contest", () => {
    expect(prepProgress("2026-07-01", "2026-10-29", "2026-08-30")?.pct).toBe(50);
    expect(prepProgress("2026-07-01", "2026-10-29", "2026-06-01")?.ratio).toBe(0);
    expect(prepProgress("2026-07-01", "2026-10-29", "2026-12-01")?.ratio).toBe(1);
    expect(prepProgress("2026-07-01", "2026-07-01", "2026-07-01")).toBeNull();
  });
});

it("dashOffset empties and fills the stroke", () => {
  expect(dashOffset(100, 0)).toBe(100);
  expect(dashOffset(100, 1)).toBe(0);
  expect(dashOffset(100, 2)).toBe(0);
});

describe("weekly counts", () => {
  it("finds Monday", async () => {
    const { weekStartISO } = await import("@/lib/rings");
    expect(weekStartISO("2026-10-17")).toBe("2026-10-12");
    expect(weekStartISO("2026-10-12")).toBe("2026-10-12");
    expect(weekStartISO("2026-10-18")).toBe("2026-10-12");
  });

  it("compares this week's training days with the usual", async () => {
    const { trainingFrequency } = await import("@/lib/rings");
    const prior = [
      "2026-09-15",
      "2026-09-17",
      "2026-09-22",
      "2026-09-24",
      "2026-09-29",
      "2026-10-01",
      "2026-10-06",
      "2026-10-08",
    ];
    expect(
      trainingFrequency([...prior, "2026-10-13", "2026-10-13", "2026-10-15"], "2026-10-17"),
    ).toEqual({
      thisWeek: 2,
      usual: 2,
    });
    expect(trainingFrequency(["2026-10-13"], "2026-10-17")).toEqual({ thisWeek: 1, usual: null });
  });

  it("counts recorded days in the last week", async () => {
    const { recordedDays } = await import("@/lib/rings");
    expect(
      recordedDays(["2026-10-17", "2026-10-11", "2026-10-10", "2026-10-18"], "2026-10-17"),
    ).toBe(2);
  });
});
