"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { authErrorMessage, emailSchema, firstIssue, loginSchema, signupSchema } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AuthState = { error?: string; notice?: string; email?: string };

const field = (formData: FormData, name: string) => String(formData.get(name) ?? "");

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = field(formData, "email").trim();
  const parsed = loginSchema.safeParse({ email, password: field(formData, "password") });
  if (!parsed.success) return { email, error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) return { email, error: authErrorMessage(error) };
  redirect("/home");
}

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = field(formData, "email").trim();
  const parsed = signupSchema.safeParse({
    email,
    password: field(formData, "password"),
    confirm: field(formData, "confirm"),
  });
  if (!parsed.success) return { email, error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) return { email, error: authErrorMessage(error) };
  // With "Confirm email" off, Supabase returns a session right away.
  if (data.session) redirect("/onboarding");
  // An existing address comes back without identities and without an error.
  if (data.user && data.user.identities?.length === 0) {
    return { email, error: authErrorMessage({ code: "user_already_exists" }) };
  }
  return { email, notice: "確認メールを送りました。メールのリンクを開いてください" };
}

export async function requestReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = field(formData, "email").trim();
  const parsed = emailSchema.safeParse({ email });
  if (!parsed.success) return { email, error: firstIssue(parsed.error) };

  const supabase = await createClient();
  const origin = (await headers()).get("origin") ?? "";
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/auth/callback?next=/auth/reset`,
  });
  if (error) return { email, error: authErrorMessage(error) };
  return {
    email,
    notice:
      "登録されているアドレスなら、再設定のメールを送りました。メールのリンクをこの端末のブラウザで開いてください",
  };
}
