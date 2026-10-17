import { BODY_PARTS, jstDate, type BodyPart, type Session } from "./sessions";

/** Weekly hard-set ranges for hypertrophy; arms and abs get indirect work, so lower. */
export const SET_RANGES: Record<BodyPart, [number, number]> = {
  chest: [10, 20],
  back: [10, 20],
  shoulders: [10, 20],
  arms: [8, 16],
  legs: [10, 20],
  abs: [6, 12],
};

export type PartWeek = { part: BodyPart; sets: number; days: number };

const hard = (s: Session["sets"][number]) => s.set_type !== "warmup" && (s.reps ?? 0) > 0;

/** Hard sets (working sets with reps) and training days per body part, by prime mover. */
export function weeklyPartSets(sessions: Session[]): PartWeek[] {
  const sets = new Map<BodyPart, number>();
  const days = new Map<BodyPart, Set<string>>();
  for (const session of sessions) {
    const day = jstDate(session.started_at);
    for (const s of session.sets) {
      if (!hard(s)) continue;
      const prime = s.exercise?.muscle_groups[0] ?? "";
      const part = BODY_PARTS.find((p) => (p.groups as readonly string[]).includes(prime))?.key;
      if (!part) continue;
      sets.set(part, (sets.get(part) ?? 0) + 1);
      days.set(part, (days.get(part) ?? new Set()).add(day));
    }
  }
  return BODY_PARTS.map((p) => ({
    part: p.key,
    sets: sets.get(p.key) ?? 0,
    days: days.get(p.key)?.size ?? 0,
  }));
}

export type RangeStatus = "below" | "in" | "above";

export function rangeStatus(sets: number, [min, max]: [number, number]): RangeStatus {
  return sets < min ? "below" : sets > max ? "above" : "in";
}

/** Protein per kg of body weight, one decimal; null without a weight. */
export function perKg(grams: number, bodyKg: number | null | undefined): number | null {
  if (!bodyKg || bodyKg <= 0) return null;
  return Math.round((grams / bodyKg) * 10) / 10;
}
