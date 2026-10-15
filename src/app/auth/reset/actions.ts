"use server";

import { redirect } from "next/navigation";
import { authErrorMessage, firstIssue, newPasswordSchema } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ResetState = { error?: string };

export async function updatePassword(_prev: ResetState, formData: FormData): Promise<ResetState> {
  const parsed = newPasswordSchema.safeParse({
    password: String(formData.get("password") ?? ""),
    confirm: String(formData.get("confirm") ?? ""),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?error=auth");

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });
  if (error) return { error: authErrorMessage(error) };
  redirect("/home");
}
