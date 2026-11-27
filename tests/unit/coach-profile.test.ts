import { describe, expect, it } from "vitest";
import { buildCoachProfile, CoachProfileSchema } from "@/lib/ai/coach";
import { mealTime } from "@/lib/ai/daily";
import { weightLooksOff } from "@/lib/condition";
import { ageFrom, bmrMifflin } from "@/lib/energy";

describe("coach profile", () => {
  it("works out age and BMR in the app", () => {
    expect(ageFrom(2002, "2026-11-26")).toBe(24);
    expect(ageFrom(null, "2026-11-26")).toBeNull();
    expect(ageFrom(2024, "2026-11-26")).toBeNull();
    // 10*77.8 + 6.25*177 - 5*24 + 5 = 1769.25
    expect(bmrMifflin({ weightKg: 77.8, heightCm: 177, age: 24, sex: "male" })).toBe(1770);
    expect(bmrMifflin({ weightKg: 77.8, heightCm: 177, age: null, sex: "male" })).toBeNull();
  });

  it("builds a valid profile, leaving unknowns null", () => {
    const p = buildCoachProfile({
      heightCm: 177,
      sex: "male",
      birthYear: 2002,
      today: "2026-11-26",
      weightAvgKg: 77.8,
      maintenanceKcal: 2600,
    });
    expect(CoachProfileSchema.parse(p)).toEqual(p);
    expect(p).toMatchObject({ age: 24, bmr_kcal: 1770, maintenance_kcal: 2600 });

    const empty = buildCoachProfile({
      heightCm: null,
      sex: "x",
      birthYear: null,
      today: "2026-11-26",
      weightAvgKg: 77.8,
      maintenanceKcal: null,
    });
    expect(empty).toEqual({
      height_cm: null,
      sex: null,
      age: null,
      bmr_kcal: null,
      maintenance_kcal: null,
    });
  });
});

describe("meal times and weight checks", () => {
  it("shows a late snack filed under the day before as 25:30", () => {
    expect(mealTime("2026-11-25", "2026-11-25T16:30:00.000Z")).toBe("25:30");
    expect(mealTime("2026-11-25", "2026-11-24T23:00:00.000Z")).toBe("08:00");
  });

  it("double-checks only big jumps from the last weight", () => {
    expect(weightLooksOff(80.5, 77.8)).toBe(true);
    expect(weightLooksOff(78.9, 77.8)).toBe(false);
    expect(weightLooksOff(7.8, 77.8)).toBe(true);
    expect(weightLooksOff(77.8, null)).toBe(false);
  });
});
