"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authErrorMessage, changeEmailSchema, firstIssue } from "@/lib/auth";
import { bodySchema, nameSchema } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";

export type SettingsState = { error?: string; saved?: boolean };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

const FAILED = { error: "保存できませんでした。もう一度お試しください" };

export async function updateProfile(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const name = nameSchema.safeParse({ display_name: formData.get("display_name") ?? "" });
  if (!name.success) return { error: "銘は1〜20文字にしてください" };
  const body = bodySchema.safeParse(Object.fromEntries(formData));
  if (!body.success) return { error: "身長・性別・単位を確認してください" };

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({
      ...name.data,
      ...body.data,
      track_libido: formData.get("track_libido") === "on",
    })
    .eq("user_id", user.id);
  if (error) return FAILED;
  revalidatePath("/", "layout");
  return { saved: true };
}

export async function endPrep(prepId: string): Promise<void> {
  const { supabase, user } = await requireUser();
  await supabase.from("preps").update({ is_active: false }).eq("id", prepId).eq("user_id", user.id);
  revalidatePath("/", "layout");
}

export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

export async function updateMealSlots(
  _prev: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const slots = String(formData.get("meal_slots") ?? "")
    .split(/[,、\s]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 8);
  const unique = [...new Set(slots)];
  if (unique.length === 0 || unique.some((s) => s.length > 10)) {
    return { error: "食事枠は1〜8個、各10文字までにしてください" };
  }
  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({ meal_slots: unique })
    .eq("user_id", user.id);
  if (error) return FAILED;
  revalidatePath("/", "layout");
  return { saved: true };
}

export type EmailChangeState = SettingsState & { notice?: string; email?: string };

export async function changeEmail(
  _prev: EmailChangeState,
  formData: FormData,
): Promise<EmailChangeState> {
  const parsed = changeEmailSchema.safeParse({
    email: String(formData.get("email") ?? "").trim(),
    password: String(formData.get("password") ?? ""),
  });
  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { supabase, user } = await requireUser();
  const next = parsed.data.email.toLowerCase();
  if (next === user.email?.toLowerCase()) return { error: "今と同じメールアドレスです" };

  // Re-authenticate so a borrowed, still-signed-in phone can't take over the account.
  const check = await supabase.auth.signInWithPassword({
    email: user.email ?? "",
    password: parsed.data.password,
  });
  if (check.error) {
    return {
      error:
        check.error.code === "invalid_credentials"
          ? "今のパスワードが違います。パスワード未設定なら、先に「パスワードを設定・変更」から設定してください"
          : authErrorMessage(check.error),
    };
  }

  const origin = (await headers()).get("origin") ?? "";
  const { data, error } = await supabase.auth.updateUser(
    { email: next },
    { emailRedirectTo: `${origin}/auth/callback?next=/home` },
  );
  if (error) {
    return {
      error:
        error.code === "email_exists"
          ? "このメールアドレスは別のアカウントで使われています"
          : authErrorMessage(error),
    };
  }
  revalidatePath("/settings");
  if (data.user?.email?.toLowerCase() === next) return { saved: true, email: next };
  return {
    email: user.email ?? "",
    notice: `${next} に確認メールを送りました。メールのリンクを開くと変更が完了します`,
  };
}
