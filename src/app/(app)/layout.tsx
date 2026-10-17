import { redirect } from "next/navigation";
import { AppDataProvider, type TrainingPhase } from "@/components/providers/AppDataProvider";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { RestTimerProvider } from "@/components/providers/RestTimerProvider";
import { SyncProvider } from "@/components/providers/SyncProvider";
import { GlobalRestBar } from "@/components/rest/GlobalRestBar";
import { AppHeader } from "@/components/shell/AppHeader";
import { BottomTabBar } from "@/components/shell/BottomTabBar";
import { KeyboardWatcher } from "@/components/shell/KeyboardWatcher";
import { StatusStrip } from "@/components/shell/StatusStrip";
import { decodeSplit } from "@/lib/cut-phases";
import { getCurrentProfile } from "@/lib/profile";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, user, profile } = await getCurrentProfile();
  if (!profile?.onboarded_at) redirect("/onboarding");

  const { data: prep } = await supabase
    .from("preps")
    .select(
      "id, contest_name, contest_date, start_date, start_weight_kg, target_weight_kg, weekly_rate_pct, why_text, phase_split",
    )
    .eq("is_active", true)
    .maybeSingle();

  return (
    <QueryProvider>
      <AppDataProvider
        value={{
          userId: user.id,
          displayName: profile.display_name ?? "",
          trackLibido: profile.track_libido,
          mealSlots: profile.meal_slots,
          showRir: profile.show_rir,
          trainingPhase: profile.training_phase as TrainingPhase,
          plateauAlerts: profile.plateau_alerts,
          mutedExercises: profile.muted_exercises,
          prep: prep ? { ...prep, phase_split: decodeSplit(prep.phase_split) } : null,
        }}
      >
        <SyncProvider>
          <RestTimerProvider>
            <AppHeader />
            <main className="mx-auto w-full max-w-[480px] px-4 pt-4 pb-[calc(4rem+env(safe-area-inset-bottom)+1rem)]">
              {children}
              <GlobalRestBar />
              <StatusStrip />
            </main>
            <BottomTabBar />
            <KeyboardWatcher />
          </RestTimerProvider>
        </SyncProvider>
      </AppDataProvider>
    </QueryProvider>
  );
}
