-- KENSAN initial schema (docs/01_requirements.md §8)

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- profiles -------------------------------------------------------------------
create table public.profiles (
  user_id uuid primary key default auth.uid() references auth.users on delete cascade,
  display_name text,
  height_cm numeric(5, 1) check (height_cm between 100 and 250),
  sex text check (sex in ('male', 'female', 'other')),
  unit_pref text not null default 'kg' check (unit_pref in ('kg', 'lb')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- preps ----------------------------------------------------------------------
create table public.preps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  contest_name text not null,
  contest_date date not null,
  start_date date not null,
  start_weight_kg numeric(5, 2) not null check (start_weight_kg > 0),
  target_weight_kg numeric(5, 2) not null check (target_weight_kg > 0),
  weekly_rate_pct numeric(3, 2) not null check (weekly_rate_pct > 0 and weekly_rate_pct <= 1.0),
  why_text text,
  reverse_plan jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (contest_date > start_date)
);
create unique index preps_one_active_per_user on public.preps (user_id) where is_active;

-- daily_checkins -------------------------------------------------------------
create table public.daily_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null,
  weight_kg numeric(5, 2) check (weight_kg > 0),
  hunger smallint check (hunger between 1 and 5),
  sleep smallint check (sleep between 1 and 5),
  mood smallint check (mood between 1 and 5),
  energy smallint check (energy between 1 and 5),
  libido smallint check (libido between 1 and 5),
  bowel text check (bowel in ('good', 'normal', 'bad')),
  note text,
  rhr smallint check (rhr between 20 and 200),
  temp_c numeric(3, 1) check (temp_c between 33 and 42),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date)
);

-- weekly_checkins ------------------------------------------------------------
create table public.weekly_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  week_start date not null,
  hooper_sleep smallint check (hooper_sleep between 1 and 7),
  hooper_fatigue smallint check (hooper_fatigue between 1 and 7),
  hooper_stress smallint check (hooper_stress between 1 and 7),
  hooper_soreness smallint check (hooper_soreness between 1 and 7),
  waist_cm numeric(5, 1),
  photo_ids uuid[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, week_start)
);

-- exercises ------------------------------------------------------------------
create table public.exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users on delete cascade, -- null = system
  name_ja text not null,
  name_en text,
  muscle_groups text[] not null default '{}',
  equipment text,
  is_custom boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index exercises_user_id_idx on public.exercises (user_id);

create table public.exercise_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  exercise_id uuid not null references public.exercises on delete cascade,
  note text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, exercise_id)
);

-- routines -------------------------------------------------------------------
create table public.routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  order_idx integer not null default 0,
  weekdays smallint[] not null default '{}', -- 0=Sun..6=Sat; decides train/off day (§9)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index routines_user_id_idx on public.routines (user_id);

