import { estimated1RM } from "./strength";

export type Phase = "bulk" | "maintain" | "cut";

type Lift = { weightKg: number | null; reps: number | null };
export type PastSet = Lift & { workoutId: string; setType: string; doneAt: string | null };

const working = (s: Lift & { setType: string }) =>
  s.setType !== "warmup" && (s.weightKg ?? 0) > 0 && (s.reps ?? 0) > 0;

/**
 * A rep PR: more reps than ever at this weight or heavier.
 * Needs at least one earlier set at this weight or heavier, so a brand-new weight is not one.
 */
export function isRepPR(set: Lift, history: (Lift & { setType: string })[]): boolean {
  if (!working({ ...set, setType: "normal" })) return false;
  const w = set.weightKg!;
  const r = set.reps!;
  const atOrAbove = history.filter((h) => working(h) && h.weightKg! >= w - 0.01);
  return atOrAbove.length > 0 && atOrAbove.every((h) => h.reps! < r);
}

/** Indexes of this session's rep PRs, keeping only the best one per weight. */
export function repPRIndexes(
  sets: (Lift & { setType: string; done: boolean })[],
  history: (Lift & { setType: string })[],
): number[] {
  const best = new Map<number, number>();
  sets.forEach((s, i) => {
    if (!s.done || s.setType === "warmup" || !isRepPR(s, history)) return;
    const key = Math.round(s.weightKg! * 100);
    const prev = best.get(key);
    if (prev === undefined || sets[prev]!.reps! < s.reps!) best.set(key, i);
  });
  return [...best.values()].sort((a, b) => a - b);
}

/** Best e1RM per past session, oldest first. */
export function sessionBests(history: PastSet[]): number[] {
  const byWorkout = new Map<string, { at: string; best: number }>();
  for (const s of history) {
    if (!working(s)) continue;
    const e = estimated1RM(s.weightKg!, s.reps!);
    const cur = byWorkout.get(s.workoutId);
    const at = s.doneAt ?? "";
    if (!cur) byWorkout.set(s.workoutId, { at, best: e });
    else byWorkout.set(s.workoutId, { at: at < cur.at ? at : cur.at, best: Math.max(cur.best, e) });
  }
  return [...byWorkout.values()].sort((a, b) => a.at.localeCompare(b.at)).map((x) => x.best);
}

export type PlateauNote = {
  kind: "stalled" | "dropping";
  title: string;
  reason: string;
  suggestions: string[];
};

const RECENT = 3;

/**
 * A note for the exercise, judged by the training phase:
 * bulk / maintain — no new best in the last 3 sessions;
 * cut — holding is fine, so only a clear drop (≥5% below the earlier best on average).
 */
export function plateauNote(bests: number[], phase: Phase): PlateauNote | null {
  if (bests.length < RECENT + 2) return null;
  const recent = bests.slice(-RECENT);
  const earlier = bests.slice(-(RECENT + 6), -RECENT);
  const earlierBest = Math.max(...earlier);
  const kg = (n: number) => `${n.toFixed(1)}kg`;

  if (phase === "cut") {
    const avg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const drop = (earlierBest - avg) / earlierBest;
    if (drop < 0.05) return null;
    const pct = Math.round(drop * 100);
    return {
      kind: "dropping",
      title: `推定1RMが ${pct}% 下がっています`,
      reason: `減量中は維持できていれば十分ですが、直近 ${RECENT} 回の平均 ${kg(avg)} が以前の最高 ${kg(earlierBest)} より ${pct}% 低いため`,
      suggestions: [
        "睡眠と空腹感の記録を見直す",
        "トレ前後の炭水化物を少し増やす",
        "セット数を 1〜2 減らし、重さは保つ",
      ],
    };
  }

  const recentBest = Math.max(...recent);
  if (recentBest > earlierBest + 0.01) return null;
  return {
    kind: "stalled",
    title: `${RECENT} 回続けて推定1RMが伸びていません`,
    reason: `直近 ${RECENT} 回の最高 ${kg(recentBest)} が、それ以前の最高 ${kg(earlierBest)} を超えていないため`,
    suggestions:
      phase === "bulk"
        ? [
            "重さか回数の目標を小さく刻む（+1 回、+1.25kg）",
            "似た種目に入れ替える",
            "1 週間ボリュームを落とす（ディロード）",
          ]
        : [
            "似た種目に入れ替える",
            "1 週間ボリュームを落とす（ディロード）",
            "回数の幅を変える（例：6〜8 回 → 10〜12 回）",
          ],
  };
}
