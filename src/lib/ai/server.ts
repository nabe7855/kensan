import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { costUsd, MONTHLY_LIMIT_USD, monthStartISO, type AiFeature, type AiModel } from "./cost";

export const fail = (status: number, message: string) =>
  NextResponse.json({ error: message }, { status });

type Supabase = Awaited<ReturnType<typeof createClient>>;
export type AiContext = { supabase: Supabase; userId: string; client: Anthropic };

/**
 * Everything an AI route checks before spending money: signed in, opted in, under this month's
 * cap, and the server has a key. Returns the context, or the response to send instead.
 */
export async function aiGuard(): Promise<AiContext | NextResponse> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) return fail(401, "ログインし直してください");

  const { data: profile } = await supabase
    .from("profiles")
    .select("ai_enabled")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profile?.ai_enabled) return fail(403, "設定で AI 機能をオンにしてください");

  const { data: used, error } = await supabase
    .from("ai_usage")
    .select("cost_usd")
    .gte("created_at", monthStartISO(new Date()));
  if (error) return fail(500, "利用状況を確認できませんでした");
  const spent = used.reduce((s, r) => s + Number(r.cost_usd), 0);
  if (spent >= MONTHLY_LIMIT_USD) return fail(429, "今月の AI の利用上限に達しました");

  if (!process.env.ANTHROPIC_API_KEY) return fail(503, "AI 機能はまだ準備中です");
  return { supabase, userId, client: new Anthropic() };
}

export async function logUsage(
  { supabase, userId }: AiContext,
  feature: AiFeature,
  model: AiModel,
  usage: { input_tokens: number; output_tokens: number },
) {
  await supabase.from("ai_usage").insert({
    user_id: userId,
    feature,
    model,
    input_tokens: usage.input_tokens,
    output_tokens: usage.output_tokens,
    cost_usd: costUsd(model, usage.input_tokens, usage.output_tokens),
  });
}

/** Maps SDK errors to messages; anything else is rethrown. */
export function aiError(e: unknown) {
  if (e instanceof Anthropic.RateLimitError)
    return fail(429, "混み合っています。少し待ってからもう一度");
  if (e instanceof Anthropic.APIError) return fail(502, "AI に接続できませんでした");
  throw e;
}
