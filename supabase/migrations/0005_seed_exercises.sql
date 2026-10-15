-- System exercises (user_id is null, readable by everyone)

insert into public.exercises (user_id, name_ja, name_en, muscle_groups, equipment, is_custom)
select null, v.name_ja, v.name_en, v.muscle_groups, v.equipment, false
from (values
  -- chest
  ('ベンチプレス', 'Bench Press', array['chest','triceps','shoulders'], 'barbell'),
  ('インクラインベンチプレス', 'Incline Bench Press', array['chest','shoulders','triceps'], 'barbell'),
  ('デクラインベンチプレス', 'Decline Bench Press', array['chest','triceps'], 'barbell'),
  ('ダンベルプレス', 'Dumbbell Press', array['chest','triceps','shoulders'], 'dumbbell'),
  ('インクラインDB', 'Incline Dumbbell Press', array['chest','shoulders','triceps'], 'dumbbell'),
  ('ダンベルフライ', 'Dumbbell Fly', array['chest'], 'dumbbell'),
  ('インクラインフライ', 'Incline Dumbbell Fly', array['chest'], 'dumbbell'),
  ('チェストプレス', 'Machine Chest Press', array['chest','triceps'], 'machine'),
  ('ペックフライ', 'Pec Deck', array['chest'], 'machine'),
  ('ケーブルクロスオーバー', 'Cable Crossover', array['chest'], 'cable'),
  ('ディップス', 'Dips', array['chest','triceps'], 'bodyweight'),
  ('腕立て伏せ', 'Push-up', array['chest','triceps'], 'bodyweight'),
  -- back
  ('デッドリフト', 'Deadlift', array['back','hamstrings','glutes','traps'], 'barbell'),
  ('ベントオーバーロウ', 'Barbell Row', array['back','biceps'], 'barbell'),
  ('ワンハンドロウ', 'One-arm Dumbbell Row', array['back','biceps'], 'dumbbell'),
  ('懸垂', 'Pull-up', array['back','biceps'], 'bodyweight'),
  ('ラットプルダウン', 'Lat Pulldown', array['back','biceps'], 'cable'),
  ('ナローラットプルダウン', 'Close-grip Lat Pulldown', array['back','biceps'], 'cable'),
  ('シーテッドロウ', 'Seated Cable Row', array['back','biceps'], 'cable'),
  ('Tバーロウ', 'T-bar Row', array['back','biceps'], 'machine'),
  ('マシンロウ', 'Machine Row', array['back','biceps'], 'machine'),
  ('ストレートアームプルダウン', 'Straight-arm Pulldown', array['back'], 'cable'),
  ('バックエクステンション', 'Back Extension', array['back','glutes','hamstrings'], 'bodyweight'),
  ('シュラッグ', 'Shrug', array['traps'], 'dumbbell'),
  -- shoulders
  ('ショルダープレス', 'Overhead Press', array['shoulders','triceps'], 'barbell'),
  ('ダンベルショルダープレス', 'Dumbbell Shoulder Press', array['shoulders','triceps'], 'dumbbell'),
  ('マシンショルダープレス', 'Machine Shoulder Press', array['shoulders','triceps'], 'machine'),
  ('サイドレイズ', 'Lateral Raise', array['shoulders'], 'dumbbell'),
  ('ケーブルサイドレイズ', 'Cable Lateral Raise', array['shoulders'], 'cable'),
  ('フロントレイズ', 'Front Raise', array['shoulders'], 'dumbbell'),
  ('リアデルトフライ', 'Rear Delt Fly', array['shoulders','back'], 'machine'),
  ('フェイスプル', 'Face Pull', array['shoulders','traps'], 'cable'),
  ('アップライトロウ', 'Upright Row', array['shoulders','traps'], 'barbell'),
  -- arms
  ('バーベルカール', 'Barbell Curl', array['biceps'], 'barbell'),
  ('ダンベルカール', 'Dumbbell Curl', array['biceps'], 'dumbbell'),
  ('インクラインカール', 'Incline Dumbbell Curl', array['biceps'], 'dumbbell'),
  ('ハンマーカール', 'Hammer Curl', array['biceps','forearms'], 'dumbbell'),
  ('プリーチャーカール', 'Preacher Curl', array['biceps'], 'machine'),
  ('ケーブルカール', 'Cable Curl', array['biceps'], 'cable'),
  ('プレスダウン', 'Triceps Pushdown', array['triceps'], 'cable'),
  ('フレンチプレス', 'Overhead Triceps Extension', array['triceps'], 'dumbbell'),
  ('スカルクラッシャー', 'Skull Crusher', array['triceps'], 'barbell'),
  ('ナローベンチプレス', 'Close-grip Bench Press', array['triceps','chest'], 'barbell'),
  ('リストカール', 'Wrist Curl', array['forearms'], 'dumbbell'),
  -- legs
  ('スクワット', 'Back Squat', array['quads','glutes','hamstrings'], 'barbell'),
  ('フロントスクワット', 'Front Squat', array['quads','glutes'], 'barbell'),
  ('ハックスクワット', 'Hack Squat', array['quads','glutes'], 'machine'),
  ('レッグプレス', 'Leg Press', array['quads','glutes'], 'machine'),
  ('ブルガリアンスクワット', 'Bulgarian Split Squat', array['quads','glutes'], 'dumbbell'),
  ('ランジ', 'Lunge', array['quads','glutes'], 'dumbbell'),
  ('レッグエクステンション', 'Leg Extension', array['quads'], 'machine'),
  ('ルーマニアンデッドリフト', 'Romanian Deadlift', array['hamstrings','glutes','back'], 'barbell'),
  ('レッグカール', 'Lying Leg Curl', array['hamstrings'], 'machine'),
  ('シーテッドレッグカール', 'Seated Leg Curl', array['hamstrings'], 'machine'),
  ('ヒップスラスト', 'Hip Thrust', array['glutes','hamstrings'], 'barbell'),
  ('アブダクション', 'Hip Abduction', array['glutes'], 'machine'),
  ('スタンディングカーフレイズ', 'Standing Calf Raise', array['calves'], 'machine'),
  ('シーテッドカーフレイズ', 'Seated Calf Raise', array['calves'], 'machine'),
  -- abs
  ('クランチ', 'Crunch', array['abs'], 'bodyweight'),
  ('ケーブルクランチ', 'Cable Crunch', array['abs'], 'cable'),
  ('ハンギングレッグレイズ', 'Hanging Leg Raise', array['abs'], 'bodyweight'),
  ('アブローラー', 'Ab Wheel Rollout', array['abs'], 'bodyweight'),
  ('プランク', 'Plank', array['abs'], 'bodyweight')
) as v(name_ja, name_en, muscle_groups, equipment);

create index if not exists exercises_name_ja_idx on public.exercises (name_ja);
