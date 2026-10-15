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

## 2026-10-15 — Phase 1 認証・オンボーディング・プレップ設定

### やったこと
- `/login`（スプラッシュ兼ログイン、08）：焼き入れロゴ、刃文が下から浮かぶ（1.2 秒、reduced-motion では静止）、「メールで続ける」「Google で続ける（準備中）」
- `/login/email`：メール → 6〜8 桁コード入力（`verifyOtp`）。再送あり。メール内リンクは `/auth/callback`（`code` / `token_hash` 両対応）
- middleware：ログイン済みで `/login` に来たら `/home`。`(app)` レイアウトはオンボーディング未完了なら `/onboarding` へ
- オンボーディング `/onboarding/{name,body,prep,done}`：銘を切る（07、刻印風プレビュー）→ 身長・性別・単位 → プレップ設定（06）または「今はスキップ」→「研ぎ始める」で `profiles.onboarded_at` を記録
- プレップ設定：週ペースは必要ペースを 0.05 刻みで切り上げた値を初期値（0.25〜1.0）。予測ライン（Recharts）、届かない場合は大会日の予測体重をアンバーで一文表示
- `src/lib/prep.ts` に目標ライン計算、`src/lib/onboarding.ts` に次ステップ判定と zod スキーマ（いずれもテスト済み）
- `0003_onboarding.sql`：`profiles.onboarded_at`、`preps.start_date` の既定値（JST の今日）。リモート適用済み
- 共通部品：`Hamon`、`Logo`（Noto Serif JP 900）、`StepProgress`（研ぎ目）、`Segmented`、`src/lib/tokens.ts`（チャート用の色定数）
- テスト：ユニット 26 件、e2e 5 件（ログイン前の画面と振り分け）
- `.gitattributes` で改行を LF に固定（Windows で Prettier が CRLF を差分扱いするため）

### 判断事項
- メールログインはコード入力を主にした（iOS のホーム画面 PWA は Safari とセッションが別で、リンクだとアプリに戻れないため）。Supabase のメールテンプレートに `{{ .Token }}` が必要
- Google ログインはボタンのみ。OAuth クライアント設定後に有効化
- 単位 lb は保存のみで表示は kg（換算対応は Phase 5）
- 短冊は写真風の石テクスチャを使わず、黒地＋枠＋刻印風 text-shadow で表現
- プロフィールは DB トリガーではなく「銘を切る」で upsert
- ログイン後の e2e は service_role キーが必要になるため自動化していない（実機で確認）

### 次
- Supabase の URL 設定・メールテンプレートを済ませて、実機でオンボーディングを通しで確認
- Phase 2：朝のチェックイン（04）とホーム（01）、`src/lib/trend.ts`
