-- Where it hurts or feels off: on the morning check-in, and after a workout.
-- A fixed list so the safety net can track the same area over days.

alter table public.daily_checkins
  add column pain_areas text[] not null default '{}'
    check (pain_areas <@ array['neck', 'shoulder', 'elbow', 'wrist', 'lower_back', 'hip', 'knee', 'ankle', 'other']::text[]);

alter table public.workouts
  add column pain_areas text[] not null default '{}'
    check (pain_areas <@ array['neck', 'shoulder', 'elbow', 'wrist', 'lower_back', 'hip', 'knee', 'ankle', 'other']::text[]);
