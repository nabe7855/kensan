import { describe, expect, it } from "vitest";
import {
  daysLeftInPhase,
  estimateMaintenance,
  maintenanceFromWeight,
  phaseOn,
  phaseWeeks,
  planPhases,
} from "@/lib/cut-phases";

const input = {
  startDate: "2026-06-01",
  contestDate: "2026-10-19", // 20 weeks
  startKg: 80,
  targetKg: 70,
  maintenanceKcal: 2800,
};

describe("phaseWeeks", () => {
  it("keeps the last week as the peak week and splits the rest", () => {
    expect(phaseWeeks(20)).toEqual({ early: 7, mid: 7, late: 5, peak: 1 });
    expect(phaseWeeks(12)).toEqual({ early: 4, mid: 4, late: 3, peak: 1 });
    expect(phaseWeeks(3)).toEqual({ late: 2, peak: 1 });
    expect(phaseWeeks(1)).toEqual({ late: 1 });
  });
});

describe("planPhases", () => {
  const phases = planPhases(input);

  it("covers every day from start to the day before the contest", () => {
    expect(phases.map((p) => p.key)).toEqual(["early", "mid", "late", "peak"]);
    expect(phases[0]!.start).toBe("2026-06-01");
    expect(phases.at(-1)!.end).toBe("2026-10-18");
    for (let i = 1; i < phases.length; i++) {
      expect(phases[i]!.start > phases[i - 1]!.end).toBe(true);
    }
  });

  it("reaches the target weight and slows down phase by phase", () => {
    expect(phases.at(-1)!.endKg).toBeCloseTo(70, 5);
    const [early, mid, late, peak] = phases;
    expect(early!.weeklyLossKg).toBeGreaterThan(mid!.weeklyLossKg);
    expect(mid!.weeklyLossKg).toBeGreaterThan(late!.weeklyLossKg);
    expect(peak!.weeklyLossKg).toBe(0);
  });

  it("lowers calories and raises protein per kg as the prep goes on", () => {
    const [early, mid, late, peak] = phases;
    expect(early!.kcal).toBeGreaterThan(mid!.kcal);
    expect(mid!.kcal).toBeGreaterThanOrEqual(late!.kcal);
    expect(peak!.kcal).toBe(late!.kcal);
    expect(late!.protein_g / late!.startKg).toBeGreaterThan(early!.protein_g / early!.startKg);
    for (const p of phases) {
      expect(p.kcal % 50).toBe(0);
      expect(p.protein_g * 4 + p.fat_g * 9 + p.carb_g * 4).toBeCloseTo(p.kcal, -1);
      expect(p.reason.length).toBeGreaterThan(0);
      expect(p.tooFast).toBe(false);
    }
  });

  it("flags a plan that would need a crash diet", () => {
    const fast = planPhases({ ...input, contestDate: "2026-07-13", targetKg: 70 });
    expect(fast.some((p) => p.tooFast)).toBe(true);
    for (const p of fast)
      expect(p.kcal).toBeGreaterThanOrEqual(
        Math.round((((p.startKg + p.endKg) / 2) * 22) / 50) * 50 - 50,
      );
  });

  it("finds today's phase", () => {
    const p = phaseOn(phases, "2026-08-01")!;
    expect(p.key).toBe("mid");
    expect(daysLeftInPhase(p, p.end)).toBe(1);
    expect(phaseOn(phases, "2026-10-19")).toBeNull();
  });

  it("returns nothing for a contest in the past", () => {
    expect(planPhases({ ...input, contestDate: "2026-05-01" })).toEqual([]);
  });
});

describe("maintenance", () => {
  it("estimates from intake and the weight trend", () => {
    const days = Array.from({ length: 21 }, (_, i) => ({
      date: `2026-09-${String(i + 1).padStart(2, "0")}`,
      kcal: 2300,
      weightKg: 80 - i * 0.05, // -0.35 kg/week
    }));
    // 2300 + 0.05 * 7700 = 2685 → 2700
    expect(estimateMaintenance(days)).toBe(2700);
  });

  it("needs enough logged days", () => {
    expect(estimateMaintenance([{ date: "2026-09-01", kcal: 2300, weightKg: 80 }])).toBeNull();
    expect(maintenanceFromWeight(80)).toBe(2500);
  });
});

