-- Weekly AI check-ins, more AI features in the usage log, and spend per feature for admins.

alter table public.ai_usage drop constraint ai_usage_feature_check;
alter table public.ai_usage add constraint ai_usage_feature_check
  check (feature in ('label', 'checkin', 'chat', 'peak'));

create table public.ai_checkins (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  week_start date not null,
  facts jsonb not null,
  result jsonb not null,
  kcal_delta integer not null default 0,
  model text not null,
  applied_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, week_start)
);

alter table public.ai_checkins enable row level security;
create policy "owner_read" on public.ai_checkins for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "owner_insert" on public.ai_checkins for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "owner_update" on public.ai_checkins for update to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
grant select, insert, update on public.ai_checkins to authenticated;

-- Spend per feature and model for [since, until). No rows unless the caller is an admin.
create function public.admin_ai_usage_by_feature(since timestamptz, until timestamptz)
returns table (
  feature text,
  model text,
  calls bigint,
  input_tokens bigint,
  output_tokens bigint,
  cost_usd numeric
)
language sql
stable
security definer
set search_path = ''
as $$
  select g.feature, g.model, count(*),
    sum(g.input_tokens)::bigint, sum(g.output_tokens)::bigint, sum(g.cost_usd)
  from public.ai_usage g
  where g.created_at >= since and g.created_at < until
    and exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
  group by g.feature, g.model
  order by sum(g.cost_usd) desc;
$$;

revoke execute on function public.admin_ai_usage_by_feature(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_ai_usage_by_feature(timestamptz, timestamptz) to authenticated;
