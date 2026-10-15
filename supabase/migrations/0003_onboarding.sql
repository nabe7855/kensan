-- Onboarding completion marker and prep start date default

alter table public.profiles add column onboarded_at timestamptz;

alter table public.preps
  alter column start_date set default (now() at time zone 'Asia/Tokyo')::date;
