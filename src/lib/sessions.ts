import type { PlanItem } from "./workout";

/** Body parts as people say them; each covers one or more tracked muscle groups. */
export const BODY_PARTS = [
  { key: "chest", label: "胸", groups: ["chest"] },
  { key: "back", label: "背中", groups: ["back", "traps"] },
  { key: "shoulders", label: "肩", groups: ["shoulders"] },
  { key: "arms", label: "腕", groups: ["biceps", "triceps", "forearms"] },
  { key: "legs", label: "脚", groups: ["quads", "hamstrings", "glutes", "calves"] },
  { key: "abs", label: "腹", groups: ["abs"] },
] as const;

export type BodyPart = (typeof BODY_PARTS)[number]["key"];

export type SessionSet = {
  id: string;
  exercise_id: string;
  set_no: number;
  set_type: string;
  weight_kg: number | null;
  reps: number | null;
  rir: number | null;
  is_pr: boolean;
  done_at: string | null;
  bodyweight_kg: number | null;
  exercise: { name_ja: string; muscle_groups: string[] } | null;
};

export type Session = {
  id: string;
  started_at: string;
  ended_at: string | null;
  pump: number | null;
  soreness: number | null;
  joint: number | null;
  load_feel: number | null;
  pain_areas?: string[];
  sets: SessionSet[];
};

/** Calendar date (YYYY-MM-DD) in Japan time for a timestamp. */
export function jstDate(iso: string): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Tokyo" }).format(new Date(iso));
}

const working = (s: SessionSet) => s.set_type !== "warmup";

/** Main body parts of a session (by working sets, most first, at most `max`). */
export function sessionParts(session: Pick<Session, "sets">, max = 3): BodyPart[] {
  const count = new Map<BodyPart, number>();
  for (const s of session.sets.filter(working)) {
    // The first listed muscle group is the prime mover; credit only that part.
    const prime = s.exercise?.muscle_groups[0];
    const part = BODY_PARTS.find((p) => (p.groups as readonly string[]).includes(prime ?? ""));
    if (part) count.set(part.key, (count.get(part.key) ?? 0) + 1);
  }
  return [...count.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([k]) => k);
}

export function partLabel(key: BodyPart): string {
  return BODY_PARTS.find((p) => p.key === key)!.label;
}

/** "胸・肩" for display. */
export function partsText(parts: BodyPart[]): string {
  return parts.map(partLabel).join("・");
}

/** Most recent session that trained `part` (sessions in any order). */
export function lastSessionFor(sessions: Session[], part: BodyPart): Session | null {
  return (
    [...sessions]
      .sort((a, b) => b.started_at.localeCompare(a.started_at))
      .find((s) => sessionParts(s, BODY_PARTS.length).includes(part)) ?? null
  );
}

/** Exercises of a session in the order they were done, with how many sets each. */
export function exercisesOf(session: Pick<Session, "sets">) {
  const order: { exerciseId: string; name: string; sets: SessionSet[] }[] = [];
  const ordered = [...session.sets].sort(
    (a, b) => (a.done_at ?? "").localeCompare(b.done_at ?? "") || a.set_no - b.set_no,
  );
  for (const s of ordered) {
    let entry = order.find((o) => o.exerciseId === s.exercise_id);
    if (!entry) {
      entry = { exerciseId: s.exercise_id, name: s.exercise?.name_ja ?? "", sets: [] };
      order.push(entry);
    }
    entry.sets.push(s);
  }
  return order;
}

/** Plan to repeat a session: same exercises, same number of sets. */
export function planFromSession(session: Pick<Session, "sets">): PlanItem[] {
  return exercisesOf(session).map((e) => ({ exerciseId: e.exerciseId, targetSets: e.sets.length }));
}

/** Total working volume (kg × reps). */
export function sessionVolume(session: Pick<Session, "sets">): number {
  return session.sets
    .filter(working)
    .reduce((sum, s) => sum + (s.weight_kg ?? 0) * (s.reps ?? 0), 0);
}
