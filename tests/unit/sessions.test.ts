import { describe, expect, it } from "vitest";
import {
  exercisesOf,
  jstDate,
  lastSessionFor,
  partsText,
  planFromSession,
  sessionParts,
  sessionVolume,
  type Session,
  type SessionSet,
} from "@/lib/sessions";

const ex = {
  bench: { name_ja: "ベンチプレス", muscle_groups: ["chest", "triceps", "shoulders"] },
  press: { name_ja: "ショルダープレス", muscle_groups: ["shoulders", "triceps"] },
  squat: { name_ja: "スクワット", muscle_groups: ["quads", "glutes"] },
};

let t = 0;
const set = (id: keyof typeof ex, setNo: number, w = 100, r = 8, type = "normal"): SessionSet => ({
  id: `${id}-${setNo}-${t}`,
  exercise_id: id,
  set_no: setNo,
  set_type: type,
  weight_kg: w,
  reps: r,
  rir: 2,
  is_pr: false,
  done_at: `2026-10-13T10:${String(t++).padStart(2, "0")}:00Z`,
  bodyweight_kg: null,
  exercise: ex[id],
});

const session = (id: string, started: string, sets: SessionSet[]): Session => ({
  id,
  started_at: started,
  ended_at: null,
  pump: null,
  soreness: null,
  joint: null,
  load_feel: null,
  sets,
});

const push = session("push", "2026-10-13T09:00:00Z", [
  set("bench", 1, 60, 10, "warmup"),
  set("bench", 2),
  set("bench", 3),
  set("bench", 4),
  set("press", 1, 40, 10),
  set("press", 2, 40, 10),
]);
const legs = session("legs", "2026-10-15T09:00:00Z", [
  set("squat", 1, 140, 5),
  set("squat", 2, 140, 5),
]);

describe("sessions", () => {
  it("names parts by the prime mover, most sets first, ignoring warm-ups", () => {
    expect(sessionParts(push)).toEqual(["chest", "shoulders"]);
    expect(partsText(sessionParts(push))).toBe("胸・肩");
  });

  it("finds the most recent session for a body part", () => {
    expect(lastSessionFor([legs, push], "chest")?.id).toBe("push");
    expect(lastSessionFor([legs, push], "legs")?.id).toBe("legs");
    expect(lastSessionFor([legs, push], "back")).toBeNull();
  });

  it("lists exercises in the order done and plans the same session", () => {
    expect(exercisesOf(push).map((e) => [e.name, e.sets.length])).toEqual([
      ["ベンチプレス", 4],
      ["ショルダープレス", 2],
    ]);
    expect(planFromSession(push)).toEqual([
      { exerciseId: "bench", targetSets: 4 },
      { exerciseId: "press", targetSets: 2 },
    ]);
  });

  it("sums working volume and converts to the JST date", () => {
    expect(sessionVolume(push)).toBe(3 * 800 + 2 * 400);
    expect(jstDate("2026-10-13T16:00:00Z")).toBe("2026-10-14");
  });
});
