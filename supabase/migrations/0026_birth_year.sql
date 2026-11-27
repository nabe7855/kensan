-- Birth year, so the coach can use age for a rough BMR. Optional.

alter table public.profiles
  add column birth_year smallint check (birth_year between 1900 and 2100);
