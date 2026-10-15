import { describe, expect, it } from "vitest";
import { createWorkout, summarize, toRows, type ActiveWorkout } from "@/lib/workout";

const start = new Date("2026-10-15T09:00:00Z");

function sample(): ActiveWorkout {
  const w = createWorkout({
    title: "Push A",
    routineId: "r1",
    plan: [
      { exerciseId: "bench", targetSets: 3, restSec: 120 },
      { exerciseId: "incline", restSec: null },
      { exerciseId: "fly" },
    ],
    previousSetCount: (id) => (id === "incline" ? 4 : 0),
    now: start,
  });
  return w;
}

describe("createWorkout", () => {
  it("sizes sets from target, then previous, then the default", () => {
    const w = sample();
    expect(w.exercises.map((e) => e.sets.length)).toEqual([3, 4, 3]);
    expect(w.exercises.map((e) => e.restSec)).toEqual([120, 90, 90]);
    expect(w.startedAt).toBe(start.toISOString());
  });
});

describe("summarize / toRows", () => {
  function logged() {
    const w = sample();
    const bench = w.exercises[0]!.sets;
    Object.assign(bench[0]!, { setType: "warmup", weight: "60", reps: "10", doneAt: "t1" });
    Object.assign(bench[1]!, { weight: "100", reps: "8", rir: "2", doneAt: "t2" });
    Object.assign(bench[2]!, { weight: "100", reps: "9", rir: "1", doneAt: "t3" });
    Object.assign(w.exercises[1]!.sets[0]!, { weight: "36", reps: "10", doneAt: "t4" });
    // typed but never confirmed: not logged
    Object.assign(w.exercises[2]!.sets[0]!, { weight: "20", reps: "12" });
    return w;
  }

  it("summarizes only confirmed working sets", () => {
    const s = summarize(logged(), new Map([["bench", 125]]), new Date("2026-10-15T10:02:00Z"));
    expect(s.durationMin).toBe(62);
    expect(s.volumeKg).toBe(100 * 8 + 100 * 9 + 36 * 10);
    expect(s.setCount).toBe(3);
    expect(s.prs).toEqual([{ exerciseId: "bench", weightKg: 100, reps: 9 }]);
  });

  it("produces workout and set rows with set numbers and PR flags", () => {
    const w = logged();
    const rows = toRows(w, "u1", [2], "2026-10-15T10:02:00Z");
    expect(rows.workout).toMatchObject({ id: w.id, user_id: "u1", routine_id: "r1" });
    expect(rows.sets).toHaveLength(4);
    expect(rows.sets.map((s) => [s.exercise_id, s.set_no, s.set_type])).toEqual([
      ["bench", 1, "warmup"],
      ["bench", 2, "normal"],
      ["bench", 3, "normal"],
      ["incline", 1, "normal"],
    ]);
    expect(rows.sets.map((s) => s.is_pr)).toEqual([false, false, true, false]);
    expect(rows.sets[1]).toMatchObject({ weight_kg: 100, reps: 8, rir: 2, workout_id: w.id });
  });
});
