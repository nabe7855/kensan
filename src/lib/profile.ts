import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/** Signed-in user's profile (null if not created yet). Redirects to /login when signed out. */
export async function getCurrentProfile() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select(
      "display_name, height_cm, sex, unit_pref, onboarded_at, track_libido, meal_slots, show_rir, training_phase, plateau_alerts",
    )
    .eq("user_id", user.id)
    .maybeSingle();

  return { supabase, user, profile };
}
