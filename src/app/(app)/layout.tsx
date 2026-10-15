import { BottomTabBar } from "@/components/shell/BottomTabBar";
import { PrepHeader } from "@/components/shell/PrepHeader";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { todayISO } from "@/lib/prep";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/profile";
import { cn } from "@/lib/utils";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { supabase, profile } = await getCurrentProfile();
  if (!profile?.onboarded_at) redirect("/onboarding");

  const { data: prep } = await supabase
    .from("preps")
    .select("contest_date, start_date")
    .eq("is_active", true)
    .maybeSingle();

  return (
    <QueryProvider>
      {prep && (
        <PrepHeader
          contestDate={prep.contest_date}
          startDate={prep.start_date}
          today={todayISO()}
        />
      )}
      <main
        className={cn(
          "mx-auto w-full max-w-[480px] px-4 pb-[calc(4rem+env(safe-area-inset-bottom)+1rem)]",
          prep ? "pt-4" : "pt-[calc(env(safe-area-inset-top)+1rem)]",
        )}
      >
        {children}
      </main>
      <BottomTabBar />
    </QueryProvider>
  );
}
