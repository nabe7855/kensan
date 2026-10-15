import { redirect } from "next/navigation";
import { nextOnboardingStep } from "@/lib/onboarding";
import { getCurrentProfile } from "@/lib/profile";

export default async function OnboardingIndex() {
  const { profile } = await getCurrentProfile();
  redirect(`/onboarding/${nextOnboardingStep(profile) ?? "done"}`);
}
