# 実装状況

## 2026-10-15 — Phase 0 土台

### やったこと
- Next.js 15.5 (App Router) + TypeScript 5.9 + Tailwind v4 + shadcn 設定（`components.json`）を pnpm で構築
- デザイントークンを `src/app/globals.css` の `@theme` に反映（bg/card/border/fg/muted/ghost/accent/warn/danger、radius 8px）。`num`（Barlow Condensed 700 + tabular-nums）、`label-en`、`surface`（カード＋上端ハイライト）ユーティリティ、微細ノイズ背景
- フォント：`next/font/google` で Barlow Condensed / Noto Sans JP
- Supabase：`@supabase/ssr` のブラウザ／サーバ／middleware クライアント。未ログインは `/login` へリダイレクト
- `supabase/migrations/0001_init.sql`：要件書 §8 の全 17 テーブル、全テーブル RLS（23 ポリシー）、`updated_at` トリガ、ビュー 3 本（`security_invoker`）、`authenticated` のみへの GRANT
- リモート Supabase プロジェクトにリンクし `db push` 済み。型は `pnpm db:types` で `src/types/database.ts` に生成
- アプリシェル：下タブ 5 つ（ホーム/トレ/食事/コンディション/分析）、「D-xx | PREP DAY n」ヘッダー（アクティブなプレップがある時のみ）、TanStack Query Provider
- `src/lib/prep.ts`：D-xx / PREP DAY / JST の今日（テスト済み）
- Vitest（ユニット 8 件）、Playwright（未ログイン時リダイレクトのスモーク 2 件、Pixel 7）、ESLint 9 + Prettier、GitHub Actions（lint/typecheck/test/build）

### 判断事項
- 開発 DB はローカル Docker ではなくリモート Supabase プロジェクトを使用（要件書 §7 の「dev は local」から変更）。ローカルで動かす場合は `pnpm db:start` → `pnpm db:types:local`
- Supabase プロジェクトは「Automatically expose new tables」オフ。新しいテーブルを作るときはマイグレーションに GRANT を書く
- `routines.weekdays smallint[]` を追加（§9 のトレ日／オフ日判定用。§8 には無い）
- 子テーブル（`workout_sets` など）にも `user_id` を持たせ、RLS を `auth.uid() = user_id` で統一
- 週の区切り・「今日」は Asia/Tokyo 基準（週は月曜始まり）
- pnpm の厳格な依存解決で ESLint プラグインが見つからないため、`.npmrc` で `*eslint*` を hoist

### 次
- Phase 1：スプラッシュ → 認証（メールマジックリンク / Google）→ 銘を切る → 身体 → プレップ設定。刃文 SVG、`src/lib/prep.ts` に目標ライン計算を追加
