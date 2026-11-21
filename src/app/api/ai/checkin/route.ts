import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { CheckinFactsSchema, CheckinResultSchema, kcalDelta } from "@/lib/ai/checkin";
import { MODELS } from "@/lib/ai/cost";
import { aiError, aiGuard, fail, logUsage } from "@/lib/ai/server";

export const runtime = "nodejs";
export const maxDuration = 60;

const SYSTEM = `あなたはフィジーク競技者の記録アプリ「研鑽」の週次振り返り担当です。
アプリが計算した先週の facts（JSON）を読み、本人向けの振り返りを日本語で書きます。

守ること:
- 数字は facts にあるものだけを使う。推測で数字を作らない。データがない分野は触れない。
- 体重は週平均の変化だけで判断する。日々の増減には触れない。
- 体重が減ったこと自体を褒めない。記録を続けたことは認めてよい。
- 目標は幅で考える。「未達」「失敗」など責める言葉を使わない。
- 提案には必ず facts に基づく根拠を 1 文添える。
- 水抜き・塩抜き・極端な糖質カット・薬やサプリの用量は提案しない。
- 医療的な診断はしない。safety.level が caution のとき、または痛みが 3 日以上のときは、休養や医療機関への相談をやさしく勧める。
- 絵文字・感嘆符の多用・煽る表現は使わない。落ち着いた、コーチの口調で。
- kcal_delta はアプリが決めた値。0 以外なら adjustment_note でその理由を説明する。自分で別の数値を提案しない。

facts の読み方:
- weight.change_pct は前週比の週平均の変化（%）。マイナスが減少。prep.target_loss_pct_per_week は目標の減少率（%/週）。
- condition の各値は 1（悪い）〜5（良い）の平均。hunger は 5 が「空腹が平気」。rhr は安静時心拍の平均。
- training.hard_sets はウォームアップを除いたセット数。
- nutrition.avg は記録した日の平均、target_avg は同じ日の目標の平均。`;

/** Reviews last week from numbers the app computed, and saves it for the week. */
export async function POST(request: Request) {
  const ctx = await aiGuard();
  if (ctx instanceof NextResponse) return ctx;

  const facts = CheckinFactsSchema.safeParse(await request.json().catch(() => null));
  if (!facts.success) return fail(400, "記録を読み込めませんでした");

  const delta = kcalDelta(facts.data);
  const model = MODELS.checkin;
  try {
    const response = await ctx.client.messages.parse({
      model,
      max_tokens: 8192,
      output_config: { effort: "medium", format: zodOutputFormat(CheckinResultSchema) },
      system: SYSTEM,
      messages: [
        {
          role: "user",
          content: `先週の facts:\n${JSON.stringify(facts.data)}\n\nkcal_delta: ${delta}`,
        },
      ],
    });
    await logUsage(ctx, "checkin", model, response.usage);

    const result = response.parsed_output;
    if (response.stop_reason === "refusal" || !result) {
      return fail(422, "振り返りを作れませんでした。少し時間をおいてもう一度");
    }
    const row = {
      user_id: ctx.userId,
      week_start: facts.data.week_start,
      facts: facts.data,
      result: { ...result, points: result.points.slice(0, 4), actions: result.actions.slice(0, 3) },
      kcal_delta: delta,
      model,
      applied_at: null,
    };
    const { data, error } = await ctx.supabase
      .from("ai_checkins")
      .upsert(row, { onConflict: "user_id,week_start" })
      .select("id, week_start, result, kcal_delta, applied_at, created_at")
      .single();
    if (error) return fail(500, "保存できませんでした");
    return NextResponse.json({ checkin: data });
  } catch (e) {
    return aiError(e);
  }
}