describe("custom phase split", () => {
  it("uses the chosen weeks and gives late the rest", async () => {
    const { customWeeks, defaultSplit, planPhases } = await import("@/lib/cut-phases");
    expect(customWeeks(20, { early: 4, mid: 8, peak: 2 })).toEqual({
      early: 4,
      mid: 8,
      late: 6,
      peak: 2,
    });
    expect(defaultSplit(20)).toEqual({ early: 7, mid: 7, peak: 1 });
    const phases = planPhases(input, { early: 4, mid: 8, peak: 2 });
    expect(phases.map((p) => [p.key, p.weeks])).toEqual([
      ["early", 4],
      ["mid", 8],
      ["late", 6],
      ["peak", 2],
    ]);
    expect(phases[1]!.start).toBe("2026-06-29");
    expect(phases.at(-1)!.end).toBe("2026-10-18");
    expect(phases.at(-1)!.endKg).toBeCloseTo(70, 5);
  });

  it("drops phases set to zero weeks", async () => {
    const { planPhases } = await import("@/lib/cut-phases");
    expect(planPhases(input, { early: 0, mid: 10, peak: 0 }).map((p) => p.key)).toEqual([
      "mid",
      "late",
    ]);
  });

  it("falls back to the default when the split doesn't fit", async () => {
    const { customWeeks, planPhases } = await import("@/lib/cut-phases");
    expect(customWeeks(20, { early: 10, mid: 9, peak: 1 })).toBeNull();
    expect(customWeeks(20, { early: -1, mid: 9, peak: 1 })).toBeNull();
    expect(planPhases(input, { early: 15, mid: 9, peak: 1 }).map((p) => p.weeks)).toEqual([
      7, 7, 5, 1,
    ]);
  });
});

describe("phase dates from the calendar", () => {
  it("turns start dates into phases that end where the next begins", async () => {
    const { planPhases } = await import("@/lib/cut-phases");
    const phases = planPhases(input, { mid: "2026-07-01", late: "2026-08-20", peak: "2026-10-10" });
    expect(phases.map((p) => [p.key, p.start, p.end])).toEqual([
      ["early", "2026-06-01", "2026-06-30"],
      ["mid", "2026-07-01", "2026-08-19"],
      ["late", "2026-08-20", "2026-10-09"],
      ["peak", "2026-10-10", "2026-10-18"],
    ]);
    expect(phases.at(-1)!.endKg).toBeCloseTo(70, 5);
  });

  it("rejects dates out of order and falls back to the default", async () => {
    const { datesValid, planPhases } = await import("@/lib/cut-phases");
    const bad = { mid: "2026-08-20", late: "2026-07-01", peak: "2026-10-10" };
    expect(datesValid("2026-06-01", "2026-10-19", bad)).toBe(false);
    expect(datesValid("2026-06-01", "2026-10-19", { ...bad, mid: "2026-06-01" })).toBe(false);
    expect(planPhases(input, bad).map((p) => p.weeks)).toEqual([7, 7, 5, 1]);
  });

  it("offers the default split as dates and labels lengths", async () => {
    const { initialDates, lengthLabel, isPhaseDates } = await import("@/lib/cut-phases");
    expect(initialDates("2026-06-01", "2026-10-19")).toEqual({
      mid: "2026-07-20",
      late: "2026-09-07",
      peak: "2026-10-12",
    });
    expect(lengthLabel("2026-06-01", "2026-07-17")).toBe("6週4日");
    expect(lengthLabel("2026-10-12", "2026-10-19")).toBe("1週");
    expect(isPhaseDates({ early: 3, mid: 4, peak: 1 })).toBe(false);
    expect(isPhaseDates({ mid: "2026-07-01", late: "2026-08-20", peak: "2026-10-10" })).toBe(true);
  });
});

describe("maintenance anchored to now", () => {
  // 8 weeks into the 20-week cut (mid phase), 76.5 kg, logs say maintenance is 2,600 kcal now.
  const now = { ...input, maintenanceKcal: 2600 };
  const anchor = { kg: 76.5, date: "2026-07-27" };

  it("matches the old result when anchored at the start", async () => {
    const { planPhases } = await import("@/lib/cut-phases");
    const atStart = planPhases({ ...input, anchor: { kg: input.startKg, date: input.startDate } });
    expect(atStart).toEqual(planPhases(input));
  });

  it("does not take the weight lost and the adaptation so far off twice", async () => {
    const { planPhases } = await import("@/lib/cut-phases");
    const doubled = planPhases(now);
    const anchored = planPhases({ ...now, anchor });
    const kcal = (list: typeof doubled, k: string) => list.find((p) => p.key === k)!.kcal;
    expect(kcal(anchored, "mid")).toBeGreaterThan(kcal(doubled, "mid"));
    expect(kcal(anchored, "late")).toBeGreaterThan(kcal(doubled, "late"));
    // Later phases still go down from here.
    expect(kcal(anchored, "late")).toBeLessThan(kcal(anchored, "mid"));
  });

  it("never puts a phase already behind us above the maintenance measured now", async () => {
    const { planPhases } = await import("@/lib/cut-phases");
    const [early] = planPhases({ ...now, anchor });
    const ceiling = Math.round((2600 - (early!.weeklyLossKg * 7700) / 7) / 50) * 50;
    expect(early!.kcal).toBe(ceiling);
  });
});
