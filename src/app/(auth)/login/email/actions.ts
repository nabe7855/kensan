"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type EmailState = {
  step: "email" | "code";
  email: string;
  error?: string;
  notice?: string;
};

const emailSchema = z.email();
const codeSchema = z.string().regex(/^\d{6,8}$/);

async function requestCode(email: string): Promise<string | null> {
  const origin = (await headers()).get("origin") ?? "";
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { shouldCreateUser: true, emailRedirectTo: `${origin}/auth/callback` },
  });
  if (!error) return null;
  return error.status === 429
    ? "送信回数の上限です。少し時間をおいてください"
    : "送信できませんでした。もう一度お試しください";
}

export async function emailLogin(prev: EmailState, formData: FormData): Promise<EmailState> {
  const intent = formData.get("intent");

  if (intent === "verify") {
    const token = String(formData.get("code") ?? "").replace(/\s/g, "");
    if (!codeSchema.safeParse(token).success) {
      return { ...prev, notice: undefined, error: "コードは数字で入力してください" };
    }
    const supabase = await createClient();
    const { error } = await supabase.auth.verifyOtp({ email: prev.email, token, type: "email" });
    if (error) return { ...prev, notice: undefined, error: "コードが違うか、期限切れです" };
    redirect("/home");
  }

  if (intent === "resend") {
    const error = await requestCode(prev.email);
    return error
      ? { ...prev, notice: undefined, error }
      : { ...prev, error: undefined, notice: "コードを再送しました" };
  }

  const parsed = emailSchema.safeParse(String(formData.get("email") ?? "").trim());
  if (!parsed.success) {
    return { step: "email", email: "", error: "メールアドレスを確認してください" };
  }
  const error = await requestCode(parsed.data);
  return error
    ? { step: "email", email: parsed.data, error }
    : { step: "code", email: parsed.data };
}
