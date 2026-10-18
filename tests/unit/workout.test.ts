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

describe("reopening a finished workout", () => {
  const saved = {
    id: "w1",
    title: "胸",
    started_at: "2026-10-18T09:00:00Z",
    ended_at: "2026-10-18T10:00:00Z",
  };
  const set = (id: string, exercise_id: string, set_no: number, done_at: string, extra = {}) => ({
    id,
    exercise_id,
    set_no,
    set_type: "normal",
    weight_kg: 80,
    reps: 8,
    rir: null,
    done_at,
    ...extra,
  });

  it("rebuilds exercises in the order they were done, keeping ids and times", async () => {
    const { workoutFromSaved } = await import("@/lib/workout");
    const w = workoutFromSaved(saved, [
      set("b1", "dips", 1, "2026-10-18T09:30:00Z", { bodyweight_kg: 79.1, weight_kg: 89.1 }),
      set("a2", "bench", 2, "2026-10-18T09:10:00Z"),
      set("a1", "bench", 1, "2026-10-18T09:05:00Z"),
    ]);
    expect(w.id).toBe("w1");
    expect(w.exercises.map((e) => e.exerciseId)).toEqual(["bench", "dips"]);
    expect(w.exercises[0]!.sets.map((s) => s.id)).toEqual(["a1", "a2"]);
    expect(w.exercises[1]!.sets[0]).toMatchObject({ weight: "89.1", bw: 79.1 });
    expect(w.editing).toEqual({ endedAt: "2026-10-18T10:00:00Z", savedSetIds: ["b1", "a2", "a1"] });
  });

  it("lists sets to delete when they are removed or un-done", async () => {
    const { workoutFromSaved, removedSetIds } = await import("@/lib/workout");
    const w = workoutFromSaved(saved, [
      set("a1", "bench", 1, "2026-10-18T09:05:00Z"),
      set("a2", "bench", 2, "2026-10-18T09:10:00Z"),
      set("a3", "bench", 3, "2026-10-18T09:15:00Z"),
    ]);
    const edited = {
      ...w,
      exercises: [
        {
          ...w.exercises[0]!,
          sets: [w.exercises[0]!.sets[0]!, { ...w.exercises[0]!.sets[1]!, doneAt: null }],
        },
      ],
    };
    expect(removedSetIds(edited)).toEqual(["a2", "a3"]);
    expect(removedSetIds({ ...edited, editing: null })).toEqual([]);
  });
});

describe("bodyweight", () => {
  it("uses the day's weight, else the latest before it", async () => {
    const { bodyweightOn } = await import("@/lib/workout");
    const records = [
      { date: "2026-10-16", weight_kg: 79.4 },
      { date: "2026-10-17", weight_kg: null },
      { date: "2026-10-18", weight_kg: 79.1 },
      { date: "2026-10-19", weight_kg: 78.8 },
    ];
    expect(bodyweightOn(records, "2026-10-18")).toEqual({ kg: 79.1, date: "2026-10-18" });
    expect(bodyweightOn(records, "2026-10-17")).toEqual({ kg: 79.4, date: "2026-10-16" });
    expect(bodyweightOn(records, "2026-10-15")).toBeNull();
  });

  it("saves the body weight with the set", async () => {
    const { toRows } = await import("@/lib/workout");
    const w = {
      id: "w",
      routineId: null,
      title: "",
      startedAt: "2026-10-18T09:00:00Z",
      current: 0,
      rest: null,
      exercises: [
        {
          exerciseId: "dips",
          restSec: 90,
          sets: [
            {
              id: "s1",
              setType: "normal" as const,
              weight: "89.1",
              reps: "10",
              rir: "",
              doneAt: "2026-10-18T09:05:00Z",
              bw: 79.1,
            },
          ],
        },
      ],
    };
    expect(toRows(w, "u", [], "2026-10-18T10:00:00Z").sets[0]).toMatchObject({
      weight_kg: 89.1,
      bodyweight_kg: 79.1,
    });
  });
});
