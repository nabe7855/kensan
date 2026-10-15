import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { StepProgress } from "@/components/onboarding/StepProgress";
import { PrepForm } from "@/components/prep/PrepForm";
import { nextOnboardingStep } from "@/lib/onboarding";
import { todayISO } from "@/lib/prep";
import { getCurrentProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "プレップ設定 | 研鑽" };

export default async function PrepStep() {
  const { supabase, profile } = await getCurrentProfile();
  const step = nextOnboardingStep(profile);
  if (step === "name" || step === "body") redirect(`/onboarding/${step}`);

  const { data: latest } = await supabase
    .from("daily_checkins")
    .select("weight_kg")
    .not("weight_kg", "is", null)
    .order("date", { ascending: false })
    .limit(1)
    .maybeSingle();

  return (
    <>
      <StepProgress step={3} />
      <h2 className="mt-6 mb-6 text-center text-2xl font-bold">プレップ設定</h2>
      <PrepForm
        today={todayISO()}
        defaultStartKg={latest?.weight_kg ?? undefined}
        skipHref="/onboarding/done"
      />
    </>
  );
}
