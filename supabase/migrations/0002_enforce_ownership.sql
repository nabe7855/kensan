-- Child rows may only reference parents owned by the same user (or system rows).
-- RLS checks only the child's own user_id, so plain FKs allowed cross-tenant references.

-- Owned parents: composite FKs on (id, user_id) ------------------------------
alter table public.routines add constraint routines_id_user_id_key unique (id, user_id);
alter table public.workouts add constraint workouts_id_user_id_key unique (id, user_id);
alter table public.meal_templates add constraint meal_templates_id_user_id_key unique (id, user_id);
alter table public.meal_logs add constraint meal_logs_id_user_id_key unique (id, user_id);

alter table public.routine_exercises
  drop constraint routine_exercises_routine_id_fkey,
  add constraint routine_exercises_routine_id_fkey
    foreign key (routine_id, user_id) references public.routines (id, user_id) on delete cascade;

alter table public.workouts
  drop constraint workouts_routine_id_fkey,
  add constraint workouts_routine_id_fkey
    foreign key (routine_id, user_id) references public.routines (id, user_id)
    on delete set null (routine_id);

alter table public.workout_sets
  drop constraint workout_sets_workout_id_fkey,
  add constraint workout_sets_workout_id_fkey
    foreign key (workout_id, user_id) references public.workouts (id, user_id) on delete cascade;

alter table public.meal_template_items
  drop constraint meal_template_items_template_id_fkey,
  add constraint meal_template_items_template_id_fkey
    foreign key (template_id, user_id) references public.meal_templates (id, user_id)
    on delete cascade;

alter table public.meal_log_items
  drop constraint meal_log_items_meal_log_id_fkey,
  add constraint meal_log_items_meal_log_id_fkey
    foreign key (meal_log_id, user_id) references public.meal_logs (id, user_id) on delete cascade;

-- Parents that may be system rows (user_id is null): trigger check -------------
create or replace function public.assert_reference_owned()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  ref_table text := tg_argv[0];
  ref_column text := tg_argv[1];
  ref_id uuid;
  allowed boolean;
begin
  execute format('select ($1).%I', ref_column) into ref_id using new;
  execute format(
    'select exists (select 1 from public.%I where id = $1 and (user_id is null or user_id = $2))',
    ref_table
  ) into allowed using ref_id, new.user_id;

  if not allowed then
    raise exception '%.% must reference a system row or one owned by the same user', tg_table_name, ref_column
      using errcode = '42501';
  end if;
  return new;
end;
$$;

revoke execute on function public.assert_reference_owned() from public, anon, authenticated;

create trigger exercise_notes_exercise_owned
  before insert or update of exercise_id, user_id on public.exercise_notes
  for each row execute function public.assert_reference_owned('exercises', 'exercise_id');

create trigger routine_exercises_exercise_owned
  before insert or update of exercise_id, user_id on public.routine_exercises
  for each row execute function public.assert_reference_owned('exercises', 'exercise_id');

create trigger workout_sets_exercise_owned
  before insert or update of exercise_id, user_id on public.workout_sets
  for each row execute function public.assert_reference_owned('exercises', 'exercise_id');

create trigger meal_template_items_food_owned
  before insert or update of food_id, user_id on public.meal_template_items
  for each row execute function public.assert_reference_owned('foods', 'food_id');

create trigger meal_log_items_food_owned
  before insert or update of food_id, user_id on public.meal_log_items
  for each row execute function public.assert_reference_owned('foods', 'food_id');

create trigger pantry_items_food_owned
  before insert or update of food_id, user_id on public.pantry_items
  for each row execute function public.assert_reference_owned('foods', 'food_id');
