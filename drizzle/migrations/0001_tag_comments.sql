alter table public.application_tags add column comment text;
alter table public.application_tags add column updated_at timestamptz not null default now();
grant update on public.application_tags to authenticated;