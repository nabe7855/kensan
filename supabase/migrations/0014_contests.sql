-- Contests the user enters, their own pre-contest routine, and checked-off items.

create table public.contests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null check (char_length(name) between 1 and 60),
  date date not null,
  category text check (char_length(category) <= 40),
  location text check (char_length(location) <= 60),
  note text check (char_length(note) <= 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);
create index contests_user_date_idx on public.contests (user_id, date);

-- Personal routine items, shared by every contest: "N days before" once, or daily from then on.
create table public.contest_routines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  title text not null check (char_length(title) between 1 and 60),
  days_before integer not null check (days_before between 0 and 120),
  daily boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- One row per item checked off for a contest on a day (task_key: 'sys:<key>' or 'own:<uuid>').
create table public.contest_checks (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  contest_id uuid not null,
  task_key text not null check (char_length(task_key) <= 80),
  on_date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, contest_id, task_key, on_date),
  foreign key (contest_id, user_id) references public.contests (id, user_id) on delete cascade
);

create trigger set_updated_at before update on public.contests
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.contest_routines
  for each row execute function public.set_updated_at();

alter table public.contests enable row level security;
alter table public.contest_routines enable row level security;
alter table public.contest_checks enable row level security;

create policy "owner_all" on public.contests for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "owner_all" on public.contest_routines for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy "owner_all" on public.contest_checks for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.contests to authenticated;
grant select, insert, update, delete on public.contest_routines to authenticated;
grant select, insert, delete on public.contest_checks to authenticated;
