import type { Metadata } from "next";
import { serif } from "@/components/brand/fonts";
import { Logo } from "@/components/brand/Logo";
import { MeiForm } from "@/components/onboarding/MeiForm";
import { StepProgress } from "@/components/onboarding/StepProgress";
import { getCurrentProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

export const metadata: Metadata = { title: "銘を切る | 研鑽" };

export default async function NameStep() {
  const { profile } = await getCurrentProfile();

  return (
    <>
      <Logo size="md" />
      <div className="mt-6">
        <StepProgress step={1} />
      </div>
      <h2
        className={cn(serif.className, "mt-6 mb-8 text-center text-4xl font-bold tracking-wider")}
      >
        銘を切る
      </h2>
      <MeiForm defaultName={profile?.display_name ?? undefined} />
    </>
  );
}
