-- Posing photos: a private storage bucket (one folder per user) and a row per photo for filtering.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('pose-photos', 'pose-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "pose_photos_select_own" on storage.objects for select to authenticated
  using (bucket_id = 'pose-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "pose_photos_insert_own" on storage.objects for insert to authenticated
  with check (bucket_id = 'pose-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "pose_photos_update_own" on storage.objects for update to authenticated
  using (bucket_id = 'pose-photos' and (storage.foldername(name))[1] = (select auth.uid())::text)
  with check (bucket_id = 'pose-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);
create policy "pose_photos_delete_own" on storage.objects for delete to authenticated
  using (bucket_id = 'pose-photos' and (storage.foldername(name))[1] = (select auth.uid())::text);

create table public.pose_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  taken_on date not null,
  pose text not null check (char_length(pose) between 1 and 40),
  tags text[] not null default '{}' check (cardinality(tags) <= 10),
  note text check (char_length(note) <= 300),
  path text not null check (char_length(path) <= 200),
  width integer,
  height integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index pose_photos_user_date_idx on public.pose_photos (user_id, taken_on desc);
create index pose_photos_tags_idx on public.pose_photos using gin (tags);

create trigger set_updated_at before update on public.pose_photos
  for each row execute function public.set_updated_at();
alter table public.pose_photos enable row level security;
create policy "owner_all" on public.pose_photos for all to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id and path like (select auth.uid())::text || '/%');
grant select, insert, update, delete on public.pose_photos to authenticated;
