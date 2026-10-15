-- Per-user setting: include libido in the morning check-in (requirements §10)

alter table public.profiles add column track_libido boolean not null default true;
