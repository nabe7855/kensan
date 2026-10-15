# 研鑽（KENSAN） — 要件定義書（v0.1 / 2026-10-15）

フィジーク・ボディビル競技者と本格志向トレーニー向けの、トレーニング・食事・体重・コンディション（メンタル）を一つの時間軸で記録し、減量期を客観視して乗り越えるための Web アプリ（スマホ最適化 PWA）。

## 0. アプリ名と世界観

**研鑽（KENSAN）**。自分を名刀のように、最後の最後まで研ぎ切る。減量は「鍛える（増量期）→ 焼き入れる（減量期）→ 研ぐ（ピークウィーク）→ 研ぎ上がり（大会）」の工程として扱う。

モチーフは刀そのものではなく「刀の表情」で表現する。剣のイラストやゲーム的な装飾は使わない。

| モチーフ | 使い方 |
| --- | --- |
| 刃文（はもん） | 登録・オンボーディング画面の背景に、波打つ刃文の細い白線（1px、不透明度10〜15%）を薄く敷く |
| 焼き入れの光 | ロゴ「研鑽」の文字を黒地に置き、縁だけがブラッドオレンジに焼けたような表現。アクセント色 `#FF4D1C` はこの「焼き入れ色」 |
| 銘（めい） | ユーザー名を「銘」と呼ぶ。登録＝刀に自分の名を刻む儀式。入力欄は縦長の黒い短冊、文字は刻印風 |
| 研ぎ目 | オンボーディングの進捗バーは斜めの細いヘアライン（砥石の研ぎ目） |
| 工程名 | プレップのフェーズ名を「鍛・焼・研・仕上」で表示できる（設定で通常名に切替可） |
| 研ぎ上がり | 大会日に刃文が全面に光る演出。減量完走の報酬 |

ユーザーが「自分はこれを使っている」と自己満足に浸れる、静かで硬質なかっこよさを目指す。

### 0.1 オンボーディング（登録）フロー
1. スプラッシュ：黒地に「研鑽」ロゴ（焼き入れの縁光）、刃文が下から静かに浮かぶ（1.2秒）
2. 認証：メールマジックリンク / Google。ボタンは2つだけ
3. 銘を切る：「銘」＝表示名を入力。入力中は文字が刻印されるようにわずかに発光
4. 身体：身長・性別・単位
5. プレップ設定（06_prep-setup.png）または「今はスキップ」
6. 完了：「研ぎ始める」ボタン → ホーム

## 1. コンセプト

- 一般向けアプリは「楽に・だいたい合っていればいい」。本アプリは「厳密に・自分の数字を知りたい」人向け。
- 食品はグラム入力が既定（「1人前」は使わない）。トレはセット単位で重量・回数・RIR。
- 減量期は固定メニューになるので「マイ定食」をテンプレ化し、残りPFCを登録食品でやりくりする提案を出す。
- 大会日から逆算した「D-xx」を常時表示し、体重・主観指標・トレボリュームを同じ週次レポートに重ねる。
- 提案には必ず根拠を添える（例：「週平均が3週停滞。睡眠が基準比 -1.2。ダイエットブレイクを検討」）。

## 2. 差別化5軸

1. 大会日逆算の減量ロードマップ（D-xx、週次目標体重ライン、リフィード/ダイエットブレイク予定、ピークウィーク）
2. トレ×食×体重×主観指標を同一時間軸で重ねる週次レポート
3. グラム厳密の「マイ定食」と残りPFCのやりくり提案
4. メンタルを競技データとして扱う（毎朝5項目1〜5、週次 Hooper Index）
5. 「なぜその調整か」を必ず説明する

## 3. 画面一覧とナビゲーション

下タブ5つ：ホーム ｜ トレ ｜ 食事 ｜ コンディション ｜ 分析。全画面上部に「D-42 | PREP DAY 56」ヘッダー（プレップ未設定時は非表示）。

モック画像は `design/mockups/` を参照。ファイル名と画面の対応：

