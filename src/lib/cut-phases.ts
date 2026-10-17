import { addDaysISO, weeksBetween } from "./prep";

export type PhaseKey = "early" | "mid" | "late" | "peak";

export type Phase = {
  key: PhaseKey;
  name: string;
  start: string;
  /** Last day of the phase (inclusive). */
  end: string;
  weeks: number;
  startKg: number;
  endKg: number;
  /** kg per week. */
  weeklyLossKg: number;
  /** % of body weight per week. */
  weeklyRatePct: number;
  kcal: number;
  kcalRange: [number, number];
  protein_g: number;
  fat_g: number;
  carb_g: number;
  /** One-line reason for this phase's numbers. */
  reason: string;
  /** Concrete habits for the phase. */
  tips: string[];
  /** The deficit hit the safety floor or carbs got very low: the plan is too aggressive. */
  tooFast: boolean;
};

export type PlanInput = {
  startDate: string;
  contestDate: string;
  startKg: number;
  targetKg: number;
  /** Maintenance kcal at the anchor (by default, at the start weight). */
  maintenanceKcal: number;
  /**
   * Where the maintenance figure was measured: the body weight then and the date. An estimate
   * from recent logs is "maintenance now", already reflecting the weight lost and the adaptation
   * so far, so later phases are only discounted from this point on. Defaults to the start.
   */
  anchor?: { kg: number; date: string } | null;
};

const KCAL_PER_KG = 7700;
/** Faster early (more fat, plus water and glycogen), slower late (protect muscle). */
const PACE = { early: 1.25, mid: 1.0, late: 0.75 } as const;
/** Metabolic adaptation by phase, on top of the lower body weight. */
const ADAPT = { early: 1, mid: 0.97, late: 0.94, peak: 0.94 } as const;
const PROTEIN_PER_KG = { early: 2.2, mid: 2.4, late: 2.6, peak: 2.6 } as const;
const FAT_PER_KG = { early: 0.8, mid: 0.7, late: 0.6, peak: 0.6 } as const;
const MIN_KCAL_PER_KG = 22;
const MIN_CARB_G = 80;

const NAMES: Record<PhaseKey, string> = {
  early: "初期",
  mid: "中期",
  late: "後期",
  peak: "最終調整",
};

const TIPS: Record<PhaseKey, string[]> = {
  early: [
    "トレの重量と強度を落とさない（筋肉を残す合図になる）",
    "食事の時間と量をそろえ、記録を習慣にする",
    "最初の 1〜2 週は水分で大きく落ちることがある。週平均で判断する",
  ],
  mid: [
    "週平均が 2 週続けて動かなければ、50〜100kcal だけ下げるか活動量を足す",
    "週 1 回、炭水化物を維持量まで戻す日（リフィード）を入れてもよい",
    "睡眠と空腹感の記録が悪化していないか確認する",
  ],
  late: [
    "ペースを落とし、たんぱく質を高めに保って筋肉を守る",
    "ポージング練習の時間を増やす",
    "疲労が強いときはボリュームを少し下げ、強度は保つ",
  ],
  peak: [
    "食事内容を大きく変えない。体重は前週までに落とし切っている前提",
    "水分や塩分を急に断つ方法は自己判断で行わない",
    "当日の食事・持ち物・ポージングの流れを決めておく",
  ],
};

const round50 = (n: number) => Math.round(n / 50) * 50;
const days = (a: string, b: string) => Math.round(weeksBetween(a, b) * 7);

/** Week counts for each phase. The last 7 days are the peak week; the rest splits ~35/35/30. */
export function phaseWeeks(totalWeeks: number): Partial<Record<PhaseKey, number>> {
  const w = Math.floor(totalWeeks);
  if (w < 2) return { late: Math.max(totalWeeks, 0) };
  const rest = w - 1;
  if (rest < 3) return { late: rest, peak: 1 };
  const early = Math.max(1, Math.round(rest * 0.35));
  const mid = Math.max(1, Math.round(rest * 0.35));
  return { early, mid, late: Math.max(1, rest - early - mid), peak: 1 };
}

/** Weeks the user chose for early, mid and the peak week; late takes whatever is left. */
export type PhaseSplit = { early: number; mid: number; peak: number };

/**
 * Week counts from a user's split, or null when it doesn't fit the prep
 * (late needs at least one week). Phases set to 0 weeks are left out.
 */
export function customWeeks(
  totalWeeks: number,
  split: PhaseSplit,
): Partial<Record<PhaseKey, number>> | null {
  const w = Math.floor(totalWeeks);
  const { early, mid, peak } = split;
  if ([early, mid, peak].some((n) => !Number.isInteger(n) || n < 0)) return null;
  const late = w - early - mid - peak;
  if (late < 1) return null;
  const weeks: Partial<Record<PhaseKey, number>> = { late };
  if (early) weeks.early = early;
  if (mid) weeks.mid = mid;
  if (peak) weeks.peak = peak;
  return weeks;
}

