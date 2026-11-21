-- Admins can see every account's AI spend; everyone else sees nothing.

create table public.admins (
  user_id uuid primary key references auth.users on delete cascade
);

-- Only lets someone check whether they are an admin. Rows are added in the SQL Editor.
alter table public.admins enable row level security;
create policy "self_read" on public.admins for select to authenticated
  using ((select auth.uid()) = user_id);
grant select on public.admins to authenticated;

-- Per-account totals for [since, until). Returns no rows unless the caller is an admin.
create function public.admin_ai_usage(since timestamptz, until timestamptz)
returns table (
  user_id uuid,
  email text,
  display_name text,
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
  select u.id, u.email::text, p.display_name, count(*),
    sum(g.input_tokens)::bigint, sum(g.output_tokens)::bigint, sum(g.cost_usd)
  from public.ai_usage g
  join auth.users u on u.id = g.user_id
  left join public.profiles p on p.user_id = g.user_id
  where g.created_at >= since and g.created_at < until
    and exists (select 1 from public.admins a where a.user_id = (select auth.uid()))
  group by u.id, u.email, p.display_name
  order by sum(g.cost_usd) desc;
$$;

revoke execute on function public.admin_ai_usage(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_ai_usage(timestamptz, timestamptz) to authenticated;