| ファイル | 画面 | フェーズ |
| --- | --- | --- |
| 00_board.png | 3画面ボード（トーン基準） | — |
| 01_home.png | ホーム | MVP |
| 02_workout-active.png | ワークアウト実行 | MVP |
| 03_nutrition.png | 食事（今日） | MVP |
| 04_condition-checkin.png | 朝のチェックイン | MVP |
| 05_analysis-weekly.png | 週次分析 | MVP（提案カードは Phase 2） |
| 06_prep-setup.png | プレップ設定 | MVP |

モックの無い MVP 画面（モックの作法に合わせて実装する）：
- トレタブのトップ（ルーティン一覧・今日のルーティン・履歴カレンダー）
- ワークアウト完了サマリー（総ボリューム・PR・所要時間）
- 食品検索／マイ食品追加、マイ定食の編集
- 設定（プロフィール、単位、ログアウト）
- オンボーディング（ログイン → プロフィール → プレップ設定 or スキップ）

### 3.1 ホーム
- 今朝の体重（巨大数字）と週平均（7日移動平均）＋増減矢印
- 30日体重チャート：灰ドット（日次）＋アクセント実線（7日平均）＋白点線（目標ライン）
- 残りPFC/kcalの4本バー
- 「今日のトレ: Push A」カード＋「開始」ボタン
- 朝のチェックイン5項目のチップ（未入力なら入力導線）

### 3.2 ワークアウト実行
- 種目タイトル＋永続メモ（シート角度など、種目単位で保存）
- セット表：SET ｜ 前回（灰ゴースト）｜ kg ｜ 回 ｜ RIR ｜ ✓
- 前回値をプレースホルダとして事前充填。✓で確定しレストタイマー自動起動
- 下部固定レストタイマー（リング＋「+30s」「スキップ」）、ロック画面通知（PWA）
- セット種別：通常／ウォームアップ／ドロップ／スーパーセット／失敗
- 重量ステッパーは 0.25kg / 2.5kg、タップ領域 48px 以上、入力は画面下半分
- 完了時に推定1RM（Epley）とPRを判定し、控えめな発光で通知

### 3.3 食事
- 上部：P/F/C/kcal の摂取/目標
- 「マイ定食」ピン留めカード（横スクロール）→ タップで1タップ記録
- 食事枠（朝/昼/トレ前/夜、ユーザーが枠を追加可）ごとのグラム表示リスト
- 「残りを埋める」提案カード（マイ食品の線形組合せで残りPFCを満たす候補）
- 下部に数値テンキー（g単位）＋「追加」
- 食品DB：八訂成分表（100gあたり）＋ユーザー食品。調理後/生の区別

### 3.4 コンディション（朝のチェックイン）
- 体重入力（巨大数字）
- 5項目 1〜5 セグメント：空腹・睡眠・気分・活力・性欲
- 便通（良/普通/悪）、ひとこと（1行）、任意で安静時心拍・起床時体温
- 「記録」1ボタン。30秒で完了する設計

### 3.5 分析（週次）
- 12週体重トレンド（灰ドット＋アクセント実線＋白点線目標）
- 主観指標ヒートマップ（5項目 × 直近7日。悪化はアンバー）
- 筋群別週間セット数の人体ヒートマップ（前面/背面）
- 「今週の提案」カード（Phase 2：根拠付き一文）
- 週次 Hooper Index（睡眠・疲労・ストレス・筋肉痛 各1〜7）の入力導線

### 3.6 プレップ設定
- 大会名、大会日、開始体重、目標体重、週ペース（%/週、スライダー）＋予測ライン
- 「なぜやるのか」テキスト（スコア悪化時にホームで再表示）
- リバースダイエット計画も作る（トグル）
- 「プレップ開始」

## 4. 機能一覧（フェーズ分け）

### MVP
- 認証（Supabase Auth：メールマジックリンク / Google）
- プロフィール（身長・性別・単位）
- プレップ設定（D-xx 計算、目標ライン生成）
- 朝のチェックイン（体重＋5項目＋便通＋ひとこと）
- 体重トレンド（7日移動平均、欠損日は線形補間）
- 種目マスタ（システム種目＋ユーザー種目、筋群タグ）、種目メモ
- ルーティン（テンプレ）作成・編集
- ワークアウト実行（セット記録、前回値、レストタイマー、セット種別、RIR）
- 推定1RM、PR検知、ワークアウト完了サマリー
- 食品DB（八訂）インポート、マイ食品、マイ定食
- 食事記録（グラム）、PFC目標（トレ日/オフ日）、残りPFC表示
- 「残りを埋める」提案（マイ食品の組合せ探索、サーバー側）
- 週次分析（体重トレンド、主観ヒートマップ、筋群別セット数）
- CSV エクスポート（トレ・食事・チェックイン）
- PWA（オフライン記録キュー → 同期、レストタイマー通知）

