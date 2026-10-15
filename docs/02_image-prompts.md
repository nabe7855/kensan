# GPT Image 2 用プロンプト集（コピペ用・結合済み）

使い方
1. まず「0. ボード」をオレンジ版・ライム版の2回生成してトーンを決める（ライム版は `#FF4D1C` を `#C8FF00` に全置換、`blood orange` を `acid lime` に置換）。
2. 決まった色で「1. ホーム」を生成。気に入った1枚を保存。
3. 2画面目以降は、その1枚を参照画像として添付し、各プロンプト末尾の【参照画像あり】の一文を付ける。
4. 日本語の誤字は「○○を△△に直して」と1回指示すれば直る。判定はフルサイズをダウンロードして確認。

---

## 0. ボード（トーン確認用・最初に1枚だけ）

```
A presentation board showing three mobile app screens of a Japanese contest-prep tracking app for physique competitors (bodybuilding / men's physique). Three iPhone 15 Pro frames side by side on a dark concrete surface, slight perspective, dramatic rim light from the upper left, 16:9, 2K. Rendered as a shipped production UI, not concept art.

Theme: near-black background #0A0A0C, cards #141418 with 1px #26262C borders and a subtle 1px top highlight, fine grain texture. Single accent color: blood orange #FF4D1C. Status colors only: amber #FFB020, red #FF3B30. No gradients, no glassmorphism, no illustrations, no people, no stock photos, no emoji.
Typography: large condensed numerals (Barlow Condensed Bold, tabular figures) for all key numbers; Japanese UI labels in Noto Sans JP; small uppercase English micro-labels with wide letter-spacing.
Mood: underground gym, iron and concrete, heavy bass. Masculine, disciplined, premium. Industrial, not playful.
Every screen has a thin persistent header reading "D-42 | PREP DAY 56" and a bottom tab bar with 5 items: ホーム, トレ, 食事, コンディション, 分析.

Left screen (Home): hero number "71.4" with unit "kg" and label "今朝", a 30-day weight chart (gray dots, blood-orange 7-day average line, white dotted target line), four macro bars "P 42g" "F 12g" "C 85g" "kcal 610", a card "今日のトレ: Push A" with an orange button "開始".
Center screen (Active workout): title "ベンチプレス", a set table with columns SET / 前回 / kg / 回 / RIR / ✓, three completed rows and one active row, a sticky bottom rest timer "1:42" with a thin orange progress ring.
Right screen (Weekly analysis): 12-week weight trend chart, a 5x7 heatmap grid with row labels 空腹 睡眠 気分 活力 性欲, and a front/back body silhouette heatmap of weekly sets per muscle group.

Use only the Japanese text quoted above; do not invent extra text; spelling must be exact.
```

---

## 1. ホーム

```
A mobile app screen mockup for a Japanese contest-prep tracking app for physique competitors. iPhone 15 Pro frame, 9:16, 2K, rendered as a shipped production UI (not concept art).

Theme: near-black background #0A0A0C, cards #141418 with 1px #26262C borders and a subtle 1px top highlight, fine grain texture. Single accent color: blood orange #FF4D1C. Status colors only: amber #FFB020, red #FF3B30. No gradients, no glassmorphism, no illustrations, no people, no stock photos, no emoji.
Typography: large condensed numerals (Barlow Condensed Bold, tabular figures) for all key numbers; Japanese UI labels in Noto Sans JP; small uppercase English micro-labels with wide letter-spacing.
Mood: underground gym, iron and concrete, heavy bass. Masculine, disciplined, premium. Industrial, not playful.
Top of the screen: a thin persistent header reading "D-42 | PREP DAY 56".
Bottom tab bar with 5 items: ホーム, トレ, 食事, コンディション, 分析. The active tab is ホーム, highlighted in the accent color.

Screen: Home.
- Hero number "71.4" with unit "kg" and a small label "今朝". Beside it, smaller: "週平均 71.8" with a small downward arrow in the accent color.
- Below: a 30-day weight chart. Gray dots for daily values, a solid blood-orange line for the 7-day average, a white dotted horizontal target line. Minimal axes.
- Then four horizontal macro bars labeled "P" "F" "C" "kcal" showing remaining amounts "P 42g" "F 12g" "C 85g" "kcal 610". Bars are filled in the accent color on a dark track.
- Then a card titled "今日のトレ: Push A" with a large full-width orange button "開始".
- Then a row of five small chips reading "空腹 4" "睡眠 3" "気分 3" "活力 2" "性欲 2".

Use only the Japanese text quoted above; do not invent extra text; spelling must be exact.
```

