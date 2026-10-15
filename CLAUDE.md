# 研鑽（KENSAN）

フィジーク競技者向けのトレーニング／食事／体重／コンディション記録 Web アプリ（スマホ最適化 PWA）。
世界観は「自分を名刀のように最後まで研ぎ切る」。刀のイラストは使わず、刃文・焼き入れの光・銘・研ぎ目で表現する（`docs/01_requirements.md` §0）。

## 必読
- `docs/01_requirements.md` — 要件・画面・機能フェーズ・データモデル・ロジック仕様。迷ったらここを正とする。
- `design/mockups/*.png` — UI の正。色・余白・タイポ・コンポーネント形状はモックに合わせる。
- `docs/02_image-prompts.md` — モック生成に使ったプロンプト（デザイン言語の文章版）。

## スタック
Next.js 15 (App Router, TypeScript) / Tailwind CSS / shadcn/ui / Supabase (Postgres, Auth, Storage) / TanStack Query / Dexie / Recharts / Vitest / Playwright。デプロイは GitHub → Vercel。

## 開発ルール
- 言語：UI は日本語。コード・コミットは英語。コメントは最小限。
- パッケージマネージャは pnpm。
- 環境変数は `.env.local`（`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`）。`.env.example` を必ず更新。シークレットはコミットしない。
- DB 変更は必ず `supabase/migrations/*.sql`。全テーブルに RLS（`auth.uid() = user_id`）。システム種目・システム食品は `user_id IS NULL` で全員読み取り可。
- 型は `supabase gen types typescript` で `src/types/database.ts` に生成し、手書きしない。
- ロジック（1RM、移動平均、目標ライン、PFC 組合せ）は `src/lib/` に純粋関数で置き、Vitest でテストする。
- コンポーネントは `src/components/`、画面は `src/app/(app)/<tab>/`。shadcn の既定スタイルはそのまま使わず、`design tokens`（下記）で上書きする。
- モバイルファースト（375px 基準）。タップ領域 48px 以上。主要操作は画面下 1/3。
- オフライン：書き込みは Dexie キューに積んでから Supabase へ同期。読み取りは TanStack Query のキャッシュ。

## デザイントークン（Tailwind 設定に反映）
- bg `#0A0A0C` / card `#141418` / border `#26262C` / fg `#F2F2F2` / muted `#9A9AA3` / ghost `#5C5C66`
- accent `#FF4D1C` / warn `#FFB020` / danger `#FF3B30`
- 数字：Barlow Condensed 700 + `tabular-nums`。和文：Noto Sans JP。
- radius 8px。グラデーション・グラス・イラスト・絵文字・紙吹雪は禁止。

## メンタル設計ルール（違反しない）
- ストリークは記録継続のみ。体重減少を称賛しない。
- 判断メッセージは週平均のみ。日次体重の増減で煽らない。
- 目標はレンジ表示。「未達」の赤表示はしない。
- 提案には根拠を一文添える。

## 作業の進め方
- 大きな変更の前に計画を短く示す。1 PR = 1 機能。
- 各フェーズ完了時に `pnpm lint && pnpm test && pnpm build` を通す。
- 実装状況は `docs/PROGRESS.md` に追記する（日付・やったこと・次）。
