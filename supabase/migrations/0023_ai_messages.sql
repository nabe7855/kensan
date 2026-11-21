-- AI coach conversation log. Written by the server with the user's own session.

create table public.ai_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) between 1 and 6000),
  created_at timestamptz not null default now()
);

create index ai_messages_user_created on public.ai_messages (user_id, created_at);

-- People can clear their own history; nothing is edited after the fact.
alter table public.ai_messages enable row level security;
create policy "owner_read" on public.ai_messages for select to authenticated
  using ((select auth.uid()) = user_id);
create policy "owner_insert" on public.ai_messages for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy "owner_delete" on public.ai_messages for delete to authenticated
  using ((select auth.uid()) = user_id);
grant select, insert, delete on public.ai_messages to authenticated;