---

## 2. ワークアウト実行

```
A mobile app screen mockup for a Japanese contest-prep tracking app for physique competitors. iPhone 15 Pro frame, 9:16, 2K, rendered as a shipped production UI (not concept art).

Theme: near-black background #0A0A0C, cards #141418 with 1px #26262C borders and a subtle 1px top highlight, fine grain texture. Single accent color: blood orange #FF4D1C. Status colors only: amber #FFB020, red #FF3B30. No gradients, no glassmorphism, no illustrations, no people, no stock photos, no emoji.
Typography: large condensed numerals (Barlow Condensed Bold, tabular figures) for all key numbers; Japanese UI labels in Noto Sans JP; small uppercase English micro-labels with wide letter-spacing.
Mood: underground gym, iron and concrete, heavy bass. Masculine, disciplined, premium. Industrial, not playful.
Top of the screen: a thin persistent header reading "D-42 | PREP DAY 56".
Bottom tab bar with 5 items: ホーム, トレ, 食事, コンディション, 分析. The active tab is トレ.

Screen: Active workout.
- Exercise title "ベンチプレス" in large text. Under it a small gray note: "メモ: シート角度 30°".
- A set table with column headers "SET" "前回" "kg" "回" "RIR" and a checkmark column. Four rows. Rows 1 to 3 are completed: the checkmark is filled in blood orange, values like "100 × 8" in the 前回 column are gray ghost text, kg "100", 回 "8", RIR "2". Row 4 is active: its kg and 回 input fields are highlighted with an accent border and show "100" and "8", RIR shows "1".
- A sticky bottom panel: a large rest timer numeral "1:42" with a thin blood-orange progress ring around it, and two buttons "+30s" and "スキップ".
- The whole layout must be operable with one thumb: big tap targets, inputs in the lower half.

Use only the Japanese text quoted above; do not invent extra text; spelling must be exact.
```

【参照画像あり】の場合、末尾に追加:
```
Keep the exact color palette, spacing, typography and card style of the attached reference screen. Change only the content described above.
```

---

## 3. 食事

```
A mobile app screen mockup for a Japanese contest-prep tracking app for physique competitors. iPhone 15 Pro frame, 9:16, 2K, rendered as a shipped production UI (not concept art).

Theme: near-black background #0A0A0C, cards #141418 with 1px #26262C borders and a subtle 1px top highlight, fine grain texture. Single accent color: blood orange #FF4D1C. Status colors only: amber #FFB020, red #FF3B30. No gradients, no glassmorphism, no illustrations, no people, no stock photos, no emoji, no food photos.
Typography: large condensed numerals (Barlow Condensed Bold, tabular figures) for all key numbers; Japanese UI labels in Noto Sans JP; small uppercase English micro-labels with wide letter-spacing.
Mood: underground gym, iron and concrete, heavy bass. Masculine, disciplined, premium. Industrial, not playful.
Top of the screen: a thin persistent header reading "D-42 | PREP DAY 56".
Bottom tab bar with 5 items: ホーム, トレ, 食事, コンディション, 分析. The active tab is 食事.

Screen: Nutrition, today.
- Top: four macro bars with consumed / target: "P 158 / 200g" "F 38 / 50g" "C 165 / 250g" "kcal 1,640 / 2,250".
- A horizontally scrolling row of pinned cards titled "マイ定食" with three cards: "減量朝食" "トレ後" "夜固定".
- A list grouped by meal with small section labels "朝" "昼" "トレ前" "夜". Items are written with exact grams, for example "鶏むね肉 150g" "白米 180g" "卵 2個" "ブロッコリー 100g". Each item shows its kcal on the right in gray.
- A suggestion card titled "残りを埋める" with one line: "鶏むね 120g + 白米 150g".
- Bottom: a large dark numeric keypad with a "g" unit key and an orange confirm key "追加".

Use only the Japanese text quoted above; do not invent extra text; spelling must be exact.
```