/** The default split as editable numbers. */
export function defaultSplit(totalWeeks: number): PhaseSplit {
  const w = phaseWeeks(totalWeeks);
  return { early: w.early ?? 0, mid: w.mid ?? 0, peak: w.peak ?? 0 };
}

/** Maintenance from logged intake and the weight trend (kg/day slope); null without enough data. */
export function estimateMaintenance(
  days: { date: string; kcal: number | null; weightKg: number | null }[],
): number | null {
  const intake = days.map((d) => d.kcal).filter((k): k is number => k != null && k >= 800);
  const weights = days.filter((d) => d.weightKg != null) as { date: string; weightKg: number }[];
  if (intake.length < 10 || weights.length < 7) return null;
  const x = weights.map((w) => new Date(`${w.date}T00:00:00Z`).getTime() / 86_400_000);
  if (Math.max(...x) - Math.min(...x) < 10) return null;
  const mx = x.reduce((a, b) => a + b, 0) / x.length;
  const my = weights.reduce((a, w) => a + w.weightKg, 0) / weights.length;
  let num = 0;
  let den = 0;
  weights.forEach((w, i) => {
    num += (x[i]! - mx) * (w.weightKg - my);
    den += (x[i]! - mx) ** 2;
  });
  const slope = den ? num / den : 0;
  const avg = intake.reduce((a, b) => a + b, 0) / intake.length;
  return round50(avg - slope * KCAL_PER_KG);
}

/** Rough maintenance from body weight alone, for when there is not enough logged data. */
export const maintenanceFromWeight = (kg: number) => round50(kg * 31);

/** Split the prep into early / mid / late / peak with a calorie and PFC guideline for each. */
/** Start dates picked on the calendar for mid, late and the peak week; early starts with the prep. */
export type PhaseDates = { mid: string; late: string; peak: string };

export function isPhaseDates(x: unknown): x is PhaseDates {
  if (!x || typeof x !== "object") return false;
  const d = x as Record<string, unknown>;
  return [d.mid, d.late, d.peak].every(
    (v) => typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v),
  );
}

const dayDiff = (a: string, b: string) =>
  Math.round((Date.parse(`${b}T00:00:00Z`) - Date.parse(`${a}T00:00:00Z`)) / 86_400_000);

/** Each phase needs at least one day, in order, ending the day before the contest. */
export function datesValid(start: string, contest: string, d: PhaseDates): boolean {
  return start < d.mid && d.mid < d.late && d.late < d.peak && d.peak < contest;
}

/** Phase lengths in (fractional) weeks from calendar dates, or null when they're out of order. */
export function weeksFromDates(
  start: string,
  contest: string,
  d: PhaseDates,
): Record<PhaseKey, number> | null {
  if (!datesValid(start, contest, d)) return null;
  return {
    early: dayDiff(start, d.mid) / 7,
    mid: dayDiff(d.mid, d.late) / 7,
    late: dayDiff(d.late, d.peak) / 7,
    peak: dayDiff(d.peak, contest) / 7,
  };
}

/** Starting dates for the editor: the default split, as dates. */
export function initialDates(start: string, contest: string): PhaseDates | null {
  const days = dayDiff(start, contest);
  if (days < 4) return null;
  // Same boundaries as the default plan when it has all four phases.
  const w = phaseWeeks(days / 7);
  if (w.early && w.mid && w.late && w.peak) {
    const mid = addDaysISO(start, w.early * 7);
    const late = addDaysISO(mid, w.mid * 7);
    return { mid, late, peak: addDaysISO(late, w.late * 7) };
  }
  // Short preps: split the days into four roughly equal parts.
  const q = Math.floor(days / 4);
  return {
    mid: addDaysISO(start, q),
    late: addDaysISO(start, q * 2),
    peak: addDaysISO(start, q * 3),
  };
}

/** Phase lengths as "6週2日". */
export function lengthLabel(from: string, toExclusive: string): string {
  const days = dayDiff(from, toExclusive);
  const w = Math.floor(days / 7);
  const r = days % 7;
  return w && r ? `${w}週${r}日` : w ? `${w}週` : `${r}日`;
}