### Phase 2
- 週次 Hooper Index、月次 PHQ-2/GAD-2（閾値超えで専門家相談を案内。診断はしない）
- 「今週の提案」（停滞×主観悪化でリフィード/ダイエットブレイクを根拠付きで提案）
- 消費エネルギー逆算（MacroFactor方式）と PFC 目標の週次提案
- セッション後フィードバック（パンプ/筋肉痛/関節/負荷感）とメソサイクル（蓄積→デロード）
- 進捗写真（週1、3ポーズ、日付比較）、周囲径
- 有酸素・歩数・ポージング練習ログ
- Strong/Hevy CSV インポート
- 週次レポートの共有リンク（コーチ向け）

### Phase 3
- ピークウィークプランナー（糖質 g/kg・水分・塩分の日別タイムライン、リハーサル）
- 冷蔵庫在庫 → 残りPFC × 在庫からメニュー候補（LLM）
- Apple Health / Health Connect 連携

## 5. メンタル設計ルール（必ず守る）

- ストリークは「記録継続日数」のみ。「体重減少連続日数」等は作らない。
- 日次体重はトレンドより小さく表示。判断メッセージは週平均でのみ出す。
- 目標はレンジ（±100kcal、±200g）。固定値への「未達」表示はしない。
- 主観指標が3日連続で基準比悪化 → 根拠付きで提案。強制・警告調にしない。
- 進捗写真は週1に制限（撮影済みはロック表示）。
- 「なぜやるのか」を減量開始時に書かせ、スコア悪化時にホームで再表示。
- PHQ-2/GAD-2 は診断ではなくスクリーニング。閾値超えは専門家相談を案内する文言のみ。

## 6. デザイン言語（design/mockups を正とする）

| 要素 | 指定 |
| --- | --- |
| 背景 | `#0A0A0C`（ニアブラック）。カード `#141418`、境界線 `#26262C` 1px、カード上端に1pxハイライト、微細なノイズテクスチャ |
| アクセント | `#FF4D1C`（ブラッドオレンジ）1色のみ |
| 状態色 | 注意 `#FFB020`（アンバー）、危険 `#FF3B30`。これ以外の色は使わない |
| 文字色 | 主 `#F2F2F2`、副 `#9A9AA3`、ゴースト `#5C5C66` |
| 数字フォント | Barlow Condensed 700、`font-variant-numeric: tabular-nums`。主数値 72〜96px |
| 和文フォント | Noto Sans JP。ラベル 11〜12px、英語マイクロラベルは大文字＋letter-spacing 0.12em |
| 角丸 | 8px（カード・ボタン・入力） |
| 禁止 | グラデーション、グラスモーフィズム、イラスト、写真、絵文字、紙吹雪 |
| モーション | 数値カウントアップ 300ms、セット確定時のハプティクス＋アクセントの一瞬の発光、PR時の短いフラッシュ |
| 文言 | 短く、命令形に近い。「おめでとう！」ではなく「PR. 140kg × 5」 |
| タップ領域 | 48px 以上。主要操作は画面下1/3 |

## 7. 技術構成

| 層 | 選定 |
| --- | --- |
| フロント | Next.js 15 (App Router) + TypeScript + Tailwind CSS + shadcn/ui |
| 状態/通信 | TanStack Query + @supabase/ssr。オフラインキューは Dexie (IndexedDB) |
| チャート | Recharts（体重トレンド・ヒートマップ）、人体ヒートマップは inline SVG |
| PWA | next-pwa または Serwist。Web Push でレストタイマー通知 |
| 認証 | Supabase Auth。RLS で `auth.uid() = user_id` |
| DB | Supabase Postgres。集計は SQL ビュー + pg_cron |
| ストレージ | Supabase Storage（進捗写真、Phase 2） |
| デプロイ | GitHub → Vercel（Preview/Production）。Supabase はブランチ運用なしで単一プロジェクト（dev は local） |
| テスト | Vitest（ロジック：1RM・移動平均・PFC組合せ）、Playwright（主要フロー） |

