-- AI features: an opt-in switch on the profile, and a usage log for the monthly cap.

alter table public.profiles
  add column ai_enabled boolean not null default false;

create table public.ai_usage (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  feature text not null check (feature in ('label')),
  model text not null,
  input_tokens integer not null check (input_tokens >= 0),
  output_tokens integer not null check (output_tokens >= 0),
  cost_usd numeric(10, 6) not null check (cost_usd >= 0),
  created_at timestamptz not null default now()
);

create index ai_usage_user_created on public.ai_usage (user_id, created_at);

-- Rows are written by the server with the user's own session. No update or delete,
-- so the log can't be cleared to get around the cap.
alter table public.ai_usage enable row level security;
create policy "owner_read" on public.ai_usage for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "owner_insert" on public.ai_usage for insert to authenticated
  with check ((select auth.uid()) = user_id);
grant select, insert on public.ai_usage to authenticated;