---

## 4. コンディション（朝のチェックイン）

```
A mobile app screen mockup for a Japanese contest-prep tracking app for physique competitors. iPhone 15 Pro frame, 9:16, 2K, rendered as a shipped production UI (not concept art).

Theme: near-black background #0A0A0C, cards #141418 with 1px #26262C borders and a subtle 1px top highlight, fine grain texture. Single accent color: blood orange #FF4D1C. Status colors only: amber #FFB020, red #FF3B30. No gradients, no glassmorphism, no illustrations, no people, no stock photos, no emoji.
Typography: large condensed numerals (Barlow Condensed Bold, tabular figures) for all key numbers; Japanese UI labels in Noto Sans JP; small uppercase English micro-labels with wide letter-spacing.
Mood: underground gym, iron and concrete, heavy bass. Masculine, disciplined, premium. Industrial, not playful.
Top of the screen: a thin persistent header reading "D-42 | PREP DAY 56".
Bottom tab bar with 5 items: ホーム, トレ, 食事, コンディション, 分析. The active tab is コンディション.

Screen: Morning check-in. Minimal, fast, thumb-reachable.
- A large weight input showing "71.4" with unit "kg" and a small label "今朝の体重".
- Five rows, each with a Japanese label on the left and a 1–5 segmented control on the right (five equal segments, the selected one filled in blood orange): "空腹" (4 selected), "睡眠" (3), "気分" (3), "活力" (2), "性欲" (2).
- A three-option selector labeled "便通" with options "良" "普通" "悪".
- A single-line text field with placeholder "ひとこと".
- A large full-width orange button "記録".

Use only the Japanese text quoted above; do not invent extra text; spelling must be exact.
```

---

## 5. 分析（週次）

```
A mobile app screen mockup for a Japanese contest-prep tracking app for physique competitors. iPhone 15 Pro frame, 9:16, 2K, rendered as a shipped production UI (not concept art).

Theme: near-black background #0A0A0C, cards #141418 with 1px #26262C borders and a subtle 1px top highlight, fine grain texture. Single accent color: blood orange #FF4D1C. Status colors only: amber #FFB020, red #FF3B30. No gradients, no glassmorphism, no illustrations, no people, no stock photos, no emoji.
Typography: large condensed numerals (Barlow Condensed Bold, tabular figures) for all key numbers; Japanese UI labels in Noto Sans JP; small uppercase English micro-labels with wide letter-spacing.
Mood: underground gym, iron and concrete, heavy bass. Masculine, disciplined, premium. Industrial, not playful.
Top of the screen: a thin persistent header reading "D-42 | PREP DAY 56".
Bottom tab bar with 5 items: ホーム, トレ, 食事, コンディション, 分析. The active tab is 分析.

Screen: Weekly analysis.
- Top: a 12-week weight trend chart. Gray dots for daily values, a solid blood-orange 7-day average line, a white dotted target line. Small label "WEEK AVG".
- Middle: a heatmap grid, 5 rows with labels "空腹" "睡眠" "気分" "活力" "性欲", 7 columns for the last 7 days. Cells shade from dark gray (good) to amber (worse). A few cells in the 睡眠 row are amber.
- Below: a front and back human body silhouette, flat and schematic, shaded as a heatmap of weekly sets per muscle group, with small labels "胸 16" "背中 18" "脚 14" "肩 12".
- Bottom: a card titled "今週の提案" with one line of text: "週平均が3週停滞。睡眠が基準比 -1.2。ダイエットブレイクを検討".

Use only the Japanese text quoted above; do not invent extra text; spelling must be exact.
```

---

## 6. プレップ設定（任意）

