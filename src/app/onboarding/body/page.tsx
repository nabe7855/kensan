import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BodyForm } from "@/components/onboarding/BodyForm";
import { StepProgress } from "@/components/onboarding/StepProgress";
import { getCurrentProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "身体 | 研鑽" };

export default async function BodyStep() {
  const { profile } = await getCurrentProfile();
  if (!profile?.display_name) redirect("/onboarding/name");

  return (
    <>
      <StepProgress step={2} />
      <h2 className="mt-6 mb-6 text-2xl font-bold">身体</h2>
      <BodyForm defaults={profile} />
    </>
  );
}
