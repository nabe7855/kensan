export const SET_TYPES = [
  { key: "normal", short: "", label: "通常" },
  { key: "warmup", short: "W", label: "ウォームアップ" },
  { key: "drop", short: "D", label: "ドロップ" },
  { key: "superset", short: "S", label: "スーパーセット" },
  { key: "failure", short: "F", label: "失敗" },
] as const;

export type SetType = (typeof SET_TYPES)[number]["key"];

export function nextSetType(current: SetType): SetType {
  const i = SET_TYPES.findIndex((t) => t.key === current);
  return SET_TYPES[(i + 1) % SET_TYPES.length]!.key;
}

/** Epley estimated 1RM: w × (1 + reps/30). A single rep is the actual 1RM. */
export function estimated1RM(weightKg: number, reps: number): number {
  if (weightKg <= 0 || reps <= 0) return 0;
  if (reps === 1) return weightKg;
  return weightKg * (1 + reps / 30);
}

export type LoggedSet = {
  exerciseId: string;
  setType: SetType;
  weightKg: number | null;
  reps: number | null;
};

const counts = (s: LoggedSet) =>
  s.setType !== "warmup" && (s.weightKg ?? 0) > 0 && (s.reps ?? 0) > 0;

/** Total kg moved, excluding warm-ups. */
export function totalVolume(sets: LoggedSet[]): number {
  return sets.filter(counts).reduce((sum, s) => sum + s.weightKg! * s.reps!, 0);
}

/** Working sets (excluding warm-ups and empty sets). */
export function workingSetCount(sets: LoggedSet[]): number {
  return sets.filter(counts).length;
}

/** Best estimated 1RM per exercise. */
export function bestByExercise(sets: LoggedSet[]): Map<string, number> {
  const best = new Map<string, number>();
  for (const s of sets) {
    if (!counts(s)) continue;
    const e = estimated1RM(s.weightKg!, s.reps!);
    if (e > (best.get(s.exerciseId) ?? 0)) best.set(s.exerciseId, e);
  }
  return best;
}

/**
 * Index of the best set per exercise when it beats that exercise's previous best e1RM.
 * Exercises with no history never produce a PR.
 */
export function detectPRs(sets: LoggedSet[], previousBest: Map<string, number>): number[] {
  const bestIdx = new Map<string, number>();
  sets.forEach((s, i) => {
    if (!counts(s) || !previousBest.has(s.exerciseId)) return;
    const prev = bestIdx.get(s.exerciseId);
    const e = estimated1RM(s.weightKg!, s.reps!);
    if (prev === undefined || e > estimated1RM(sets[prev]!.weightKg!, sets[prev]!.reps!)) {
      bestIdx.set(s.exerciseId, i);
    }
  });
  return [...bestIdx.entries()]
    .filter(
      ([id, i]) => estimated1RM(sets[i]!.weightKg!, sets[i]!.reps!) > previousBest.get(id)! + 1e-9,
    )
    .map(([, i]) => i)
    .sort((a, b) => a - b);
}
