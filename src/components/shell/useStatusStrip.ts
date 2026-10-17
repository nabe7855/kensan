"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { dayTotals } from "@/lib/meal-plan";
import { dayTypeFor, isOver, targetFor } from "@/lib/nutrition";
import { kvGet } from "@/lib/offline/db";
import { addDaysISO, daysUntilContest, todayISO } from "@/lib/prep";
import { useCheckins } from "@/lib/queries/checkins";
import { useDayMeals, useDayOverride, useTargets } from "@/lib/queries/nutrition";
import { jstMidnight, useSessions } from "@/lib/queries/training";
import {
  prepProgress,
  recordedDays,
  ringProgress,
  trainingFrequency,
  weekStartISO,
  type Ring,
} from "@/lib/rings";
import { jstDate } from "@/lib/sessions";

export type StripItem = {
  key: string;
  label: string;
  value: string;
  ring: Ring | null;
  /** Centre of the ring: a percentage, or a check for done / not done. */
  centre: "pct" | "check";
  warn?: boolean;
  aria: string;
};

const PAGES = ["/home", "/training", "/nutrition", "/condition"] as const;
export type StripPage = (typeof PAGES)[number];

export function stripPage(pathname: string): StripPage | null {
  return (PAGES as readonly string[]).includes(pathname) ? (pathname as StripPage) : null;
}

const done = (d: boolean): Ring => ({ ratio: d ? 1 : 0, pct: d ? 100 : 0 });

/** The two or three numbers that matter most on each tab, as rings. */
export function useStatusStrip(page: StripPage | null): StripItem[] {
  const today = todayISO();
  const { prep } = useAppData();
  const meals = useDayMeals(today);
  const targets = useTargets();
  const override = useDayOverride(today);
  const sessions = useSessions(
    jstMidnight(addDaysISO(weekStartISO(today), -28)),
    jstMidnight(addDaysISO(today, 1)),
  );
  const checkins = useCheckins(addDaysISO(today, -6), today);
  const [mealsPerDay, setMealsPerDay] = useState(3);
  useEffect(() => {
    void kvGet<number>("mealsPerDay").then((n) => n && setMealsPerDay(n));
  }, [page]);

  return useMemo(() => {
    if (!page) return [];
    const trainedDates = (sessions.data ?? []).map((s) => jstDate(s.started_at));
    const trained = trainedDates.includes(today);
    const target = targetFor(targets.data ?? [], today, dayTypeFor(trained, override.data ?? null));
    const { eaten } = dayTotals(meals.data ?? []);
    const checkinDates = (checkins.data ?? []).map((c) => c.date);
    const checkedIn = checkinDates.includes(today);

    const protein = ringProgress(eaten.protein_g, target?.protein_g);
    const proteinItem: StripItem = {
      key: "protein",
      label: "たんぱく質",
      value: target
        ? `${Math.round(eaten.protein_g)}/${Math.round(target.protein_g)}g`
        : "目標未設定",
      ring: protein,
      centre: "pct",
      aria: protein ? `たんぱく質 ${protein.pct}%` : "たんぱく質の目標が未設定",
    };
    const conditionToday: StripItem = {
      key: "checkin",
      label: "今日の体調",
      value: checkedIn ? "記録済み" : "まだ",
      ring: done(checkedIn),
      centre: "check",
      aria: checkedIn ? "今日の体調は記録済み" : "今日の体調はまだ",
    };

    switch (page) {
      case "/home": {
        const left = prep ? daysUntilContest(prep.contest_date, today) : null;
        const progress = prep ? prepProgress(prep.start_date, prep.contest_date, today) : null;
        return [
          {
            key: "prep",
            label: prep ? prep.contest_name : "減量計画",
            value: left !== null && left >= 0 ? `あと${left}日` : "未設定",
            ring: progress,
            centre: "pct",
            aria: progress ? `減量計画 ${progress.pct}% 経過` : "減量計画は未設定",
          },
          proteinItem,
          conditionToday,
        ];
      }
      case "/training": {
        const f = trainingFrequency(trainedDates, today);
        const week = f.usual ? ringProgress(f.thisWeek, f.usual) : null;
        return [
          {
            key: "today",
            label: "今日のトレ",
            value: trained ? "記録済み" : "まだ",
            ring: done(trained),
            centre: "check",
            aria: trained ? "今日のトレは記録済み" : "今日のトレはまだ",
          },
          {
            key: "week",
            label: f.usual ? "今週（いつもの回数）" : "今週",
            value: f.usual ? `${f.thisWeek}/${f.usual}回` : `${f.thisWeek}回`,
            ring: week,
            centre: "pct",
            aria: f.usual
              ? `今週 ${f.thisWeek} 回、いつもは週 ${f.usual} 回`
              : `今週 ${f.thisWeek} 回`,
          },
        ];
      }
      case "/nutrition": {
        const kcal = ringProgress(eaten.kcal, target?.kcal);
        const eatenMeals = (meals.data ?? []).filter((m) => m.eatenAt && m.items.length).length;
        return [
          proteinItem,
          {
            key: "kcal",
            label: "カロリー",
            value: target ? `${Math.round(eaten.kcal)}/${Math.round(target.kcal)}` : "目標未設定",
            ring: kcal,
            centre: "pct",
            warn: !!target && isOver("kcal", eaten.kcal, target.kcal),
            aria: kcal ? `カロリー ${kcal.pct}%` : "カロリーの目標が未設定",
          },
          {
            key: "meals",
            label: "食事",
            value: `${eatenMeals}/${mealsPerDay}食`,
            ring: ringProgress(eatenMeals, mealsPerDay),
            centre: "pct",
            aria: `食事 ${eatenMeals} / ${mealsPerDay} 食`,
          },
        ];
      }
      case "/condition": {
        const n = recordedDays(checkinDates, today);
        return [
          conditionToday,
          {
            key: "week",
            label: "7日間の記録",
            value: `${n}/7日`,
            ring: ringProgress(n, 7),
            centre: "pct",
            aria: `直近 7 日のうち ${n} 日記録`,
          },
        ];
      }
    }
  }, [
    page,
    today,
    prep,
    meals.data,
    targets.data,
    override.data,
    sessions.data,
    checkins.data,
    mealsPerDay,
  ]);
}