create table public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  routine_id uuid not null references public.routines on delete cascade,
  exercise_id uuid not null references public.exercises on delete restrict,
  order_idx integer not null default 0,
  target_sets smallint check (target_sets > 0),
  target_reps smallint check (target_reps > 0),
  target_rir smallint check (target_rir between 0 and 10),
  rest_sec integer check (rest_sec >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index routine_exercises_routine_id_idx on public.routine_exercises (routine_id);

-- workouts -------------------------------------------------------------------
create table public.workouts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  routine_id uuid references public.routines on delete set null,
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  pump smallint check (pump between 1 and 4),
  soreness smallint check (soreness between 1 and 4),
  joint smallint check (joint between 1 and 4),
  load_feel smallint check (load_feel between 1 and 4),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index workouts_user_started_idx on public.workouts (user_id, started_at desc);

create table public.workout_sets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  workout_id uuid not null references public.workouts on delete cascade,
  exercise_id uuid not null references public.exercises on delete restrict,
  set_no smallint not null check (set_no > 0),
  set_type text not null default 'normal'
    check (set_type in ('normal', 'warmup', 'drop', 'superset', 'failure')),
  weight_kg numeric(6, 2) check (weight_kg >= 0),
  reps smallint check (reps >= 0),
  rir smallint check (rir between 0 and 10),
  is_pr boolean not null default false,
  done_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index workout_sets_workout_id_idx on public.workout_sets (workout_id);
create index workout_sets_user_exercise_idx on public.workout_sets (user_id, exercise_id, done_at desc);

-- foods ----------------------------------------------------------------------
create table public.foods (
  id uuid primary key default gen_random_uuid(),
  user_id uuid default auth.uid() references auth.users on delete cascade, -- null = system
  source text not null default 'user', -- 'mext8' | 'user'
  name text not null,
  kcal numeric(7, 2) not null check (kcal >= 0), -- per 100g
  protein_g numeric(6, 2) not null default 0 check (protein_g >= 0),
  fat_g numeric(6, 2) not null default 0 check (fat_g >= 0),
  carb_g numeric(6, 2) not null default 0 check (carb_g >= 0),
  fiber_g numeric(6, 2) check (fiber_g >= 0),
  sodium_mg numeric(8, 2) check (sodium_mg >= 0),
  is_cooked boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index foods_user_id_idx on public.foods (user_id);
create index foods_name_idx on public.foods (name);

-- meals ----------------------------------------------------------------------
create table public.meal_templates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  order_idx integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.meal_template_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  template_id uuid not null references public.meal_templates on delete cascade,
  food_id uuid not null references public.foods on delete restrict,
  grams numeric(7, 1) not null check (grams > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index meal_template_items_template_id_idx on public.meal_template_items (template_id);

create table public.meal_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  date date not null,
  slot text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, date, slot)
);

create table public.meal_log_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  meal_log_id uuid not null references public.meal_logs on delete cascade,
  food_id uuid not null references public.foods on delete restrict,
  grams numeric(7, 1) not null check (grams > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index meal_log_items_meal_log_id_idx on public.meal_log_items (meal_log_id);

create table public.nutrition_targets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  effective_from date not null,
  day_type text not null check (day_type in ('train', 'off')),
  kcal numeric(6, 0) not null check (kcal >= 0),
  protein_g numeric(5, 1) not null check (protein_g >= 0),
  fat_g numeric(5, 1) not null check (fat_g >= 0),
  carb_g numeric(5, 1) not null check (carb_g >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, effective_from, day_type)
);

-- Phase 3
create table public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  food_id uuid not null references public.foods on delete cascade,
  grams_available numeric(7, 1) not null check (grams_available >= 0),
  expires_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- updated_at triggers + RLS ---------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array[
    'profiles', 'preps', 'daily_checkins', 'weekly_checkins', 'exercises', 'exercise_notes',
    'routines', 'routine_exercises', 'workouts', 'workout_sets', 'foods', 'meal_templates',
    'meal_template_items', 'meal_logs', 'meal_log_items', 'nutrition_targets', 'pantry_items'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on public.%I
         for each row execute function public.set_updated_at()', t);
    execute format('alter table public.%I enable row level security', t);
  end loop;

  -- Owner-only tables
  foreach t in array array[
    'profiles', 'preps', 'daily_checkins', 'weekly_checkins', 'exercise_notes', 'routines',
    'routine_exercises', 'workouts', 'workout_sets', 'meal_templates', 'meal_template_items',
    'meal_logs', 'meal_log_items', 'nutrition_targets', 'pantry_items'
  ]
  loop
    execute format(
      'create policy "owner_all" on public.%I for all to authenticated
         using ((select auth.uid()) = user_id)
         with check ((select auth.uid()) = user_id)', t);
  end loop;

  -- System rows (user_id is null) are readable by everyone signed in
  foreach t in array array['exercises', 'foods']
  loop
    execute format(
      'create policy "read_own_or_system" on public.%I for select to authenticated
         using (user_id is null or (select auth.uid()) = user_id)', t);
    execute format(
      'create policy "insert_own" on public.%I for insert to authenticated
         with check ((select auth.uid()) = user_id)', t);
    execute format(
      'create policy "update_own" on public.%I for update to authenticated
         using ((select auth.uid()) = user_id)
         with check ((select auth.uid()) = user_id)', t);
    execute format(
      'create policy "delete_own" on public.%I for delete to authenticated
         using ((select auth.uid()) = user_id)', t);
  end loop;
end;
$$;

-- views (security_invoker so RLS of underlying tables applies) ----------------

-- 7-day simple moving average; missing days are linearly interpolated (§9)
create view public.v_weight_trend
with (security_invoker = true) as
with measured as (
  select user_id, date, weight_kg
  from public.daily_checkins
  where weight_kg is not null
),
bounds as (
  select user_id, min(date) as d0, max(date) as d1
  from measured
  group by user_id
),
days as (
  select b.user_id, gs::date as date
  from bounds b
  cross join lateral generate_series(b.d0, b.d1, interval '1 day') as gs
),
filled as (
  select
    d.user_id,
    d.date,
    m.weight_kg,
    coalesce(
      m.weight_kg,
      p.weight_kg + (n.weight_kg - p.weight_kg) * (d.date - p.date)::numeric / (n.date - p.date)
    ) as filled_kg
  from days d
  left join measured m on m.user_id = d.user_id and m.date = d.date
  left join lateral (
    select date, weight_kg from measured
    where user_id = d.user_id and date < d.date
    order by date desc limit 1
  ) p on m.weight_kg is null
  left join lateral (
    select date, weight_kg from measured
    where user_id = d.user_id and date > d.date
    order by date asc limit 1
  ) n on m.weight_kg is null
)
select
  user_id,
  date,
  weight_kg,
  round(
    avg(filled_kg) over (partition by user_id order by date rows between 6 preceding and current row),
    2
  ) as trend_kg
from filled;

-- Working sets per muscle group per ISO week (Mon start, JST)
create view public.v_weekly_volume
with (security_invoker = true) as
select
  s.user_id,
  date_trunc('week', s.done_at at time zone 'Asia/Tokyo')::date as week_start,
  mg as muscle_group,
  count(*)::integer as sets
from public.workout_sets s
join public.exercises e on e.id = s.exercise_id
cross join lateral unnest(e.muscle_groups) as mg
where s.done_at is not null
  and s.set_type <> 'warmup'
group by s.user_id, week_start, mg;

create view public.v_weekly_report
with (security_invoker = true) as
with checkin_weeks as (
  select
    user_id,
    date_trunc('week', date)::date as week_start,
    round(avg(weight_kg), 2) as avg_weight,
    round(avg(hunger), 2) as avg_hunger,
    round(avg(sleep), 2) as avg_sleep,
    round(avg(mood), 2) as avg_mood
  from public.daily_checkins
  group by user_id, week_start
),
set_weeks as (
  select
    user_id,
    date_trunc('week', done_at at time zone 'Asia/Tokyo')::date as week_start,
    count(*)::integer as total_sets
  from public.workout_sets
  where done_at is not null and set_type <> 'warmup'
  group by user_id, week_start
),
daily_kcal as (
  select l.user_id, l.date, sum(f.kcal * i.grams / 100) as kcal
  from public.meal_logs l
  join public.meal_log_items i on i.meal_log_id = l.id
  join public.foods f on f.id = i.food_id
  group by l.user_id, l.date
),
kcal_weeks as (
  select user_id, date_trunc('week', date)::date as week_start, round(avg(kcal), 0) as avg_kcal
  from daily_kcal
  group by user_id, week_start
),
weeks as (
  select user_id, week_start from checkin_weeks
  union
  select user_id, week_start from set_weeks
  union
  select user_id, week_start from kcal_weeks
)
select
  w.user_id,
  w.week_start,
  c.avg_weight,
  c.avg_weight - lag(c.avg_weight) over (partition by w.user_id order by w.week_start) as delta_kg,
  c.avg_hunger,
  c.avg_sleep,
  c.avg_mood,
  coalesce(s.total_sets, 0) as total_sets,
  k.avg_kcal
from weeks w
left join checkin_weeks c using (user_id, week_start)
left join set_weeks s using (user_id, week_start)
left join kcal_weeks k using (user_id, week_start);

-- grants (project has "Automatically expose new tables" disabled) -------------
grant usage on schema public to authenticated;
grant select, insert, update, delete on all tables in schema public to authenticated;
revoke all on all tables in schema public from anon;
