import { daysUntilContest } from "./prep";

export type Contest = {
  id: string;
  name: string;
  date: string;
  category: string | null;
  location: string | null;
  note: string | null;
};

export type Routine = { id: string; title: string; days_before: number; daily: boolean };
export type Check = { task_key: string; on_date: string };

/** Suggested items by days before the contest. Each says why in one line. */
export const SUGGESTIONS = [
  {
    key: "entry",
    days: 28,
    title: "エントリーと選手登録の内容を確認する",
    note: "締切や必要書類の漏れは直前では取り返せないため",
  },
  {
    key: "routine",
    days: 28,
    title: "ポージングの流れ（順番・音源・時間）を決める",
    note: "流れが決まると、残りの期間を練習の質に使えるため",
  },
  {
    key: "suit",
    days: 21,
    title: "大会用の水着・パンツの規定とサイズを確認する",
    note: "体が絞れてサイズが変わるので、早めに試着しておく",
  },
  {
    key: "color",
    days: 14,
    title: "カラーリング剤を用意し、肌に合うか少量で試す",
    note: "当日に初めて使うと、肌荒れや色むらに対応できないため",
  },
  {
    key: "photo",
    days: 14,
    title: "ポーズ写真を撮って、前回と見比べる",
    note: "仕上がりの変化は鏡より写真の方が比べやすいため",
  },
  {
    key: "meals",
    days: 7,
    title: "前日と当日の食事を決め、同じものを一度試す",
    note: "お腹の張りや体調の変化を事前に確かめておくため",
  },
  {
    key: "steady",
    days: 7,
    title: "食事とトレの内容を大きく変えない",
    note: "急な水抜き・塩抜きは見た目と体調を崩しやすく、自己判断では行わない",
  },
  {
    key: "packing",
    days: 3,
    title: "持ち物を揃える（水着・カラーリング・タオル・補食・チューブ・書類）",
    note: "前日に慌てないよう、余裕のあるうちにまとめておく",
  },
  {
    key: "travel",
    days: 2,
    title: "会場までの移動と受付時間を確認する",
    note: "当日の流れが決まっていると、仕上げに集中できるため",
  },
  {
    key: "sleep",
    days: 1,
    title: "早めに寝る。新しいことは試さない",
    note: "直前の睡眠は見た目と集中に影響するため",
  },
  {
    key: "day",
    days: 0,
    title: "決めておいた食事とパンプアップの流れどおりに進める",
    note: "当日は準備したことをそのまま行うのが一番安定するため",
  },
] as const;

export type ChecklistItem = {
  key: string;
  title: string;
  note?: string;
  days: number;
  daily: boolean;
  own: boolean;
  done: boolean;
};

export type Checklist = { now: ChecklistItem[]; upcoming: ChecklistItem[]; done: ChecklistItem[] };

export const sysKey = (k: string) => `sys:${k}`;
export const ownKey = (id: string) => `own:${id}`;

/**
 * Items for a contest on `today`. One-off items open on their day and stay until checked;
 * daily routine items open on their day and reset every day until the contest.
 */
export function checklist(
  contestDate: string,
  today: string,
  routines: Routine[],
  checks: Check[],
): Checklist {
  const left = daysUntilContest(contestDate, today);
  const doneEver = new Set(checks.map((c) => c.task_key));
  const doneToday = new Set(checks.filter((c) => c.on_date === today).map((c) => c.task_key));

  const items: ChecklistItem[] = [
    ...SUGGESTIONS.map((s) => ({
      key: sysKey(s.key),
      title: s.title,
      note: s.note,
      days: s.days,
      daily: false,
      own: false,
    })),
    ...routines.map((r) => ({
      key: ownKey(r.id),
      title: r.title,
      days: r.days_before,
      daily: r.daily,
      own: true,
    })),
  ].map((i) => ({ ...i, done: i.daily ? doneToday.has(i.key) : doneEver.has(i.key) }));

  const byDays = (a: ChecklistItem, b: ChecklistItem) => b.days - a.days;
  const open = (i: ChecklistItem) => left <= i.days && (!i.daily || left >= 0);
  return {
    now: items.filter((i) => open(i) && !i.done).sort(byDays),
    upcoming: items.filter((i) => !open(i) && !i.done && left >= 0).sort(byDays),
    done: items.filter((i) => i.done).sort(byDays),
  };
}

/** The next contest on or after today, or null. */
export function nextContest<T extends { date: string }>(contests: T[], today: string): T | null {
  return (
    [...contests].filter((c) => c.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0] ??
    null
  );
}

/** "あと 23 日" / "今日" / "終了". */
export function countdownLabel(date: string, today: string): string {
  const d = daysUntilContest(date, today);
  return d > 0 ? `あと ${d} 日` : d === 0 ? "今日" : "終了";
}