```
A mobile app screen mockup for a Japanese contest-prep tracking app for physique competitors. iPhone 15 Pro frame, 9:16, 2K, rendered as a shipped production UI (not concept art).

Theme: near-black background #0A0A0C, cards #141418 with 1px #26262C borders and a subtle 1px top highlight, fine grain texture. Single accent color: blood orange #FF4D1C. Status colors only: amber #FFB020, red #FF3B30. No gradients, no glassmorphism, no illustrations, no people, no stock photos, no emoji.
Typography: large condensed numerals (Barlow Condensed Bold, tabular figures) for all key numbers; Japanese UI labels in Noto Sans JP; small uppercase English micro-labels with wide letter-spacing.
Mood: underground gym, iron and concrete, heavy bass. Masculine, disciplined, premium. Industrial, not playful.
No bottom tab bar on this screen; a back arrow at the top left and a title "プレップ設定".

Screen: Prep setup.
- A field "大会" with value "FWJ 東京 2027" and a date field "大会日" with value "2027.04.18".
- Two large numbers side by side: "開始体重 78.0" and "目標体重 70.0", unit "kg".
- A slider labeled "週ペース" showing "0.5 %/週", with a thin line chart preview of the projected weight line descending to the target date.
- A text area labeled "なぜやるのか" with placeholder "きつい時に表示されます".
- A toggle row "リバースダイエット計画も作る".
- A large full-width orange button "プレップ開始".

Use only the Japanese text quoted above; do not invent extra text; spelling must be exact.
```

---

# 追加プロンプト（2026-10-15 追加）

参照画像として `01_home.png` を添付し、末尾の一文（Keep the exact color palette...）を付けて生成する。

## 7. 登録画面（銘を切る）— 名刀モチーフ

```
A mobile app screen mockup for a Japanese contest-prep tracking app for physique competitors named "研鑽". iPhone 15 Pro frame, 9:16, 2K, rendered as a shipped production UI (not concept art).

Theme: near-black background #0A0A0C, cards #141418 with 1px #26262C borders and a subtle 1px top highlight, fine grain texture. Single accent color: blood orange #FF4D1C. No gradients, no glassmorphism, no illustrations, no people, no stock photos, no emoji. Absolutely no drawing of a sword, blade, katana or weapon.
Typography: large condensed numerals (Barlow Condensed Bold); Japanese text in Noto Sans JP; small uppercase English micro-labels with wide letter-spacing.
Mood: a master swordsmith's workshop at night, quenched steel, iron and concrete, heavy bass. Masculine, disciplined, premium, quiet.

Screen: Sign-up step "銘を切る" (engrave your name).
- Background: a faint, wavy "hamon" temper-line pattern drawn as thin 1px white lines at 10–15% opacity, flowing diagonally across the lower half of the screen, like the temper line of a polished Japanese blade. Subtle, not decorative.
- Top: the app logo "研鑽" in large bold Japanese characters, black fill with only the edges glowing blood orange as if the steel were just quenched.
- Under the logo, a small uppercase micro-label "KENSAN".
- A thin diagonal hairline progress indicator with 4 segments, the first segment filled in blood orange, and a small label "1 / 4".
- Center: a tall vertical black plaque (a narrow rectangle with 1px #26262C border) labeled "銘" with a text field inside showing the placeholder "名を刻む". The typed sample text "MORI" appears engraved: slightly embossed, letters glowing faintly orange at their edges.
- A one-line caption under the plaque: "刀に名を刻むように、自分の名を刻む".
- Bottom: a large full-width orange button "刻む".

Use only the Japanese text quoted above; do not invent extra text; spelling must be exact.
```

## 8. スプラッシュ／ログイン

