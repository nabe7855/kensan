-- Intensity techniques for sets, and per-user training settings.

alter table public.workout_sets drop constraint workout_sets_set_type_check;
alter table public.workout_sets add constraint workout_sets_set_type_check
  check (set_type in (
    'normal', 'warmup', 'failure', 'rest_pause', 'drop', 'forced', 'partial', 'superset'
  ));

alter table public.profiles
  -- Lifters who always go to failure don't need RIR; hidden by default.
  add column show_rir boolean not null default false,
  -- Training phase decides how progress is judged (a plateau on a cut is fine).
  add column training_phase text not null default 'maintain'
    check (training_phase in ('bulk', 'maintain', 'cut')),
  add column plateau_alerts boolean not null default true,
  add column muted_exercises uuid[] not null default '{}';
