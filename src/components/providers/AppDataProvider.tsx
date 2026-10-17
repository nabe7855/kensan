"use client";

import { createContext, useContext } from "react";

export type ActivePrep = {
  id: string;
  contest_name: string;
  contest_date: string;
  start_date: string;
  start_weight_kg: number;
  target_weight_kg: number;
  weekly_rate_pct: number;
  why_text: string | null;
};

export type TrainingPhase = "bulk" | "maintain" | "cut";

export type AppData = {
  userId: string;
  displayName: string;
  trackLibido: boolean;
  mealSlots: string[];
  showRir: boolean;
  trainingPhase: TrainingPhase;
  plateauAlerts: boolean;
  mutedExercises: string[];
  prep: ActivePrep | null;
};

const AppDataContext = createContext<AppData | null>(null);

export function AppDataProvider({
  value,
  children,
}: {
  value: AppData;
  children: React.ReactNode;
}) {
  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used inside AppDataProvider");
  return ctx;
}
