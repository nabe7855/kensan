import { describe, expect, it } from "vitest";
import type { Session } from "@/lib/sessions";
import { perKg, rangeStatus, SET_RANGES, weeklyPartSets } from "@/lib/weekly-sets";

const set = (groups: string[], setType = "normal", reps: number | null = 8) => ({
  id: groups.join() + setType,
  exercise_id: groups.join(),
  set_no: 1,
  set_type: setType,
  weight_kg: 50,
  reps,
  rir: null,
  is_pr: false,
  done_at: null,
  bodyweight_kg: null,
  exercise: { name_ja: "", muscle_groups: groups },
});

const session = (startedAt: string, sets: ReturnType<typeof set>[]): Session => ({
  id: startedAt,
  started_at: startedAt,
  ended_at: null,
  pump: null,
  soreness: null,
  joint: null,
  load_feel: null,
  sets,
});

describe("weeklyPartSets", () => {
  it("counts hard sets by prime mover and the days each part was trained", () => {
    const week = weeklyPartSets([
      session("2026-10-12T09:00:00+09:00", [
        set(["chest", "triceps"]),
        set(["chest", "triceps"]),
        set(["chest"], "warmup"),
        set(["triceps"]),
        set(["chest"], "normal", null),
      ]),
      session("2026-10-15T09:00:00+09:00", [set(["chest"]), set(["quads", "glutes"])]),
    ]);
    const by = Object.fromEntries(week.map((w) => [w.part, w]));
    expect(by.chest).toEqual({ part: "chest", sets: 3, days: 2 });
    expect(by.arms).toEqual({ part: "arms", sets: 1, days: 1 });
    expect(by.legs?.sets).toBe(1);
    expect(by.back).toEqual({ part: "back", sets: 0, days: 0 });
    expect(week).toHaveLength(6);
  });
});

describe("ranges", () => {
  it("places a count against the range", () => {
    expect(rangeStatus(8, SET_RANGES.chest)).toBe("below");
    expect(rangeStatus(10, SET_RANGES.chest)).toBe("in");
    expect(rangeStatus(21, SET_RANGES.chest)).toBe("above");
  });

  it("gives protein per kg", () => {
    expect(perKg(180, 75)).toBe(2.4);
    expect(perKg(180, null)).toBeNull();
  });
});
