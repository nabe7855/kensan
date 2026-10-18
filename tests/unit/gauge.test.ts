import { describe, expect, it } from "vitest";
import { conditionLabel, gaugeSegments } from "@/lib/gauge";

describe("gaugeSegments", () => {
  it("draws five tracks over the top half", () => {
    const s = gaugeSegments(50, 50, 40, 0);
    expect(s).toHaveLength(5);
    expect(s.every((x) => x.fill === null)).toBe(true);
    // Starts near the left end and ends near the right end, never below the centre line.
    expect(s[0]!.track.startsWith("M10.")).toBe(true);
    expect(s[4]!.track).toMatch(/ 89\.\d+ 4\d\.\d+$|89\.\d+ 5\d/);
  });

  it("lights whole segments for a 1–5 score and part of the next", () => {
    const four = gaugeSegments(50, 50, 40, 4 / 5);
    expect(four.map((x) => x.fill !== null)).toEqual([true, true, true, true, false]);
    expect(four[3]!.fill).toBe(four[3]!.track);
    const partial = gaugeSegments(50, 50, 40, 0.5);
    expect(partial.map((x) => x.fill !== null)).toEqual([true, true, true, false, false]);
    expect(partial[2]!.fill).not.toBe(partial[2]!.track);
  });

  it("clamps the ratio", () => {
    expect(gaugeSegments(50, 50, 40, 2).every((x) => x.fill === x.track)).toBe(true);
    expect(gaugeSegments(50, 50, 40, -1).every((x) => x.fill === null)).toBe(true);
  });
});

describe("conditionLabel", () => {
  it("names the average gently", () => {
    expect(conditionLabel(4.2)).toBe("良好");
    expect(conditionLabel(3)).toBe("ふつう");
    expect(conditionLabel(2.5)).toBe("やや低め");
    expect(conditionLabel(1.8)).toBe("低め");
  });
});
