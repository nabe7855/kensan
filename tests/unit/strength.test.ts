import { describe, expect, it } from "vitest";
import {
  bestByExercise,
  detectPRs,
  estimated1RM,
  nextSetType,
  totalVolume,
  workingSetCount,
  type LoggedSet,
} from "@/lib/strength";

const set = (
  exerciseId: string,
  weightKg: number | null,
  reps: number | null,
  setType: LoggedSet["setType"] = "normal",
): LoggedSet => ({ exerciseId, weightKg, reps, setType });

describe("estimated1RM", () => {
  it("uses Epley", () => {
    expect(estimated1RM(100, 8)).toBeCloseTo(126.67, 2);
    expect(estimated1RM(60, 12)).toBe(84);
  });

  it("returns the actual weight for a single rep and 0 for empty input", () => {
    expect(estimated1RM(140, 1)).toBe(140);
    expect(estimated1RM(0, 5)).toBe(0);
    expect(estimated1RM(100, 0)).toBe(0);
  });
});

describe("volume and set counts", () => {
  const sets = [
    set("bench", 60, 10, "warmup"),
    set("bench", 100, 8),
    set("bench", 100, 7),
    set("row", null, 10),
  ];

  it("excludes warm-ups and empty sets", () => {
    expect(totalVolume(sets)).toBe(1500);
    expect(workingSetCount(sets)).toBe(2);
  });

  it("finds the best e1RM per exercise", () => {
    expect(bestByExercise(sets).get("bench")).toBeCloseTo(126.67, 2);
    expect(bestByExercise(sets).has("row")).toBe(false);
  });
});

describe("detectPRs", () => {
  it("flags the best set that beats history, once per exercise", () => {
    const previous = new Map([["bench", 120]]);
    const sets = [set("bench", 95, 8), set("bench", 100, 8), set("bench", 100, 9)];
    // 95x8=120.3 > 120, 100x8=126.7, 100x9=130 -> best is index 2
    expect(detectPRs(sets, previous)).toEqual([2]);
  });

  it("ignores warm-ups, ties and exercises without history", () => {
    const previous = new Map([["bench", 126.66666666666667]]);
    expect(detectPRs([set("bench", 100, 8)], previous)).toEqual([]);
    expect(detectPRs([set("bench", 200, 5, "warmup")], previous)).toEqual([]);
    expect(detectPRs([set("squat", 200, 5)], previous)).toEqual([]);
  });

  it("handles several exercises", () => {
    const previous = new Map([
      ["bench", 100],
      ["incline", 40],
    ]);
    const sets = [set("bench", 100, 8), set("incline", 36, 10), set("incline", 30, 10)];
    expect(detectPRs(sets, previous)).toEqual([0, 1]);
  });
});

describe("nextSetType", () => {
  it("cycles through all types", () => {
    expect(nextSetType("normal")).toBe("warmup");
    expect(nextSetType("failure")).toBe("rest_pause");
    expect(nextSetType("superset")).toBe("normal");
  });
});