export function planPhases(input: PlanInput, split?: PhaseSplit | PhaseDates | null): Phase[] {
  const { startDate, contestDate, startKg, targetKg, maintenanceKcal } = input;
  const total = weeksBetween(startDate, contestDate);
  if (total <= 0) return [];
  const weeks =
    (isPhaseDates(split)
      ? weeksFromDates(startDate, contestDate, split)
      : split && customWeeks(total, split)) ?? phaseWeeks(total);
  const loss = Math.max(0, startKg - targetKg);
  const keys = (["early", "mid", "late", "peak"] as const).filter((k) => weeks[k]);
  const share = keys.reduce(
    (s, k) => s + (k === "peak" ? 0 : weeks[k]! * PACE[k as keyof typeof PACE]),
    0,
  );

  // Phase bounds first, to find the phase the maintenance figure belongs to.
  const bounds: { key: PhaseKey; start: string; end: string }[] = [];
  for (let d = startDate, i = 0; i < keys.length; i++) {
    const key = keys[i]!;
    const end =
      i === keys.length - 1
        ? addDaysISO(contestDate, -1)
        : addDaysISO(d, Math.round(weeks[key]! * 7) - 1);
    bounds.push({ key, start: d, end });
    d = addDaysISO(end, 1);
  }
  const anchor = input.anchor ?? { kg: startKg, date: startDate };
  const anchorKey =
    bounds.find((b) => anchor.date >= b.start && anchor.date <= b.end)?.key ??
    (anchor.date < startDate ? keys[0]! : keys.at(-1)!);
  const anchorIndex = keys.indexOf(anchorKey);

  const phases: Phase[] = [];
  let date = startDate;
  let kg = startKg;
  for (const [index, key] of keys.entries()) {
    const w = weeks[key]!;
    const isLast = key === keys.at(-1);
    const end = isLast ? addDaysISO(contestDate, -1) : addDaysISO(date, Math.round(w * 7) - 1);
    const phaseLoss = key === "peak" || share === 0 ? 0 : (loss * w * PACE[key]) / share;
    const endKg = kg - phaseLoss;
    const midKg = (kg + endKg) / 2;
    const weeklyLossKg = w > 0 ? phaseLoss / w : 0;
    // Discount only what happens after the anchor; earlier phases never exceed it.
    const weightRatio = index > anchorIndex ? midKg / anchor.kg : Math.min(1, midKg / anchor.kg);
    const adaptRatio = Math.min(1, ADAPT[key] / ADAPT[anchorKey]);
    const maintenance = maintenanceKcal * weightRatio * adaptRatio;
    const floor = midKg * MIN_KCAL_PER_KG;
    const prev = phases.at(-1);
    let kcal =
      key === "peak" && prev ? prev.kcal : round50(maintenance - (weeklyLossKg * KCAL_PER_KG) / 7);
    let tooFast = false;
    if (kcal < floor) {
      kcal = round50(floor);
      tooFast = true;
    }
    const protein_g = Math.round(midKg * PROTEIN_PER_KG[key]);
    const fat_g = Math.round(midKg * FAT_PER_KG[key]);
    const carb_g = Math.max(0, Math.round((kcal - protein_g * 4 - fat_g * 9) / 4));
    if (carb_g < MIN_CARB_G) tooFast = true;
    const ratePct = (weeklyLossKg / kg) * 100;

    phases.push({
      key,
      name: NAMES[key],
      start: date,
      end,
      weeks: w,
      startKg: kg,
      endKg,
      weeklyLossKg,
      weeklyRatePct: ratePct,
      kcal,
      kcalRange: [kcal - 100, kcal + 100],
      protein_g,
      fat_g,
      carb_g,
      reason: reasonFor(key, ratePct, PROTEIN_PER_KG[key]),
      tips: TIPS[key],
      tooFast,
    });
    date = addDaysISO(end, 1);
    kg = endKg;
  }
  return phases;
}

function reasonFor(key: PhaseKey, ratePct: number, proteinPerKg: number): string {
  const r = ratePct.toFixed(2);
  switch (key) {
    case "early":
      return `体脂肪に余裕があり落ちやすい時期なので、週 ${r}% とやや速めに設定`;
    case "mid":
      return `代謝が下がり始める時期。体重に合わせて摂取を下げ、週 ${r}% を保つ`;
    case "late":
      return `筋肉を落としやすい時期なので週 ${r}% に緩め、たんぱく質を体重 ×${proteinPerKg}g に上げる`;
    case "peak":
      return "直前の大きな変更は体調と見た目を崩しやすいので、後期の摂取を保つ";
  }
}

/** The phase containing the date, if any. */
export function phaseOn(phases: Phase[], date: string): Phase | null {
  return phases.find((p) => p.start <= date && date <= p.end) ?? null;
}

/** Remaining days in the phase, including the date itself. */
export const daysLeftInPhase = (p: Phase, date: string) => days(date, p.end) + 1;
