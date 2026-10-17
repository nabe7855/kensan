import { describe, expect, it } from "vitest";
import { isRepPR, plateauNote, repPRIndexes, sessionBests } from "@/lib/plateau";

const h = (weightKg: number, reps: number, setType = "normal") => ({ weightKg, reps, setType });

describe("rep PRs", () => {
  const history = [h(100, 8), h(100, 6), h(110, 5), h(60, 15, "warmup")];

  it("needs more reps than ever at this weight or heavier", () => {
    expect(isRepPR({ weightKg: 100, reps: 9 }, history)).toBe(true);
    expect(isRepPR({ weightKg: 100, reps: 8 }, history)).toBe(false);
    expect(isRepPR({ weightKg: 105, reps: 6 }, history)).toBe(true);
    expect(isRepPR({ weightKg: 110, reps: 5 }, history)).toBe(false);
  });

  it("is not a rep PR at a weight never lifted, or with no history", () => {
    expect(isRepPR({ weightKg: 120, reps: 3 }, history)).toBe(false);
    expect(isRepPR({ weightKg: 100, reps: 9 }, [])).toBe(false);
    expect(isRepPR({ weightKg: 60, reps: 20 }, [h(60, 15, "warmup")])).toBe(false);
  });

  it("keeps the best rep PR per weight in a session", () => {
    const sets = [
      { ...h(100, 9), done: true },
      { ...h(100, 10), done: true },
      { ...h(100, 12), done: false },
      { ...h(105, 7), done: true },
      { ...h(100, 11, "warmup"), done: true },
    ];
    expect(repPRIndexes(sets, history)).toEqual([1, 3]);
  });
});

describe("sessionBests", () => {
  it("takes the best working set per workout, oldest first", () => {
    const s = (workoutId: string, doneAt: string, w: number, r: number, setType = "normal") => ({
      workoutId,
      doneAt,
      weightKg: w,
      reps: r,
      setType,
    });
    expect(
      sessionBests([
        s("b", "2026-10-10T10:00:00Z", 100, 3),
        s("a", "2026-10-03T10:00:00Z", 90, 10),
        s("a", "2026-10-03T10:05:00Z", 120, 10, "warmup"),
        s("b", "2026-10-10T10:05:00Z", 100, 6),
      ]),
    ).toEqual([120, 120]);
  });
});

describe("plateauNote", () => {
  it("needs enough sessions", () => {
    expect(plateauNote([100, 100, 100, 100], "bulk")).toBeNull();
  });

  it("flags a stall on a bulk or maintain phase", () => {
    const note = plateauNote([95, 100, 99, 100, 98], "bulk");
    expect(note?.kind).toBe("stalled");
    expect(note?.reason).toMatch(/100\.0kg/);
    expect(plateauNote([95, 100, 99, 100, 101], "maintain")).toBeNull();
  });

  it("stays quiet when holding strength on a cut", () => {
    expect(plateauNote([100, 100, 98, 97, 99], "cut")).toBeNull();
  });

  it("flags a clear drop on a cut", () => {
    const note = plateauNote([100, 100, 95, 94, 93], "cut");
    expect(note?.kind).toBe("dropping");
    expect(note?.title).toMatch(/6%/);
  });
});
