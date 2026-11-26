import { describe, expect, it } from "vitest";
import { buildDailyFacts, DailyFactsSchema, jstTime, saltFromSodium } from "@/lib/ai/daily";

const rice = { kcal: 156, protein_g: 2.5, fat_g: 0.3, carb_g: 37.1, sodium_mg: 1 };
const soup = { kcal: 40, protein_g: 3, fat_g: 1, carb_g: 4, sodium_mg: 400 };
const bar = { kcal: 400, protein_g: 30, fat_g: 10, carb_g: 40, sodium_mg: null };

const checkin = (date: string, extra: Record<string, unknown> = {}) => ({
  date,
  weight_kg: 70,
  weighed_at: null as string | null,
  salt_level: null,
  sleep: 4,
  energy: 3,
  bowel: "good",
  ...extra,
});

describe("daily facts for the coach", () => {
  it("formats JST times", () => {
    expect(jstTime("2026-11-24T22:30:00.000Z")).toBe("07:30");
    expect(saltFromSodium(1000)).toBeCloseTo(2.54);
  });

  it("lists days in order with meals, salt and the morning weigh-in", () => {
    const days = buildDailyFacts({
      today: "2026-11-26",
      days: 3,
      checkins: [
        checkin("2026-11-26", {
          weighed_at: "2026-11-25T22:30:00.000Z",
          salt_level: "high",
        }),
        checkin("2026-11-23"),
      ],
      meals: [
        {
          date: "2026-11-25",
          eaten_at: "2026-11-25T12:00:00.000Z",
          items: [{ grams: 200, food: bar }],
        },
        {
          date: "2026-11-25",
          eaten_at: "2026-11-24T23:00:00.000Z",
          items: [
            { grams: 200, food: rice },
            { grams: 100, food: soup },
          ],
        },
      ],
    });
    expect(DailyFactsSchema.parse(days)).toEqual(days);
    // 11-24 has nothing; 11-23 is outside the 3-day window.
    expect(days.map((d) => d.date)).toEqual(["2026-11-25", "2026-11-26"]);

    const [mon, tue] = days;
    expect(mon!.weight_kg).toBeNull();
    expect(mon!.meals.map((m) => m.at)).toEqual(["08:00", "21:00"]);
    // kcal follows P·F·C when the label kcal is close (foodKcal).
    expect(mon!.meals[0]!.kcal).toBe(359);
    expect(mon!.salt_g).toBeCloseTo(1.0, 1);
    expect(mon!.salt_coverage).toBeCloseTo(359 / 1099, 2);

    expect(tue!.weighed_at).toBe("07:30");
    expect(tue!.prev_day_salt_feel).toBe("high");
    expect(tue!.meals).toEqual([]);
    expect(tue!.salt_g).toBeNull();
  });

  it("drops a weigh time without a weight and unknown values", () => {
    const [d] = buildDailyFacts({
      today: "2026-11-26",
      days: 1,
      checkins: [checkin("2026-11-26", { weight_kg: null, salt_level: "lots", bowel: "?" })],
      meals: [],
    });
    expect(d!.weighed_at).toBeNull();
    expect(d!.prev_day_salt_feel).toBeNull();
    expect(d!.bowel).toBeNull();
  });
});