```
A mobile app screen mockup for a Japanese contest-prep tracking app for physique competitors named "研鑽". iPhone 15 Pro frame, 9:16, 2K, rendered as a shipped production UI (not concept art).

Theme: near-black background #0A0A0C, single accent color blood orange #FF4D1C, fine grain texture. No gradients, no glassmorphism, no illustrations, no people, no stock photos, no emoji. Absolutely no drawing of a sword, blade, katana or weapon.
Typography: Japanese text in Noto Sans JP; small uppercase English micro-labels with wide letter-spacing.
Mood: quenched steel in a dark forge, iron and concrete, heavy bass. Masculine, disciplined, premium, quiet.

Screen: Splash / login.
- Center: the app logo "研鑽" very large, black fill with only the edges glowing blood orange as if just quenched. Under it a micro-label "KENSAN" and one line: "最後まで、研ぎ切る".
- Background: a faint wavy "hamon" temper-line pattern of thin 1px white lines at 10% opacity rising from the bottom edge.
- Bottom: two full-width buttons stacked: an orange button "メールで続ける" and a dark outlined button "Google で続ける". Under them a tiny gray line "利用規約 ・ プライバシー".

Use only the Japanese text quoted above; do not invent extra text; spelling must be exact.
```

## 9. ワークアウト完了サマリー（任意）

```
A mobile app screen mockup for a Japanese contest-prep tracking app for physique competitors. iPhone 15 Pro frame, 9:16, 2K, rendered as a shipped production UI (not concept art).

Theme: near-black background #0A0A0C, cards #141418 with 1px #26262C borders and a subtle 1px top highlight, fine grain texture. Single accent color: blood orange #FF4D1C. Status colors only: amber #FFB020, red #FF3B30. No gradients, no glassmorphism, no illustrations, no people, no stock photos, no emoji, no confetti.
Typography: large condensed numerals (Barlow Condensed Bold, tabular figures); Japanese UI labels in Noto Sans JP; small uppercase English micro-labels with wide letter-spacing.
Mood: underground gym, iron and concrete, heavy bass. Masculine, disciplined, premium.
Top of the screen: a thin persistent header reading "D-42 | PREP DAY 56".

Screen: Workout complete.
- Title "Push A 完了" and a small gray line "62分".
- Three big stat tiles in a row: "総ボリューム" with "12,480" and unit "kg"; "セット" with "18"; "PR" with "2".
- A card titled "PR" listing two lines in the accent color: "ベンチプレス 100kg × 8" and "インクラインDB 36kg × 10".
- A card titled "今日の感触" with four rows, each a label and a 4-option segmented control: "パンプ", "筋肉痛", "関節", "負荷感". Options are "低 中 高 最大". A few options selected in blood orange.
- Bottom: a large full-width orange button "保存".

Use only the Japanese text quoted above; do not invent extra text; spelling must be exact.
```

## 10. トレタブ（ルーティン一覧・任意）

```
A mobile app screen mockup for a Japanese contest-prep tracking app for physique competitors. iPhone 15 Pro frame, 9:16, 2K, rendered as a shipped production UI (not concept art).

Theme: near-black background #0A0A0C, cards #141418 with 1px #26262C borders and a subtle 1px top highlight, fine grain texture. Single accent color: blood orange #FF4D1C. No gradients, no glassmorphism, no illustrations, no people, no stock photos, no emoji.
Typography: large condensed numerals (Barlow Condensed Bold, tabular figures); Japanese UI labels in Noto Sans JP; small uppercase English micro-labels with wide letter-spacing.
Mood: underground gym, iron and concrete, heavy bass. Masculine, disciplined, premium.
Top of the screen: a thin persistent header reading "D-42 | PREP DAY 56".
Bottom tab bar with 5 items: ホーム, トレ, 食事, コンディション, 分析. The active tab is トレ.

Screen: Training tab.
- A highlighted card "今日: Push A" with a small list "ベンチプレス ・ インクラインDB ・ サイドレイズ ・ プレスダウン" and an orange button "開始".
- A section label "ルーティン" followed by four cards in a 2-column grid: "Push A", "Pull A", "Legs", "Push B", each with a small gray line like "4種目 ・ 前回 10/13".
- A section label "今月" with a compact calendar grid for the month; trained days are marked with small orange squares.
- A small text button at the end "+ ルーティンを作る".

Use only the Japanese text quoted above; do not invent extra text; spelling must be exact.
```
