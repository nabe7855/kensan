import { describe, expect, it } from "vitest";
import { costUsd, formatYen, monthRange, monthStartISO, toYen } from "@/lib/ai/cost";
import { readingToForm, type LabelReading } from "@/lib/ai/label-reading";

const reading = (over: Partial<LabelReading> = {}): LabelReading => ({
  found: true,
  name: "サラダチキン",
  basis: "serving",
  serving_name: "1袋",
  serving_grams: 110,
  kcal: 121,
  protein_g: 26.4,
  fat_g: 1.4,
  carb_g: 0.3,
  sugar_g: null,
  fiber_g: null,
  salt_g: 1.2,
  sodium_mg: null,
  ...over,
});

describe("readingToForm", () => {
  it("passes printed values through", () => {
    expect(readingToForm(reading())).toEqual({
      name: "サラダチキン",
      basis: "serving",
      servingName: "袋",
      servingGrams: "110",
      kcal: "121",
      protein_g: "26.4",
      fat_g: "1.4",
      carb_g: "0.3",
      fiber_g: "",
      salt_g: "1.2",
    });
  });

  it("adds 糖質 and 食物繊維 when 炭水化物 isn't printed", () => {
    const f = readingToForm(reading({ carb_g: null, sugar_g: 12.3, fiber_g: 4.1 }));
    expect(f.carb_g).toBe("16.4");
    expect(f.fiber_g).toBe("4.1");
  });

  it("converts ナトリウム to 食塩相当量", () => {
    expect(readingToForm(reading({ salt_g: null, sodium_mg: 480 })).salt_g).toBe("1.22");
  });

  it("keeps only known serving units and drops impossible numbers", () => {
    const f = readingToForm(reading({ serving_name: "1カップ", serving_grams: null, kcal: -1 }));
    expect(f.servingName).toBeNull();
    expect(f.servingGrams).toBe("");
    expect(f.kcal).toBe("");
  });
});

describe("AI cost", () => {
  it("prices Haiku 5.5 tokens", () => {
    expect(costUsd("claude-haiku-5-5", 2000, 300)).toBeCloseTo(0.00035, 8);
    expect(toYen(1)).toBe(150);
  });

  it("starts the month at UTC midnight on the 1st", () => {
    expect(monthStartISO(new Date("2026-11-18T03:00:00Z"))).toBe("2026-11-01T00:00:00.000Z");
  });
});

describe("monthRange", () => {
  it("parses a month and wraps across years", () => {
    const r = monthRange("2026-12", new Date("2026-11-21T00:00:00Z"));
    expect(r).toEqual({
      key: "2026-12",
      prev: "2026-11",
      next: "2027-01",
      since: "2026-12-01T00:00:00.000Z",
      until: "2027-01-01T00:00:00.000Z",
    });
  });

  it("falls back to this month", () => {
    expect(monthRange("bad", new Date("2026-11-21T00:00:00Z")).key).toBe("2026-11");
  });
});

describe("formatYen", () => {
  it("keeps a decimal under 10 yen", () => {
    expect(formatYen(0.00035)).toBe("0.1");
    expect(formatYen(1)).toBe("150");
  });
});
