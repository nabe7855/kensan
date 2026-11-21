import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { z } from "zod";
import { costUsd, LABEL_MODEL, MONTHLY_LIMIT_USD, monthStartISO } from "@/lib/ai/cost";
import { LabelReadingSchema } from "@/lib/ai/label-reading";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 30;

const Body = z.object({
  mediaType: z.enum(["image/jpeg", "image/png", "image/webp"]),
  // About 3 MB of image once decoded; the client resizes well below this.
  data: z.string().min(100).max(4_000_000),
});

const SYSTEM = `You read Japanese food package nutrition labels (栄養成分表示) from a photo.
Copy the numbers exactly as printed. Do not estimate, convert or calculate anything.
- basis: "100g" when the label says 100g or 100ml 当たり; otherwise "serving" (1袋, 1個, 1本, 1食 当たり…).
- serving_name / serving_grams: the serving counter and weight, e.g. 1袋（110g）当たり → "袋", 110.
- carb_g is 炭水化物. If the label prints only 糖質 (and 食物繊維), leave carb_g null and fill those.
- salt_g is 食塩相当量 in g. If only ナトリウム is printed, put its mg value in sodium_mg.
- Use null for anything not printed or not legible. If no nutrition table is visible, set found to false.`;

const fail = (status: number, message: string) => NextResponse.json({ error: message }, { status });

/** Reads a nutrition label photo into numbers for the new-food form. */
export async function POST(request: Request) {
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

  const { data: used, error: usedError } = await supabase
    .from("ai_usage")
    .select("cost_usd")
    .gte("created_at", monthStartISO(new Date()));
  if (usedError) return fail(500, "利用状況を確認できませんでした");
  const spent = used.reduce((s, r) => s + Number(r.cost_usd), 0);
  if (spent >= MONTHLY_LIMIT_USD) return fail(429, "今月の AI の利用上限に達しました");

  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return fail(400, "画像を読み込めませんでした");

  if (!process.env.ANTHROPIC_API_KEY) return fail(503, "AI 機能はまだ準備中です");
  const client = new Anthropic();

  try {
    const response = await client.messages.parse({
      model: LABEL_MODEL,
      max_tokens: 4096,
      output_config: { effort: "low", format: zodOutputFormat(LabelReadingSchema) },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: body.data.mediaType, data: body.data.data },
            },
            { type: "text", text: "この栄養成分表示を読み取ってください。" },
          ],
        },
      ],
    });

    await supabase.from("ai_usage").insert({
      user_id: userId,
      feature: "label",
      model: LABEL_MODEL,
      input_tokens: response.usage.input_tokens,
      output_tokens: response.usage.output_tokens,
      cost_usd: costUsd(LABEL_MODEL, response.usage.input_tokens, response.usage.output_tokens),
    });

    const reading = response.parsed_output;
    if (response.stop_reason === "refusal" || !reading) {
      return fail(422, "読み取れませんでした。手で入力してください");
    }
    if (!reading.found)
      return fail(
        422,
        "栄養成分表示が見つかりませんでした。表示が大きく写るように撮り直してください",
      );
    return NextResponse.json({ reading });
  } catch (e) {
    if (e instanceof Anthropic.RateLimitError)
      return fail(429, "混み合っています。少し待ってからもう一度");
    if (e instanceof Anthropic.APIError) return fail(502, "AI に接続できませんでした");
    throw e;
  }
}
