import { NextResponse } from "next/server";
import { z } from "zod";
import { CheckinFactsSchema } from "@/lib/ai/checkin";
import { DailyFactsSchema } from "@/lib/ai/daily";
import { HISTORY_TURNS, MAX_MESSAGE_CHARS, toTurns, type ChatRow } from "@/lib/ai/coach";
import { DAILY_CHAT_LIMIT, MODELS } from "@/lib/ai/cost";
import { aiError, aiGuard, fail, logUsage } from "@/lib/ai/server";
import { todayISO } from "@/lib/prep";

export const runtime = "nodejs";
export const maxDuration = 60;

const Body = z.object({
  message: z.string().trim().min(1).max(MAX_MESSAGE_CHARS),
  facts: CheckinFactsSchema,
  days: DailyFactsSchema,
});

const SYSTEM = `あなたはフィジーク競技者の記録アプリ「研鑽」の AI コーチです。
本人の直近 7 日の記録（facts）を踏まえて、トレーニング・食事・減量・コンディションの相談に日本語で答えます。

答え方:
- 結論から、短く。基本は 3〜6 文。箇条書きは必要なときだけ。
- 本人の記録に関係するときは facts の数字を根拠に挙げる。facts にない数字を作らない。
- 提案には根拠を 1 文添える。わからないこと・記録が足りないことは、そう言う。
- 目標の数値を変える話になったら、決めるのは本人であることを伝え、週の振り返りや食事タブの目標設定から変えられると案内する。

守ること:
- 体重は週平均で考える。日々の増減で一喜一憂させない。体重が減ったこと自体を褒めない。
- 「未達」「失敗」など責める言葉を使わない。
- 水抜き・塩抜き・極端な糖質カット・絶食、薬・ホルモン・サプリの用量は提案しない。聞かれたら、安全のため扱わないと伝え、必要なら医師や専門家に相談するよう勧める。
- 診断はしない。痛み・体調不良・摂食の悩みが続く話には、休養や医療機関への相談をやさしく勧める。
- 体型や見た目を否定的に評価しない。
- 絵文字・煽る表現は使わない。落ち着いたコーチの口調で。
- フィットネスと関係のない依頼には、短く断って本題に戻す。

facts の読み方:
- weight.change_pct は直近 7 日と、その前の 7 日の平均体重の差（%）。マイナスが減少。
- condition は 1（悪い）〜5（良い）。hunger は 5 が「空腹が平気」。rhr は安静時心拍。
- training.hard_sets はウォームアップを除いたセット数。nutrition.avg は記録した日の平均、target_avg は目標の平均。

days（日ごとの記録、直近 14 日。記録のない日は省略）の読み方:
- weight_kg と weighed_at（測った時刻、JST）。meals は食べた時刻（at）と、その食事の kcal・P・F・C。
- salt_g は成分データのある食品から計算した食塩相当量（g）。salt_coverage はその日の kcal のうち塩分データがある割合で、低ければ salt_g は実際より少ない可能性がある。
- prev_day_salt_feel はその朝に本人が入れた「前日の塩分の感覚」（low / normal / high）。
- 日々の体重の上下は、前日の塩分・炭水化物の量、夕食の遅さ、測った時刻の違い、睡眠、便通などで一時的に動くことがある。日ごとの増減の理由を聞かれたら、days から考えられる候補を挙げてよい。ただし「可能性」として控えめに伝え、判断や目標の話は週平均（facts.weight）で行う。
- 塩分や水分を減らす・抜く提案はしない。「普段どおりに整える」「測る条件をそろえる（同じ時刻・排泄後など）」の範囲で伝える。`;

/** One coach reply. History comes from the database, not the request, so it can't be faked. */
export async function POST(request: Request) {
  const ctx = await aiGuard();
  if (ctx instanceof NextResponse) return ctx;

  const body = Body.safeParse(await request.json().catch(() => null));
  if (!body.success) return fail(400, `メッセージは ${MAX_MESSAGE_CHARS} 文字までです`);

  const { count } = await ctx.supabase
    .from("ai_usage")
    .select("id", { count: "exact", head: true })
    .eq("feature", "chat")
    .gte("created_at", `${todayISO()}T00:00:00+09:00`);
  if ((count ?? 0) >= DAILY_CHAT_LIMIT) {
    return fail(429, `今日の相談は ${DAILY_CHAT_LIMIT} 回までです。また明日どうぞ`);
  }

  const { data: recent } = await ctx.supabase
    .from("ai_messages")
    .select("role, content")
    .order("created_at", { ascending: false })
    .limit(HISTORY_TURNS);
  const history = toTurns(((recent ?? []) as ChatRow[]).reverse());

  const model = MODELS.chat;
  try {
    const response = await ctx.client.messages.create({
      model,
      max_tokens: 4096,
      output_config: { effort: "low" },
      system: `${SYSTEM}\n\n本人の直近 7 日の facts:\n${JSON.stringify(body.data.facts)}\n\ndays:\n${JSON.stringify(body.data.days)}`,
      messages: [...history, { role: "user", content: body.data.message }],
    });
    await logUsage(ctx, "chat", model, response.usage);

    const reply = response.content
      .flatMap((b) => (b.type === "text" ? [b.text] : []))
      .join("")
      .trim();
    if (response.stop_reason === "refusal" || !reply) {
      return fail(422, "うまく答えられませんでした。聞き方を変えてもう一度どうぞ");
    }

    const now = Date.now();
    const { data, error } = await ctx.supabase
      .from("ai_messages")
      .insert([
        {
          user_id: ctx.userId,
          role: "user",
          content: body.data.message,
          created_at: new Date(now).toISOString(),
        },
        {
          user_id: ctx.userId,
          role: "assistant",
          content: reply.slice(0, 6000),
          created_at: new Date(now + 1).toISOString(),
        },
      ])
      .select("id, role, content, created_at");
    if (error) return fail(500, "保存できませんでした");
    return NextResponse.json({ messages: data });
  } catch (e) {
    return aiError(e);
  }
}
