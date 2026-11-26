-- When the morning weight was taken, and a rough sense of the day's salt for meals without
-- sodium data. Both are optional and only used as context for day-to-day swings.

alter table public.daily_checkins
  add column weighed_at timestamptz,
  add column salt_level text check (salt_level in ('low', 'normal', 'high'));
