import { describe, expect, it } from "vitest";
import { addTime, formatRest, progress, remainingSec, startTimer } from "@/lib/rest-timer";

describe("rest timer", () => {
  const now = 1_000_000;

  it("counts down from the start", () => {
    const t = startTimer(90, now);
    expect(remainingSec(t, now)).toBe(90);
    expect(remainingSec(t, now + 30_000)).toBe(60);
    expect(remainingSec(t, now + 120_000)).toBe(0);
    expect(progress(t, now + 45_000)).toBeCloseTo(0.5);
  });

  it("adds and removes time without going into the past", () => {
    const t = startTimer(60, now);
    expect(remainingSec(addTime(t, 30, now), now)).toBe(90);
    expect(remainingSec(addTime(t, -120, now), now)).toBe(0);
  });

  it("formats as m:ss, rounding up", () => {
    expect(formatRest(102)).toBe("1:42");
    expect(formatRest(0.2)).toBe("0:01");
    expect(formatRest(0)).toBe("0:00");
  });
});

describe("presets", () => {
  it("adds unique, sorted presets and keeps at least one", async () => {
    const { addPreset, removePreset, presetLabel } = await import("@/lib/rest-timer");
    expect(addPreset([60, 120], 90)).toEqual([60, 90, 120]);
    expect(addPreset([60, 90], 90)).toEqual([60, 90]);
    expect(addPreset([60], 2)).toEqual([60]); // too short
    expect(removePreset([60, 90], 60)).toEqual([90]);
    expect(removePreset([60], 60)).toEqual([60]);
    expect([45, 90, 120].map(presetLabel)).toEqual(["45秒", "1分30秒", "2分"]);
  });
});
