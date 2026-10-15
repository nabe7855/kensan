import { BottomTabBar } from "@/components/shell/BottomTabBar";
import { PrepHeader } from "@/components/shell/PrepHeader";
import { QueryProvider } from "@/components/providers/QueryProvider";
import { todayISO } from "@/lib/prep";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
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
      <main className="mx-auto w-full max-w-[480px] px-4 pt-4 pb-[calc(4rem+env(safe-area-inset-bottom)+1rem)]">
        {children}
      </main>
      <BottomTabBar />
    </QueryProvider>
  );
}
