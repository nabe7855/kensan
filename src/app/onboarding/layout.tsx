import { redirect } from "next/navigation";
import { Hamon } from "@/components/brand/Hamon";
import { getCurrentProfile } from "@/lib/profile";

export default async function OnboardingLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await getCurrentProfile();
  if (profile?.onboarded_at) redirect("/home");

  return (
    <div className="relative mx-auto flex min-h-dvh max-w-[480px] flex-col overflow-hidden px-4 pt-[calc(env(safe-area-inset-top)+2.5rem)] pb-[calc(env(safe-area-inset-bottom)+1.5rem)]">
      <Hamon className="h-[45%]" />
      <div className="relative flex flex-1 flex-col">{children}</div>
    </div>
  );
}
