# Claude Code キックオフプロンプト

`kensan/` フォルダで Claude Code を起動し、以下をそのまま貼る。

---

このフォルダは「研鑽（KENSAN）」というフィジーク競技者向けのトレーニング・食事・体重・コンディション記録 Web アプリ（スマホ最適化 PWA）の新規プロジェクトです。まだコードはありません。

まず次を読んでください：
1. `CLAUDE.md`（開発ルール・デザイントークン・メンタル設計ルール）
2. `docs/01_requirements.md`（要件・画面・機能フェーズ・データモデル・ロジック仕様。これを正とする）
3. `design/mockups/` の PNG 全部（UI の正。00_board → 01〜06 の順で見て、色・余白・タイポ・コンポーネント形状を把握する）

読み終えたら、MVP を次の順でフェーズ分けして実装してください。各フェーズの着手前に、作るファイルと判断事項を短く提示して私の OK を待ってから進めてください。

Phase 0 — 土台
- pnpm で Next.js 15 (App Router, TypeScript) + Tailwind + shadcn/ui を初期化
- `CLAUDE.md` のデザイントークンを tailwind.config と globals.css に反映（bg / card / border / fg / muted / ghost / accent / warn / danger、Barlow Condensed + Noto Sans JP、radius 8px、tabular-nums）
- Supabase クライアント（@supabase/ssr）、`.env.example`、`supabase/` ディレクトリ
- `supabase/migrations/0001_init.sql`：要件書 §8 の全テーブル + RLS + ビュー（v_weight_trend / v_weekly_volume / v_weekly_report）
- `supabase gen types` の npm script
- 下タブ5つ（ホーム/トレ/食事/コンディション/分析）のアプリシェルと「D-xx | PREP DAY n」ヘッダー
- Vitest / Playwright / ESLint / Prettier、GitHub Actions で lint+test+build
- `docs/PROGRESS.md` を作成

Phase 1 — 認証・オンボーディング・プレップ設定
- 要件書 §0.1 のオンボーディング（スプラッシュ → 認証 → 銘を切る → 身体 → プレップ設定 or スキップ）
- 刃文パターンは inline SVG で実装（1px 白線、不透明度 10〜15%）。刀のイラストは使わない
- プレップ設定画面は `06_prep-setup.png` に合わせる。D-xx と目標ラインの計算は `src/lib/prep.ts` に純粋関数 + テスト

Phase 2 — 朝のチェックイン・ホーム
- `04_condition-checkin.png` と `01_home.png`
- 体重トレンド（7日移動平均、欠損は線形補間）は `src/lib/trend.ts` + テスト
- 体重チャートは Recharts：灰ドット + アクセント実線 + 白点線目標

Phase 3 — トレーニング
- 種目マスタ（システム種目の seed を 60 種目程度、筋群タグ付き）、種目メモ、ルーティン CRUD
- `02_workout-active.png` のワークアウト実行：前回値ゴースト、✓で確定 → レストタイマー自動起動、セット種別、RIR、下部固定タイマー
- 推定1RM（Epley）と PR 検知は `src/lib/strength.ts` + テスト
- ワークアウト完了サマリー

Phase 4 — 食事
- 八訂成分表の CSV インポートスクリプト（`scripts/import-foods.ts`。CSV は私が後で置く。先にスキーマとサンプル 30 件で動かす）
- `03_nutrition.png`：PFC バー、マイ定食（1タップ記録）、食事枠ごとのグラムリスト、テンキー入力
- PFC 目標（トレ日/オフ日）
- 「残りを埋める」提案は `src/lib/fill.ts`（要件書 §9 のアルゴリズム）+ テスト

Phase 5 — 分析・PWA・仕上げ
- `05_analysis-weekly.png`：12週トレンド、主観ヒートマップ（5×7）、筋群別セット数の人体ヒートマップ（inline SVG、前面/背面）
- CSV エクスポート
- PWA 化（manifest、Service Worker、オフライン書き込みキュー → 同期、レストタイマー通知）
- モバイル実機での確認項目を `docs/QA.md` に列挙

守ること
- UI は日本語、コードとコミットは英語
- 全テーブル RLS。シークレットはコミットしない
- モバイルファースト 375px、タップ領域 48px 以上、主要操作は画面下 1/3
- 禁止：グラデーション、グラス、イラスト、絵文字、紙吹雪、体重減少を称賛する表現
- 各フェーズ完了時に `pnpm lint && pnpm test && pnpm build` を通し、`docs/PROGRESS.md` に追記

まず Phase 0 の計画（ディレクトリ構成と使うパッケージのバージョン）を提示してください。

---

## 補足：Supabase / Vercel の準備（人間側）

1. Supabase で新規プロジェクト作成 → Project URL と anon key を `.env.local` に
2. GitHub にリポジトリ作成 → Vercel で Import → 環境変数に同じ2つを設定
3. 八訂成分表 CSV（文部科学省「日本食品標準成分表2020年版（八訂）」の Excel を CSV 化）を `data/foods_mext8.csv` に置く
4. Supabase Auth で Google プロバイダを有効化（任意、メールリンクだけでも可）