## 8. データモデル（初期）

```sql
-- すべてのテーブルに user_id uuid references auth.users, created_at, updated_at。RLS 必須。

profiles(user_id pk, display_name, height_cm, sex, unit_pref)
preps(id pk, user_id, contest_name, contest_date, start_date, start_weight_kg, target_weight_kg,
      weekly_rate_pct, why_text, reverse_plan jsonb, is_active bool)
daily_checkins(user_id, date, weight_kg, hunger, sleep, mood, energy, libido smallint 1-5,
      bowel text, note, rhr smallint, temp_c numeric, unique(user_id, date))
weekly_checkins(user_id, week_start, hooper_sleep, hooper_fatigue, hooper_stress, hooper_soreness smallint 1-7,
      waist_cm numeric, photo_ids uuid[], unique(user_id, week_start))
exercises(id pk, user_id null=system, name_ja, name_en, muscle_groups text[], equipment, is_custom)
exercise_notes(user_id, exercise_id, note, unique(user_id, exercise_id))
routines(id pk, user_id, name, order_idx)
routine_exercises(id pk, routine_id, exercise_id, order_idx, target_sets, target_reps, target_rir, rest_sec)
workouts(id pk, user_id, routine_id null, started_at, ended_at, pump, soreness, joint, load_feel smallint null)
workout_sets(id pk, workout_id, exercise_id, set_no, set_type text, weight_kg numeric, reps smallint,
      rir smallint, is_pr bool, done_at)
foods(id pk, user_id null=system, source text, name, kcal, protein_g, fat_g, carb_g, fiber_g, sodium_mg per 100g,
      is_cooked bool)
meal_templates(id pk, user_id, name, order_idx)
meal_template_items(id pk, template_id, food_id, grams numeric)
meal_logs(id pk, user_id, date, slot text)
meal_log_items(id pk, meal_log_id, food_id, grams numeric)
nutrition_targets(id pk, user_id, effective_from date, day_type text 'train'|'off', kcal, protein_g, fat_g, carb_g)
pantry_items(id pk, user_id, food_id, grams_available, expires_on)   -- Phase 3

-- views
v_weight_trend(user_id, date, weight_kg, trend_kg)          -- 7日移動平均、欠損は線形補間
v_weekly_volume(user_id, week_start, muscle_group, sets)   -- 筋群×週セット数
v_weekly_report(user_id, week_start, avg_weight, delta_kg, avg_hunger, avg_sleep, avg_mood,
                total_sets, avg_kcal)                      -- 週次レポート1行
```

## 9. 主要ロジック仕様

- 推定1RM：Epley `w × (1 + reps/30)`。reps=1 は実測値。
- 体重トレンド：直近7日の単純移動平均。欠損日は前後の実測値から線形補間。表示は生値を淡く、トレンドを濃く。
- D-xx：`contest_date - today`。PREP DAY：`today - start_date + 1`。
- 目標ライン：`start_weight × (1 - weekly_rate_pct/100)^(week)`、大会日で target_weight に到達するようレートを上限 1.0%/週で丸める。
- 残りを埋める：残りPFCに対し、マイ食品（上位20件）から 1〜2 品の組合せを 10g 刻みで探索し、誤差（P優先、次にC、F）が最小の候補を3件返す。
- PFC目標：日付のトレ日/オフ日判定は「その日にワークアウトがあるか」ではなく、ルーティンの曜日設定で事前決定（当日の切替も可）。

## 10. 発起人への未確認事項

- アクセント色（オレンジで進める。ライムは代案）
- 朝のチェックイン5項目（性欲を含めるかは設定でON/OFF可にする）
- トレ日/オフ日でPFC目標を変える運用か
- コーチ共有の必要性（Phase 2）
- 冷蔵庫機能の優先度（Phase 3 のまま）
