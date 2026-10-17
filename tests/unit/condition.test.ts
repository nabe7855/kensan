import { addDays, format, parseISO } from "date-fns";
import { describe, expect, it } from "vitest";
import {
  dailyWellness,
  isConcerning,
  shouldShowWhy,
  wellness,
  type DailyCondition,
} from "@/lib/condition";

describe("wellness / isConcerning", () => {
  it("uses 5 = good for every item, hunger included", () => {
    expect(wellness("hunger", 5)).toBe(5);
    expect(wellness("sleep", 5)).toBe(5);
  });

  it("flags 1 and 2 as low for every item", () => {
    expect(isConcerning("energy", 2)).toBe(true);
    expect(isConcerning("energy", 3)).toBe(false);
    expect(isConcerning("hunger", 2)).toBe(true);
    expect(isConcerning("hunger", 4)).toBe(false);
    expect(isConcerning("mood", null)).toBe(false);
  });
});

describe("dailyWellness", () => {
  it("averages recorded items on the wellness scale", () => {
    // hunger 2, sleep 3, mood 3, energy 2, libido 2 => 12 / 5
    expect(dailyWellness({ hunger: 2, sleep: 3, mood: 3, energy: 2, libido: 2 })).toBeCloseTo(2.4);
  });

  it("can exclude libido and skips missing items", () => {
    expect(dailyWellness({ sleep: 4, libido: 1 }, false)).toBe(4);
    expect(dailyWellness({})).toBeNull();
  });
});

describe("shouldShowWhy", () => {
  const today = "2026-10-31";
  const day = (offset: number, v: number): DailyCondition => ({
    date: format(addDays(parseISO(today), -offset), "yyyy-MM-dd"),
    sleep: v,
    mood: v,
    energy: v,
  });
  const baseline = Array.from({ length: 10 }, (_, i) => day(i + 3, 4));

  it("shows after 3 consecutive days below baseline", () => {
    expect(shouldShowWhy([...baseline, day(0, 3), day(1, 3), day(2, 3)], today)).toBe(true);
  });

  it("needs all 3 days, including today", () => {
    expect(shouldShowWhy([...baseline, day(1, 3), day(2, 3)], today)).toBe(false);
    expect(shouldShowWhy([...baseline, day(0, 4), day(1, 3), day(2, 3)], today)).toBe(false);
  });

  it("needs enough baseline data", () => {
    expect(shouldShowWhy([day(3, 5), day(0, 1), day(1, 1), day(2, 1)], today)).toBe(false);
  });
});
