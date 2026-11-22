-- Final-week plans from the AI, one per contest per day.

create table public.ai_peak_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  contest_id uuid not null references public.contests on delete cascade,
  on_date date not null,
  facts jsonb not null,
  result jsonb not null,
  model text not null,
  created_at timestamptz not null default now(),
  unique (user_id, contest_id, on_date)
);

alter table public.ai_peak_plans enable row level security;
create policy "owner_read" on public.ai_peak_plans for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "owner_insert" on public.ai_peak_plans for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "owner_update" on public.ai_peak_plans for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update on public.ai_peak_plans to authenticated;
