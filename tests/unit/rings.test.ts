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
