import { dailyWellness, type ConditionValues } from "./condition";
import { addDaysISO } from "./prep";

export const PAIN_AREAS = [
  { key: "neck", label: "首" },
  { key: "shoulder", label: "肩" },
  { key: "elbow", label: "肘" },
  { key: "wrist", label: "手首" },
  { key: "lower_back", label: "腰" },
  { key: "hip", label: "股関節" },
  { key: "knee", label: "膝" },
  { key: "ankle", label: "足首" },
  { key: "other", label: "その他" },
] as const;

export type PainArea = (typeof PAIN_AREAS)[number]["key"];

export const painLabel = (key: string) => PAIN_AREAS.find((a) => a.key === key)?.label ?? key;

export type CheckinDay = ConditionValues & {
  date: string;
  rhr: number | null;
  pain_areas?: string[] | null;
};

export type WorkoutDay = {
  date: string;
  /** Working sets with reps (not warm-ups). */
  hardSets: number;
  /** Joint strain felt after the workout, 1 (low) – 4 (max). */
  joint: number | null;
  pain_areas?: string[] | null;
};

export type Signal = {
  key: string;
  title: string;
  /** One line on why, in numbers where possible. */
  reason: string;
  /** What to try. */
  tip: string;
  /** Pain that keeps coming back counts double; everything else counts once. */
  weight: 1 | 2;
};

export type Safety = { level: "none" | "watch" | "caution"; signals: Signal[] };

const mean = (xs: number[]) => xs.reduce((a, b) => a + b, 0) / xs.length;
const sd = (xs: number[]) => {
  const m = mean(xs);
  return Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / xs.length);
};
const inRange = (date: string, from: string, to: string) => date >= from && date <= to;
const f1 = (n: number) => n.toFixed(1);

/**
 * A safety net against overreaching, burnout and injury. Each sign is judged against the
 * person's own recent normal (not a population norm), and only signs that pile up raise a
 * caution — single bad days are normal. Advisory, never a diagnosis.
 */
