import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import { NextResponse } from "next/server";
import { z } from "zod";
import { DAILY_PEAK_LIMIT, PeakFactsSchema, PeakResultSchema, tidyPeakResult } from "@/lib/ai/peak";
import { MODELS } from "@/lib/ai/cost";
import { aiError, aiGuard, fail, logUsage } from "@/lib/ai/server";
import { daysUntilContest, todayISO } from "@/lib/prep";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({ contest_id: z.string().uuid(), facts: PeakFactsSchema });

const SYSTEM = `あなたはフィジーク競技者の記録アプリ「研鑽」の、大会前の最終調整の確認役です。
アプリが計算した facts（JSON）を読み、今日から大会当日までの過ごし方を日本語で 1 日ずつまとめます。

考え方:
- 最終週は「新しいことをしない・決めたことをそのまま行う」週。食事とトレーニングは大きく変えない。
- 体重は週平均で見る。目標体重との差が残っていても、今から急いで落とそうとしない。今の仕上がりで当日を迎える前提で、睡眠・体調・準備を整える方向で書く。
- open_items は未完了の準備項目（entry: エントリー確認, routine: ポージングの流れ, suit: 水着の規定とサイズ, color: カラーリング剤, photo: ポーズ写真, meals: 前日と当日の食事, steady: 食事とトレを変えない, packing: 持ち物, travel: 移動と受付時間, sleep: 早く寝る, day: 当日の流れ）。残っていれば、間に合う日に割り振る。
- own_open は本人のルーティンで今日まだの数。

守ること:
- 水抜き・塩抜き・水分や塩分の量の指示、利尿剤・薬・ホルモン・サプリの用量、極端な糖質の抜きや詰め込みの量は、絶対に書かない。食事の内容は「決めておいた食事」「普段どおり」の範囲で書く。
- 数字は facts にあるものだけを使う。推測で数字を作らない。
- 体重が減ったこと自体を褒めない。「未達」「失敗」など責める言葉を使わない。体型を否定的に評価しない。
- 診断はしない。safety.level が caution、痛みが続いている、睡眠や体調の値が低いときは、無理をせず休養や医療機関・トレーナーへの相談をやさしく勧める。出場を迷うほどなら、それも選択肢だと伝える。
- 絵文字・煽る表現は使わない。落ち着いたコーチの口調で、短く具体的に。

facts の読み方:
- week は直近 7 日。weight.change_pct はその前の 7 日との週平均の差（%）。condition は 1（悪い）〜5（良い）。hunger は 5 が「空腹が平気」。`;

/** A day-by-day final-week plan for one contest, saved for today. */
export async function POST(request: Request) {
  const ctx = await aiGuard();
  if (ctx instanceof NextResponse) return ctx;

  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return fail(400, "記録を読み込めませんでした");

  const today = todayISO();
  const { data: contest } = await ctx.supabase
    .from("contests")
    .select("id, date")
    .eq("id", body.data.contest_id)
    .maybeSingle();
  if (!contest) return fail(404, "大会が見つかりませんでした");
  const left = daysUntilContest(contest.date, today);
  if (left !== body.data.facts.days_to_contest)
    return fail(400, "日付が合いません。開き直してください");

  const { count } = await ctx.supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("feature", "peak")
    .gte("created_at", `${today}T00:00:00+09:00`);
  if ((count ?? 0) >= DAILY_PEAK_LIMIT) {
    return fail(429, `今日の作り直しは ${DAILY_PEAK_LIMIT} 回までです。また明日どうぞ`);
  }

  const model = MODELS.peak;
  try {
    const response = await ctx.client.messages.parse({
      model,
      max_tokens: 8192,
      output_config: { effort: "medium", format: zodOutputFormat(PeakResultSchema) },
      system: SYSTEM,
      messages: [{ role: "user", content: `facts:\n${JSON.stringify(body.data.facts)}` }],
    });
    await logUsage(ctx, "peak", model, response.usage);

    const parsed = response.parsed_output;
    if (response.stop_reason === "refusal" || !parsed) {
      return fail(422, "うまくまとめられませんでした。少し時間をおいてもう一度");
    }
    const { data, error } = await ctx.supabase
      .from("ai_peak_plans")
      .upsert(
        {
          user_id: ctx.userId,
          contest_id: contest.id,
          on_date: today,
          facts: body.data.facts,
          result: tidyPeakResult(parsed, left),
          model,
          created_at: new Date().toISOString(),
        },
        { onConflict: "user_id,contest_id,on_date" },
      )
      .select("id, on_date, result, created_at")
      .single();
    if (error) return fail(500, "保存できませんでした");
    return NextResponse.json({ plan: data });
  } catch (e) {
    return aiError(e);
  }
}
