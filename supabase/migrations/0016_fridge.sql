-- What the user has at home: one row per food (have / don't have, no amounts).

create table public.fridge_items (
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  food_id uuid not null references public.foods on delete cascade,
  created_at timestamptz not null default now(),
  primary key (user_id, food_id)
);

alter table public.fridge_items enable row level security;
create policy "owner_all" on public.fridge_items for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
grant select, insert, delete on public.fridge_items to authenticated;
