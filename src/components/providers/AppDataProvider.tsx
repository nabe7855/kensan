"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { usePathname, useRouter } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { decodeSplit, type PhaseDates, type PhaseSplit } from "@/lib/cut-phases";
import { getSupabase } from "@/lib/supabase/client";

export type ActivePrep = {
  id: string;
  contest_name: string;
  contest_date: string;
  start_date: string;
  start_weight_kg: number;
  target_weight_kg: number;
  weekly_rate_pct: number;
  why_text: string | null;
  /** Chosen phase lengths in weeks; null for the default split. */
  phase_split?: PhaseSplit | PhaseDates | null;
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

/** null: signed out. "onboarding": signed in, setup not finished. */
type Loaded = AppData | "onboarding" | null;

export const appDataKey = ["app-data"] as const;

async function fetchAppData(): Promise<Loaded> {
  const supabase = getSupabase();
  // Reads the session from cookies on the device; the middleware has already checked it.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const userId = session?.user.id;
  if (!userId) return null;

  const [profile, prep] = await Promise.all([
    supabase
      .from("profiles")
      .select(
        "display_name, onboarded_at, track_libido, meal_slots, show_rir, training_phase, plateau_alerts, muted_exercises",
      )
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("preps")
      .select(
        "id, contest_name, contest_date, start_date, start_weight_kg, target_weight_kg, weekly_rate_pct, why_text, phase_split",
      )
      .eq("is_active", true)
      .maybeSingle(),
  ]);
  if (profile.error) throw profile.error;
  if (prep.error) throw prep.error;
  const p = profile.data;
  if (!p?.onboarded_at) return "onboarding";
  return {
    userId,
    displayName: p.display_name ?? "",
    trackLibido: p.track_libido,
    mealSlots: p.meal_slots,
    showRir: p.show_rir,
    trainingPhase: p.training_phase as TrainingPhase,
    plateauAlerts: p.plateau_alerts,
    mutedExercises: p.muted_exercises,
    prep: prep.data ? { ...prep.data, phase_split: decodeSplit(prep.data.phase_split) } : null,
  };
}

const AppDataContext = createContext<AppData | null>(null);

/**
 * Profile and active prep for every screen. Loaded on the device (and kept in the persisted
 * query cache) so the app frame can be static and tabs switch without a server round trip.
 * Refreshed in the background on each navigation, so changes saved elsewhere show up.
 */
export function AppDataProvider({
  value,
  children,
}: {
  /** Fixed data, for tests and previews. */
  value?: AppData;
  children: React.ReactNode;
}) {
  if (value) return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
  return <LoadedAppData>{children}</LoadedAppData>;
}

function LoadedAppData({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const query = useQuery({ queryKey: appDataKey, queryFn: fetchAppData, staleTime: 0 });
  const { refetch } = query;
  // Whose session this device has now, so a cached profile of someone else is never shown.
  const [sessionUser, setSessionUser] = useState<string | null | undefined>(undefined);

  useEffect(() => {
    void getSupabase()
      .auth.getSession()
      .then(({ data }) => setSessionUser(data.session?.user.id ?? null));
  }, []);
  useEffect(() => {
    void refetch();
  }, [pathname, refetch]);

  const data = query.data;
  useEffect(() => {
    if (data === "onboarding") router.replace("/onboarding");
    else if (data === null || sessionUser === null) router.replace("/login");
  }, [data, sessionUser, router]);

  const ready = data && data !== "onboarding" && sessionUser && data.userId === sessionUser;
  if (!ready) {
    return query.isError && !data ? (
      <p className="text-warn mx-auto max-w-[480px] px-4 pt-6 text-sm">
        読み込めませんでした。電波の良い場所で開き直してください
      </p>
    ) : (
      <div className="mx-auto flex max-w-[480px] flex-col gap-3 px-4 pt-4" aria-busy>
        <div className="surface h-40 animate-pulse" />
        <div className="surface h-24 animate-pulse" />
        <div className="surface h-24 animate-pulse" />
      </div>
    );
  }
  return <AppDataContext.Provider value={data}>{children}</AppDataContext.Provider>;
}

export function useAppData(): AppData {
  const ctx = useContext(AppDataContext);
  if (!ctx) throw new Error("useAppData must be used inside AppDataProvider");
  return ctx;
}

/** Reload profile and prep after changing them (replaces router.refresh for this data). */
export function useRefreshAppData(): () => Promise<void> {
  const queryClient = useQueryClient();
  return useCallback(() => queryClient.invalidateQueries({ queryKey: appDataKey }), [queryClient]);
}
