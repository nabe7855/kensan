"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { bodySchema, nameSchema, prepSchema } from "@/lib/onboarding";
import { todayISO } from "@/lib/prep";
import { createClient } from "@/lib/supabase/server";

export type FormState = { error?: string };

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, user };
}

export async function saveName(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = nameSchema.safeParse({ display_name: formData.get("display_name") ?? "" });
  if (!parsed.success) return { error: "銘は1〜20文字で刻んでください" };

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .upsert({ user_id: user.id, display_name: parsed.data.display_name });
  if (error) return { error: "保存できませんでした。もう一度お試しください" };
  redirect("/onboarding/body");
}

export async function saveBody(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = bodySchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "身長・性別・単位を入力してください" };

  const { supabase, user } = await requireUser();
  const { error } = await supabase.from("profiles").update(parsed.data).eq("user_id", user.id);
  if (error) return { error: "保存できませんでした。もう一度お試しください" };
  redirect("/onboarding/prep");
}

export async function savePrep(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = prepSchema.safeParse({
    ...Object.fromEntries(formData),
    reverse_plan: formData.get("reverse_plan") === "on",
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return { error: issue?.code === "custom" ? issue.message : "入力内容を確認してください" };
  }
  const today = todayISO();
  if (parsed.data.contest_date <= today) return { error: "大会日は明日以降にしてください" };
  const startDate = parsed.data.start_date ?? today;
  if (startDate > today) return { error: "減量開始日は今日以前にしてください" };

  const { supabase, user } = await requireUser();
  const { reverse_plan, why_text, ...rest } = parsed.data;
  const fields = {
    ...rest,
    start_date: startDate,
    why_text: why_text || null,
    reverse_plan: reverse_plan ? { enabled: true } : null,
  };
  const prepId = formData.get("prep_id");
  const next = formData.get("next") === "/home" ? "/home" : "/onboarding/done";

  if (typeof prepId === "string" && prepId) {
    const { error } = await supabase
      .from("preps")
      .update(fields)
      .eq("id", prepId)
      .eq("user_id", user.id);
    if (error) return { error: "保存できませんでした。もう一度お試しください" };
  } else {
    const deactivate = await supabase
      .from("preps")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .eq("is_active", true);
    if (deactivate.error) return { error: "保存できませんでした。もう一度お試しください" };

    const { error } = await supabase
      .from("preps")
      .insert({ ...fields, user_id: user.id, is_active: true });
    if (error) return { error: "保存できませんでした。もう一度お試しください" };
  }
  revalidatePath("/", "layout");
  redirect(next);
}

export async function completeOnboarding(): Promise<void> {
  const { supabase, user } = await requireUser();
  await supabase
    .from("profiles")
    .update({ onboarded_at: new Date().toISOString() })
    .eq("user_id", user.id);
  redirect("/home");
}
