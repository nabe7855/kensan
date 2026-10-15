-- Rows created without eaten_at (older app versions, quick logging) count as eaten.
-- The planning UI always sends eaten_at explicitly, so planned meals stay null.

alter table public.meal_logs alter column eaten_at set default now();

update public.meal_logs
set eaten_at = created_at
where eaten_at is null and title is null and template_id is null;
