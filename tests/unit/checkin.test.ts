import { describe, expect, it } from "vitest";
import {
  adjustedTargets,
  buildCheckinFacts,
  CheckinFactsSchema,
  kcalDelta,
  lastWeekStart,
  type CheckinFacts,
  type CheckinInput,
} from "@/lib/ai/checkin";
import { addDaysISO } from "@/lib/prep";

const WEEK = "2026-11-09"; // Monday
const day = (offset: number) => addDaysISO(WEEK, offset);

function input(over: Partial<CheckinInput> = {}): CheckinInput {
  const checkins = [
    ...Array.from({ length: 7 }, (_, i) => ({
      date: day(i - 7),
      weight_kg: 80,
      sleep: 3,
      mood: 3,
      energy: 3,
      hunger: 3,
      rhr: 55,
    })),
    ...Array.from({ length: 7 }, (_, i) => ({
      date: day(i),
      weight_kg: 79.6,
      sleep: 4,
      mood: 3,
      energy: 4,
      hunger: 2,
      rhr: 56,
      pain_areas: i < 2 ? ["knee"] : [],
    })),
  ];
  return {
    weekStart: WEEK,
    phase: "cut",
    prep: { contestDate: "2027-03-01", weeklyRatePct: 0.5 },
    checkins,
    macros: Object.fromEntries(
      Array.from({ length: 5 }, (_, i) => [
        day(i),
        { kcal: 2000, protein_g: 160, fat_g: 50, carb_g: 225 },
      ]),
    ),
    targets: [
      {
        effective_from: "2026-10-01",
        day_type: "train",
        kcal: 2100,
        protein_g: 160,
        fat_g: 50,
        carb_g: 250,
      },
      {
        effective_from: "2026-10-01",
        day_type: "off",
        kcal: 1900,
        protein_g: 160,
        fat_g: 50,
        carb_g: 200,
      },
    ],
    workouts: [
      { date: day(0), hardSets: 20 },
      { date: day(2), hardSets: 18 },
      { date: day(-5), hardSets: 15 },
    ],
    safety: { level: "none", signals: [] },
    ...over,
  };
}

const facts = (over: Partial<CheckinInput> = {}) => buildCheckinFacts(input(over));

describe("buildCheckinFacts", () => {
  it("summarises the week against the one before", () => {
    const f = facts();
    expect(CheckinFactsSchema.parse(f)).toEqual(f);
    expect(f.weight).toEqual({ avg: 79.6, prev_avg: 80, days: 7, prev_days: 7, change_pct: -0.5 });
    expect(f.nutrition.days_logged).toBe(5);
    expect(f.nutrition.avg).toEqual({ kcal: 2000, protein_g: 160, fat_g: 50, carb_g: 225 });
    // 2 training days at 2100 and 5 off days at 1900.
    expect(f.nutrition.target_avg?.kcal).toBe(1957);
    expect(f.training).toEqual({ sessions: 2, hard_sets: 38, prev_hard_sets: 15 });
    expect(f.condition.sleep).toBe(4);
    expect(f.condition.prev_sleep).toBe(3);
    expect(f.pain).toEqual([{ area: "knee", days: 2 }]);
    expect(f.prep?.days_to_contest).toBe(106);
  });

  it("leaves averages empty when nothing was recorded", () => {
    const f = facts({ checkins: [], macros: {}, workouts: [] });
    expect(f.weight.change_pct).toBeNull();
    expect(f.nutrition.avg).toBeNull();
    expect(f.condition.days).toBe(0);
  });
});

describe("kcalDelta", () => {
  const withChange = (change_pct: number, over: Partial<CheckinFacts> = {}): CheckinFacts => {
    const f = facts();
    return { ...f, weight: { ...f.weight, change_pct }, ...over };
  };

  it("keeps calories when the loss is within range", () => {
    expect(kcalDelta(withChange(-0.5))).toBe(0);
    expect(kcalDelta(withChange(-0.3))).toBe(0);
  });

  it("suggests eating less when the loss is clearly slower", () => {
    expect(kcalDelta(withChange(-0.1))).toBe(-100);
  });

  it("suggests eating more when the loss is clearly faster", () => {
    expect(kcalDelta(withChange(-1.0))).toBe(100);
  });

  it("never cuts while the safety net is raised", () => {
    const f = withChange(0.2);
    expect(kcalDelta({ ...f, safety: { level: "caution", signals: ["fatigue"] } })).toBe(0);
  });

  it("needs enough weigh-ins and food logs", () => {
    const f = withChange(0.2);
    expect(kcalDelta({ ...f, nutrition: { ...f.nutrition, days_logged: 3 } })).toBe(0);
    expect(kcalDelta({ ...f, phase: "maintain" })).toBe(0);
    expect(kcalDelta({ ...f, prep: null })).toBe(0);
  });
});

describe("adjustedTargets", () => {
  it("moves the change into carbs for both day types", () => {
    expect(adjustedTargets(input().targets, "2026-11-16", -100)).toEqual([
      { day_type: "train", kcal: 2000, protein_g: 160, fat_g: 50, carb_g: 225 },
      { day_type: "off", kcal: 1800, protein_g: 160, fat_g: 50, carb_g: 175 },
    ]);
  });

  it("refuses when carbs would get too low", () => {
    const low = input().targets.map((t) => ({ ...t, carb_g: 60 }));
    expect(adjustedTargets(low, "2026-11-16", -100)).toBeNull();
    expect(adjustedTargets([], "2026-11-16", 100)).toBeNull();
  });
});

it("reviews the week before this one", () => {
  expect(lastWeekStart("2026-11-16")).toBe("2026-11-09");
});
