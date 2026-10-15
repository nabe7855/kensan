-- Nutrition: per-user meal slots, train/off day overrides, sample system foods.

alter table public.profiles
  add column meal_slots text[] not null default array['朝', '昼', 'トレ前', '夜'];

create table public.day_overrides (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null,
  day_type text not null check (day_type in ('train', 'off')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

create trigger set_updated_at before update on public.day_overrides
  for each row execute function public.set_updated_at();
alter table public.day_overrides enable row level security;
create policy "owner_all" on public.day_overrides for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
grant select, insert, update, delete on public.day_overrides to authenticated;

-- Sample system foods (per 100 g). Approximate values to use until the MEXT 8th edition
-- CSV is imported with scripts/import-foods.ts (source 'mext8').
insert into public.foods (user_id, source, name, kcal, protein_g, fat_g, carb_g, is_cooked)
select null, 'sample', v.name, v.kcal, v.p, v.f, v.c, v.cooked
from (values
  ('鶏むね肉（皮なし・生）', 105, 23.3, 1.9, 0.1, false),
  ('鶏むね肉（皮つき・生）', 133, 21.3, 5.9, 0.1, false),
  ('鶏もも肉（皮なし・生）', 113, 19.0, 5.0, 0.0, false),
  ('鶏ささみ（生）', 98, 23.9, 0.8, 0.1, false),
  ('豚ヒレ（赤肉・生）', 118, 22.2, 3.7, 0.3, false),
  ('牛もも（赤肉・生）', 130, 21.3, 4.9, 0.4, false),
  ('しろさけ（生）', 124, 22.3, 4.1, 0.1, false),
  ('きはだまぐろ（生）', 102, 24.3, 1.0, 0.0, false),
  ('ツナ水煮缶', 70, 16.0, 0.7, 0.2, false),
  ('鶏卵（全卵・生）', 142, 12.2, 10.2, 0.4, false),
  ('卵白（生）', 44, 10.1, 0.0, 0.5, false),
  ('木綿豆腐', 73, 7.0, 4.9, 1.5, false),
  ('納豆', 190, 16.5, 10.0, 12.1, false),
  ('ヨーグルト（全脂無糖）', 56, 3.6, 3.0, 4.9, false),
  ('牛乳（普通）', 61, 3.3, 3.8, 4.8, false),
  ('白米（めし）', 156, 2.5, 0.3, 37.1, true),
  ('玄米（めし）', 152, 2.8, 1.0, 35.6, true),
  ('オートミール', 350, 13.7, 5.7, 69.1, false),
  ('食パン', 248, 8.9, 4.1, 46.4, false),
  ('そば（ゆで）', 130, 4.8, 1.0, 26.0, true),
  ('さつまいも（蒸し）', 131, 1.2, 0.2, 31.9, true),
  ('じゃがいも（蒸し）', 76, 1.5, 0.1, 17.3, true),
  ('ブロッコリー（生）', 37, 5.4, 0.6, 6.6, false),
  ('キャベツ（生）', 21, 1.3, 0.2, 5.2, false),
  ('ほうれん草（生）', 18, 2.2, 0.4, 3.1, false),
  ('トマト（生）', 20, 0.7, 0.1, 4.7, false),
  ('バナナ', 93, 1.1, 0.2, 22.5, false),
  ('りんご', 53, 0.1, 0.2, 15.5, false),
  ('アボカド', 178, 2.1, 17.5, 7.9, false),
  ('アーモンド（乾）', 609, 19.6, 51.8, 20.9, false),
  ('オリーブ油', 894, 0.0, 100.0, 0.0, false),
  ('はちみつ', 329, 0.3, 0.0, 81.9, false),
  ('もち', 223, 4.0, 0.6, 50.8, false)
) as v(name, kcal, p, f, c, cooked);
