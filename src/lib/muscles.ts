export const MUSCLE_GROUPS = [
  { key: "chest", label: "胸" },
  { key: "back", label: "背中" },
  { key: "shoulders", label: "肩" },
  { key: "traps", label: "僧帽筋" },
  { key: "biceps", label: "二頭" },
  { key: "triceps", label: "三頭" },
  { key: "forearms", label: "前腕" },
  { key: "abs", label: "腹" },
  { key: "quads", label: "大腿四頭" },
  { key: "hamstrings", label: "ハム" },
  { key: "glutes", label: "臀部" },
  { key: "calves", label: "カーフ" },
] as const;

export type MuscleGroup = (typeof MUSCLE_GROUPS)[number]["key"];

const LABELS = new Map<string, string>(MUSCLE_GROUPS.map((m) => [m.key, m.label]));

export function muscleLabel(key: string): string {
  return LABELS.get(key) ?? key;
}
