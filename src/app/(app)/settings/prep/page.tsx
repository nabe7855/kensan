import type { Metadata } from "next";
import { PrepForm } from "@/components/prep/PrepForm";
import { todayISO } from "@/lib/prep";
import { getCurrentProfile } from "@/lib/profile";

export const metadata: Metadata = { title: "プレップ設定 | 研鑽" };

export default async function SettingsPrepPage() {
  const { supabase } = await getCurrentProfile();
  const [{ data: prep }, { data: latest }] = await Promise.all([
    supabase
      .from("preps")
      .select(
        "id, contest_name, contest_date, start_date, start_weight_kg, target_weight_kg, weekly_rate_pct, why_text, reverse_plan",
      )
      .eq("is_active", true)
      .maybeSingle(),
    supabase
      .from("daily_checkins")
      .select("weight_kg")
      .not("weight_kg", "is", null)
      .order("date", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  const reverse = prep?.reverse_plan as { enabled?: boolean } | null | undefined;

  return (
    <div className="flex flex-col">
      <h1 className="mb-4 text-center text-xl font-bold">プレップ設定</h1>
      <PrepForm
        today={todayISO()}
        defaultStartKg={latest?.weight_kg ?? undefined}
        next="/home"
        initial={
          prep
            ? {
                id: prep.id,
                contest_name: prep.contest_name,
                contest_date: prep.contest_date,
                start_date: prep.start_date,
                start_weight_kg: prep.start_weight_kg,
                target_weight_kg: prep.target_weight_kg,
                weekly_rate_pct: prep.weekly_rate_pct,
                why_text: prep.why_text,
                reverse_enabled: !!reverse?.enabled,
              }
            : undefined
        }
      />
    </div>
  );
}
