import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { serif } from "@/components/brand/fonts";
import { Logo } from "@/components/brand/Logo";
import { StepProgress } from "@/components/onboarding/StepProgress";
import { Button } from "@/components/ui/button";
import { nextOnboardingStep } from "@/lib/onboarding";
import { getCurrentProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";
import { completeOnboarding } from "../actions";

export const metadata: Metadata = { title: "研ぎ始める | 研鑽" };

export default async function DoneStep() {
  const { profile } = await getCurrentProfile();
  const step = nextOnboardingStep(profile);
  if (step === "name" || step === "body") redirect(`/onboarding/${step}`);

  return (
    <form action={completeOnboarding} className="flex flex-1 flex-col items-center">
      <StepProgress step={4} />
      <div className="flex flex-1 flex-col items-center justify-center">
        <Logo />
        <p className="text-muted mt-12 text-xs">銘</p>
        <p className={cn(serif.className, "engrave mt-2 text-5xl font-black break-all")}>
          {profile?.display_name}
        </p>
      </div>
      <Button type="submit" size="lg" className="w-full">
        研ぎ始める
      </Button>
    </form>
  );
}
