"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppData } from "@/components/providers/AppDataProvider";
import { dailyWellness } from "@/lib/condition";
import { nextContest } from "@/lib/contest";
import { conditionLabel } from "@/lib/gauge";
import { dayTotals } from "@/lib/meal-plan";
import { dayTypeFor, targetFor } from "@/lib/nutrition";
import { kvGet } from "@/lib/offline/db";
import { addDaysISO, daysUntilContest, todayISO } from "@/lib/prep";
import { useCheckins } from "@/lib/queries/checkins";
import { useContests } from "@/lib/queries/contests";
import { useDayMeals, useDayOverride, useTargets } from "@/lib/queries/nutrition";
import { jstMidnight, useSessions } from "@/lib/queries/training";
import { recordedDays, trainingFrequency, weekStartISO } from "@/lib/rings";
import { jstDate } from "@/lib/sessions";

/** A number on the side of the dock. */
export type DockSide = { label: string; value: string; unit?: string; href: string };

/** The gauge in the middle: a 0–1 fill plus the big value and a caption. */
export type DockHero = {
  ratio: number;
  value: string;
  unit?: string;
  caption: string;
  href: string;
  /** Nothing recorded yet: grey gauge and a call to record. */
  empty?: boolean;
  warn?: boolean;
  aria: string;
};

export type DockMetrics = { left: DockSide; hero: DockHero; right: DockSide };

const PAGES = ["/home", "/training", "/nutrition", "/condition"] as const;
export type DockPage = (typeof PAGES)[number];

export function dockPage(pathname: string): DockPage | null {
  return (PAGES as readonly string[]).includes(pathname) ? (pathname as DockPage) : null;
}

const fmt = (n: number) => Math.round(n).toLocaleString("ja-JP");
const daysAgo = (date: string, today: string) => {
  const d = Math.round(
    (Date.parse(`${today}T00:00:00Z`) - Date.parse(`${date}T00:00:00Z`)) / 86_400_000,
  );
  return d === 0 ? "今日" : d === 1 ? "昨日" : `${d}日前`;
};

/** Left, centre and right numbers for each main tab; every one links to where it comes from. */
export function useDockMetrics(page: DockPage | null): DockMetrics | null {
  const today = todayISO();
  const { prep, trackLibido } = useAppData();
  const meals = useDayMeals(today);
  const targets = useTargets();
  const override = useDayOverride(today);
  const contests = useContests();
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
    if (!page) return null;
    const trainedDates = (sessions.data ?? []).map((s) => jstDate(s.started_at));
    const trained = trainedDates.includes(today);
    const target = targetFor(targets.data ?? [], today, dayTypeFor(trained, override.data ?? null));
    const { eaten } = dayTotals(meals.data ?? []);
    const todayCheckin = (checkins.data ?? []).find((c) => c.date === today) ?? null;
    const score = todayCheckin ? dailyWellness(todayCheckin, trackLibido) : null;

    const condition: DockHero =
      score === null
        ? {
            ratio: 0,
            value: "—",
            caption: "今日の体調を記録",
            href: "/condition",
            empty: true,
            aria: "今日の体調はまだ記録していません。タップで記録",
          }
        : {
            ratio: score / 5,
            value: score.toFixed(1),
            caption: `体調・${conditionLabel(score)}`,
            href: "/condition",
            warn: score <= 2,
            aria: `今日の体調 ${score.toFixed(1)}（5 段階）、${conditionLabel(score)}`,
          };
    const protein: DockSide = {
      label: "たんぱく質",
      value: fmt(eaten.protein_g),
      unit: target ? `/${fmt(target.protein_g)}g` : "g",
      href: "/nutrition",
    };

    switch (page) {
      case "/home": {
        const next = nextContest(contests.data ?? [], today);
        const contestDate = next?.date ?? prep?.contest_date ?? null;
        const left = contestDate !== null ? daysUntilContest(contestDate, today) : null;
        return {
          left: {
            label: "大会まで",
            value: left !== null && left >= 0 ? `あと${left}` : "未設定",
            unit: left !== null && left >= 0 ? "日" : undefined,
            href: next ? `/contest/${next.id}` : prep ? "/plan" : "/contest",
          },
          hero: condition,
          right: protein,
        };
      }
      case "/nutrition": {
        const ratio = target ? eaten.protein_g / target.protein_g : 0;
        const eatenMeals = (meals.data ?? []).filter((m) => m.eatenAt && m.items.length).length;
        return {
          left: {
            label: "カロリー",
            value: fmt(eaten.kcal),
            unit: target ? `/${fmt(target.kcal)}` : "kcal",
            href: "/nutrition",
          },
          hero: target
            ? {
                ratio,
                value: String(Math.round(ratio * 100)),
                unit: "%",
                caption: `たんぱく質 ${fmt(eaten.protein_g)}g`,
                href: "/nutrition",
                aria: `たんぱく質 ${Math.round(ratio * 100)}%`,
              }
            : {
                ratio: 0,
                value: "—",
                caption: "PFC 目標を設定",
                href: "/nutrition",
                empty: true,
                aria: "たんぱく質の目標が未設定",
              },
          right: {
            label: "食事",
            value: String(eatenMeals),
            unit: `/${mealsPerDay}食`,
            href: "/nutrition",
          },
        };
      }
      case "/training": {
        const f = trainingFrequency(trainedDates, today);
        const lastDate = [...trainedDates].sort().at(-1) ?? null;
        return {
          left: {
            label: "今日のトレ",
            value: trained ? "記録済み" : "まだ",
            href: "/training",
          },
          hero: {
            ratio: f.usual ? f.thisWeek / f.usual : f.thisWeek > 0 ? 1 : 0,
            value: String(f.thisWeek),
            unit: f.usual ? `/${f.usual}` : "回",
            caption: f.usual ? "今週・いつもの回数" : "今週のトレ",
            href: "/training",
            empty: f.thisWeek === 0 && !f.usual,
            aria: f.usual
              ? `今週 ${f.thisWeek} 回、いつもは週 ${f.usual} 回`
              : `今週 ${f.thisWeek} 回`,
          },
          right: {
            label: "最後のトレ",
            value: lastDate ? daysAgo(lastDate, today) : "なし",
            href: lastDate ? `/report/${lastDate}` : "/training",
          },
        };
      }
      case "/condition": {
        const weight = todayCheckin?.weight_kg ?? null;
        return {
          left: {
            label: "7日間の記録",
            value: String(
              recordedDays(
                (checkins.data ?? []).map((c) => c.date),
                today,
              ),
            ),
            unit: "/7日",
            href: "/condition",
          },
          hero: condition,
          right: {
            label: "今朝の体重",
            value: weight !== null ? weight.toFixed(1) : "—",
            unit: weight !== null ? "kg" : undefined,
            href: "/weight",
          },
        };
      }
    }
  }, [
    page,
    today,
    prep,
    trackLibido,
    meals.data,
    targets.data,
    override.data,
    contests.data,
    sessions.data,
    checkins.data,
    mealsPerDay,
  ]);
}
