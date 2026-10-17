import { describe, expect, it } from "vitest";
import {
  conditionHeatmap,
  heatLevel,
  mondayOf,
  volumeIntensity,
  weeklyWeightLine,
} from "@/lib/analysis";

describe("mondayOf", () => {
  it("returns the Monday of the week", () => {
    expect(mondayOf("2026-10-15")).toBe("2026-10-12"); // Thursday
    expect(mondayOf("2026-10-12")).toBe("2026-10-12"); // Monday
    expect(mondayOf("2026-10-18")).toBe("2026-10-12"); // Sunday
  });
});

describe("heatLevel / conditionHeatmap", () => {
  it("grades 1 (very low) to 5 (good) for every item", () => {
    expect(heatLevel("sleep", 1)).toBe("verylow");
    expect(heatLevel("sleep", 2)).toBe("low");
    expect(heatLevel("sleep", 3)).toBe("neutral");
    expect(heatLevel("sleep", 5)).toBe("good");
    expect(heatLevel("hunger", 1)).toBe("verylow");
    expect(heatLevel("hunger", 5)).toBe("good");
    expect(heatLevel("mood", null)).toBe("none");
  });

  it("builds items × 7 days, oldest first, with gaps", () => {
    const rows = conditionHeatmap(
      [
        { date: "2026-10-15", sleep: 2, mood: 4 },
        { date: "2026-10-10", sleep: 5 },
      ],
      "2026-10-15",
      false,
    );
    expect(rows.map((r) => r.key)).toEqual(["hunger", "sleep", "mood", "energy"]);
    const sleep = rows.find((r) => r.key === "sleep")!;
    expect(sleep.cells.map((c) => c.date)).toEqual([
      "2026-10-09",
      "2026-10-10",
      "2026-10-11",
      "2026-10-12",
      "2026-10-13",
      "2026-10-14",
      "2026-10-15",
    ]);
    expect(sleep.cells.map((c) => c.level)).toEqual([
      "none",
      "good",
      "none",
      "none",
      "none",
      "none",
      "low",
    ]);
  });
});

describe("volumeIntensity", () => {
  it("scales to 20 sets and clamps", () => {
    expect(volumeIntensity(0)).toBe(0);
    expect(volumeIntensity(10)).toBe(0.5);
    expect(volumeIntensity(30)).toBe(1);
  });
});

describe("weeklyWeightLine", () => {
  it("states the weekly average and change without judgement", () => {
    expect(
      weeklyWeightLine(
        { week_start: "w2", avg_weight: 71.8 },
        { week_start: "w1", avg_weight: 72.2 },
      ),
    ).toBe("今週の平均 71.8kg（前週比 −0.4kg）");
    expect(
      weeklyWeightLine(
        { week_start: "w2", avg_weight: 72.3 },
        { week_start: "w1", avg_weight: 72.2 },
      ),
    ).toBe("今週の平均 72.3kg（前週比 +0.1kg）");
    expect(weeklyWeightLine({ week_start: "w2", avg_weight: 72 }, null)).toBe("今週の平均 72.0kg");
    expect(weeklyWeightLine(null, null)).toBeNull();
  });
});
