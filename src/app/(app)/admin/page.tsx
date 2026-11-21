import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { formatYen, MONTHLY_LIMIT_USD, monthRange } from "@/lib/ai/cost";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "管理 | 研鑽" };

/** Admin only: each account's AI spend for a month. */
export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ m?: string }>;
}) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getClaims();
  const userId = auth?.claims.sub;
  if (!userId) notFound();
  const { data: admin } = await supabase
    .from("admins")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();
  if (!admin) notFound();

  const range = monthRange((await searchParams).m, new Date());
  const { data: rows, error } = await supabase.rpc("admin_ai_usage", {
    since: range.since,
    until: range.until,
  });
  const usage = rows ?? [];
  const total = usage.reduce((s, r) => s + Number(r.cost_usd), 0);
  const calls = usage.reduce((s, r) => s + Number(r.calls), 0);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-xl font-bold">AI の利用状況</h1>

      <div className="flex items-center justify-between">
        <Link
          href={`/admin?m=${range.prev}`}
          className="text-muted flex min-h-12 items-center px-2 text-sm"
        >
          ← 前の月
        </Link>
        <p className="num text-lg">{range.key.replace("-", ".")}</p>
        <Link
          href={`/admin?m=${range.next}`}
          className="text-muted flex min-h-12 items-center px-2 text-sm"
        >
          次の月 →
        </Link>
      </div>

      <div className="surface grid grid-cols-2 gap-2 px-4 py-4">
        <div>
          <p className="text-muted text-xs">合計</p>
          <p className="num text-2xl">約 {formatYen(total)} 円</p>
          <p className="num text-ghost text-xs">${total.toFixed(4)}</p>
        </div>
        <div>
          <p className="text-muted text-xs">回数</p>
          <p className="num text-2xl">{calls.toLocaleString("ja-JP")}</p>
          <p className="text-ghost text-xs">{usage.length} アカウント</p>
        </div>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-muted text-xs">
          アカウント別（上限は 1 人 月 約 {formatYen(MONTHLY_LIMIT_USD)} 円）
        </h2>
        {error && <p className="text-warn text-sm">読み込めませんでした</p>}
        {!error && usage.length === 0 && (
          <p className="text-muted text-sm">この月の利用はありません</p>
        )}
        {usage.map((r) => {
          const cost = Number(r.cost_usd);
          return (
            <div key={r.user_id} className="surface flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold">{r.display_name || "（名前なし）"}</p>
                <p className="text-ghost truncate text-xs">{r.email}</p>
                <p className="num text-muted text-xs">
                  {Number(r.calls).toLocaleString("ja-JP")} 回・入力{" "}
                  {Number(r.input_tokens).toLocaleString("ja-JP")}／出力{" "}
                  {Number(r.output_tokens).toLocaleString("ja-JP")} トークン
                </p>
              </div>
              <div className="text-right">
                <p className="num text-lg">約 {formatYen(cost)} 円</p>
                {cost >= MONTHLY_LIMIT_USD && <p className="text-warn text-xs">上限に到達</p>}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
}
