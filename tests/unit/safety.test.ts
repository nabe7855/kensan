import { describe, expect, it } from "vitest";
import { addDaysISO } from "@/lib/prep";
import { evaluateSafety, painLabel, type CheckinDay, type WorkoutDay } from "@/lib/safety";

const TODAY = "2026-10-18";
const day = (n: number) => addDaysISO(TODAY, -n);

/** A normal month: steady 4s, resting HR 55. */
const normal = (from = 30, to = 0, over: Partial<CheckinDay> = {}): CheckinDay[] =>
  Array.from({ length: from - to + 1 }, (_, i) => ({
    date: day(from - i),
    sleep: 4,
    mood: 4,
    energy: 4,
    hunger: 4,
    libido: 4,
    rhr: 55,
    pain_areas: [],
    ...over,
  }));

const replaceDays = (base: CheckinDay[], days: number[], over: Partial<CheckinDay>) =>
  base.map((c) => (days.some((n) => c.date === day(n)) ? { ...c, ...over } : c));

const keys = (s: ReturnType<typeof evaluateSafety>) => s.signals.map((x) => x.key);

describe("evaluateSafety", () => {
  it("is quiet on an ordinary month and on one bad day", () => {
    const one = replaceDays(normal(), [0], { sleep: 1, mood: 2, energy: 2 });
    expect(evaluateSafety({ checkins: normal(), workouts: [], today: TODAY }).level).toBe("none");
    expect(evaluateSafety({ checkins: one, workouts: [], today: TODAY }).level).toBe("none");
  });

  it("flags fatigue against the person's own normal, more leniently on a cut", () => {
    const tired = replaceDays(normal(), [0, 1, 2], {
      energy: 2,
      sleep: 3,
      mood: 3,
      hunger: 3,
      libido: 3,
    });
    expect(keys(evaluateSafety({ checkins: tired, workouts: [], today: TODAY }))).toContain(
      "fatigue",
    );
    // A 0.8 dip: counts normally, but a cut is expected to cost that much.
    const mild = replaceDays(normal(), [0, 1, 2], {
      energy: 3,
      sleep: 3,
      mood: 3,
      hunger: 3,
      libido: 4,
    });
    expect(keys(evaluateSafety({ checkins: mild, workouts: [], today: TODAY }))).toContain(
      "fatigue",
    );
    expect(
      keys(evaluateSafety({ checkins: mild, workouts: [], today: TODAY, cutting: true })),
    ).not.toContain("fatigue");
  });

  it("flags poor sleep, low mood and a raised resting heart rate", () => {
    const c = replaceDays(normal(), [0, 1, 2, 3, 4, 5], { sleep: 2, mood: 2, rhr: 62 });
    const s = evaluateSafety({ checkins: c, workouts: [], today: TODAY });
    expect(keys(s)).toEqual(expect.arrayContaining(["sleep", "mood", "rhr"]));
    expect(s.level).toBe("caution");
  });

  it("flags a sudden jump in hard sets", () => {
    const usualWeeks: WorkoutDay[] = [8, 12, 15, 19, 22, 26, 29, 33].map((n) => ({
      date: day(n),
      hardSets: 10,
      joint: 1,
    }));
    const thisWeek: WorkoutDay[] = [0, 2, 4].map((n) => ({ date: day(n), hardSets: 12, joint: 1 }));
    const s = evaluateSafety({
      checkins: normal(),
      workouts: [...usualWeeks, ...thisWeek],
      today: TODAY,
    });
    expect(keys(s)).toEqual(["load"]);
    expect(s.level).toBe("watch");
  });

  it("flags joints strained after the last two workouts", () => {
    const w: WorkoutDay[] = [
      { date: day(5), hardSets: 12, joint: 1 },
      { date: day(3), hardSets: 12, joint: 3 },
      { date: day(1), hardSets: 12, joint: 4 },
    ];
    expect(keys(evaluateSafety({ checkins: normal(), workouts: w, today: TODAY }))).toEqual([
      "joint",
    ]);
  });

  it("raises a caution by itself when the same place hurts on 3 days this week", () => {
    const c = replaceDays(normal(), [0, 3], { pain_areas: ["knee"] });
    const w: WorkoutDay[] = [
      { date: day(5), hardSets: 10, joint: 2, pain_areas: ["knee", "elbow"] },
    ];
    const s = evaluateSafety({ checkins: c, workouts: w, today: TODAY });
    expect(keys(s)).toEqual(["pain:knee"]);
    expect(s.level).toBe("caution");
    expect(s.signals[0]!.title).toMatch(/膝/);
    expect(painLabel("lower_back")).toBe("腰");
  });

  it("needs enough history before judging against a normal", () => {
    const short = replaceDays(normal(5), [0, 1, 2], { energy: 1, sleep: 3, mood: 3 });
    expect(keys(evaluateSafety({ checkins: short, workouts: [], today: TODAY }))).not.toContain(
      "fatigue",
    );
  });
});
