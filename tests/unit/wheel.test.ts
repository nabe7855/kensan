import { describe, expect, it } from "vitest";
import { indexAt, joinKg, range, splitKg, startingValues } from "@/lib/wheel";

describe("weight wheels", () => {
  it("splits and joins kilograms on quarter steps", () => {
    expect(splitKg(72.5)).toEqual({ whole: 72, frac: 0.5 });
    expect(splitKg(101.25)).toEqual({ whole: 101, frac: 0.25 });
    expect(splitKg(60.3)).toEqual({ whole: 60, frac: 0.25 });
    expect(splitKg(-5)).toEqual({ whole: 0, frac: 0 });
    expect(joinKg(72, 0.75)).toBe(72.75);
  });

  it("maps scroll offsets to items", () => {
    expect(range(3)).toEqual([0, 1, 2, 3]);
    expect(indexAt(0, 44, 10)).toBe(0);
    expect(indexAt(70, 44, 10)).toBe(2);
    expect(indexAt(9999, 44, 10)).toBe(9);
  });
});

describe("startingValues", () => {
  const empty = { weight: "", reps: "", rir: "" };
  it("prefers what is typed, then last time, then the set above", () => {
    expect(
      startingValues(
        { weight: "80", reps: "", rir: "" },
        { weight_kg: 77.5, reps: 8, rir: 1 },
        undefined,
      ),
    ).toEqual({
      weight: 80,
      reps: 8,
      rir: 1,
    });
    expect(startingValues(empty, undefined, { weight: "60", reps: "10", rir: "" })).toEqual({
      weight: 60,
      reps: 10,
      rir: 0,
    });
    expect(startingValues(empty, undefined, undefined)).toEqual({ weight: 0, reps: 0, rir: 0 });
  });
});