export function evaluateSafety({
  checkins,
  workouts,
  today,
  trackLibido = true,
  cutting = false,
}: {
  checkins: CheckinDay[];
  workouts: WorkoutDay[];
  today: string;
  trackLibido?: boolean;
  cutting?: boolean;
}): Safety {
  const signals: Signal[] = [];
  const d = (n: number) => addDaysISO(today, -n);

  // 1. Overall fatigue: the last 3 days against the 4 weeks before.
  const scored = checkins
    .map((c) => ({ date: c.date, score: dailyWellness(c, trackLibido) }))
    .filter((x): x is { date: string; score: number } => x.score !== null);
  const recent = scored.filter((x) => inRange(x.date, d(2), today)).map((x) => x.score);
  const base = scored.filter((x) => inRange(x.date, d(30), d(3))).map((x) => x.score);
  if (recent.length >= 2 && base.length >= 10) {
    // A cut lowers how you feel by itself, so it takes a bigger dip to count.
    const threshold = Math.max(0.75, sd(base)) + (cutting ? 0.25 : 0);
    if (mean(base) - mean(recent) >= threshold) {
      signals.push({
        key: "fatigue",
        title: "疲れがたまっています",
        reason: `直近 3 日の体調 ${f1(mean(recent))} が、普段の ${f1(mean(base))} を大きく下回っています`,
        tip: "今週は強度を保ったままセット数を 2〜3 割減らす（ディロード）",
        weight: 1,
      });
    }
  }

  // 2. Mood: low most days this week, or well under the person's normal.
  const moodWeek = checkins.filter((c) => inRange(c.date, d(6), today) && c.mood != null);
  const moodBase = checkins
    .filter((c) => inRange(c.date, d(34), d(7)) && c.mood != null)
    .map((c) => c.mood!);
  const lowMoodDays = moodWeek.filter((c) => c.mood! <= 2).length;
  const moodDrop =
    moodWeek.length >= 4 &&
    moodBase.length >= 10 &&
    mean(moodBase) - mean(moodWeek.map((c) => c.mood!)) >= 1;
  if ((moodWeek.length >= 5 && lowMoodDays >= 4) || moodDrop) {
    signals.push({
      key: "mood",
      title: "気分の落ち込みが続いています",
      reason: `この 7 日のうち ${lowMoodDays} 日、気分が 2 以下でした`,
      tip: "休養日を 1 日足す。続くようならコーチに相談する",
      weight: 1,
    });
  }

  // 3. Sleep: poor on most of the last few nights.
  const sleepRecent = checkins
    .filter((c) => inRange(c.date, d(4), today) && c.sleep != null)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 4);
  const poorNights = sleepRecent.filter((c) => c.sleep! <= 2).length;
  if (sleepRecent.length >= 3 && poorNights >= 3) {
    signals.push({
      key: "sleep",
      title: "睡眠が足りていません",
      reason: `直近 ${sleepRecent.length} 日のうち ${poorNights} 日、睡眠が 2 以下でした`,
      tip: "トレの時間を早めるか、今夜は 30 分早く寝る",
      weight: 1,
    });
  }

  // 4. Resting heart rate up against the person's normal.
  const rhrRecent = checkins
    .filter((c) => inRange(c.date, d(2), today) && c.rhr != null)
    .map((c) => c.rhr!);
  const rhrBase = checkins
    .filter((c) => inRange(c.date, d(30), d(3)) && c.rhr != null)
    .map((c) => c.rhr!);
  if (rhrRecent.length >= 2 && rhrBase.length >= 7 && mean(rhrRecent) - mean(rhrBase) >= 5) {
    signals.push({
      key: "rhr",
      title: "安静時心拍が高めです",
      reason: `直近の平均 ${Math.round(mean(rhrRecent))} 拍が、普段の ${Math.round(mean(rhrBase))} 拍より高くなっています`,
      tip: "回復が追いついていないサインのことがあります。今日は軽めに",
      weight: 1,
    });
  }

  // 5. Training load jump: this week's hard sets against the 4 weeks before.
  const week = workouts
    .filter((w) => inRange(w.date, d(6), today))
    .reduce((s, w) => s + w.hardSets, 0);
  const before = workouts
    .filter((w) => inRange(w.date, d(34), d(7)))
    .reduce((s, w) => s + w.hardSets, 0);
  const usual = before / 4;
  if (usual >= 10 && week >= usual * 1.5) {
    signals.push({
      key: "load",
      title: "トレの量が急に増えています",
      reason: `この 7 日のハードセット ${week} が、普段の週 ${Math.round(usual)} の ${f1(week / usual)} 倍です`,
      tip: "急な増加はケガにつながりやすい。来週は普段の量に戻す",
      weight: 1,
    });
  }

  // 6. Joints: strain felt high after the last two workouts.
  const lastTwo = [...workouts]
    .filter((w) => w.joint != null)
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 2);
  if (lastTwo.length === 2 && lastTwo.every((w) => w.joint! >= 3) && lastTwo[0]!.date >= d(10)) {
    signals.push({
      key: "joint",
      title: "関節の負担が続いています",
      reason: "直近 2 回のトレで、関節の負担が「高」以上でした",
      tip: "痛む動きを避けて種目を変えるか、重さを下げて回数で追い込む",
      weight: 1,
    });
  }

  // 7. The same place hurting on several days this week (counts double).
  const painDays = new Map<string, Set<string>>();
  for (const x of [...checkins, ...workouts]) {
    if (!inRange(x.date, d(6), today)) continue;
    for (const area of x.pain_areas ?? []) {
      painDays.set(area, (painDays.get(area) ?? new Set()).add(x.date));
    }
  }
  for (const [area, days] of painDays) {
    if (days.size < 3) continue;
    signals.push({
      key: `pain:${area}`,
      title: `${painLabel(area)}の痛み・違和感が続いています`,
      reason: `この 7 日のうち ${days.size} 日、${painLabel(area)}に痛み・違和感を記録しています`,
      tip: "痛む動きは中止を。数日で引かない、腫れる、しびれる場合は医療機関に相談する",
      weight: 2,
    });
  }

  const total = signals.reduce((s, x) => s + x.weight, 0);
  return { level: total >= 2 ? "caution" : total === 1 ? "watch" : "none", signals };
}
