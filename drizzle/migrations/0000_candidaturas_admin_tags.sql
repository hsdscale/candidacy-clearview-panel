create type public.app_role as enum ('admin', 'user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

create policy "Own roles readable" on public.user_roles for select to authenticated
using (user_id = auth.uid() or public.has_role(auth.uid(), 'admin'));

-- First account created becomes admin
create or replace function public.assign_first_admin()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_first_admin after insert on auth.users
for each row execute function public.assign_first_admin();

create table public.applications (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  name text not null,
  email text not null,
  phone text,
  hours text,
  days text[] not null default '{}',
  start_when text,
  equipment text[] not null default '{}',
  experience text,
  pt_level text,
  strengths text[] not null default '{}',
  why text,
  level text,
  cv_path text,
  extra_path text,
  morada_path text,
  notes text
);
grant insert on public.applications to anon, authenticated;
grant select, update, delete on public.applications to authenticated;
grant all on public.applications to service_role;
alter table public.applications enable row level security;
create policy "Anyone can submit" on public.applications for insert to anon, authenticated with check (true);
create policy "Admins read" on public.applications for select to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins update" on public.applications for update to authenticated using (public.has_role(auth.uid(), 'admin'));
create policy "Admins delete" on public.applications for delete to authenticated using (public.has_role(auth.uid(), 'admin'));

create table public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  color text not null default 'navy',
  created_at timestamptz not null default now()
);
grant select, insert, update, delete on public.tags to authenticated;
grant all on public.tags to service_role;
alter table public.tags enable row level security;
create policy "Admins manage tags" on public.tags for all to authenticated
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

create table public.application_tags (
  application_id uuid not null references public.applications(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  primary key (application_id, tag_id)
);
grant select, insert, delete on public.application_tags to authenticated;
grant all on public.application_tags to service_role;
alter table public.application_tags enable row level security;
create policy "Admins manage app tags" on public.application_tags for all to authenticated
using (public.has_role(auth.uid(), 'admin')) with check (public.has_role(auth.uid(), 'admin'));

insert into public.tags (name, color) values
  ('Nova', 'blue'), ('Verificado', 'green'), ('Em análise', 'amber'), ('Recusado', 'red');

create policy "Anyone uploads application files" on storage.objects for insert to anon, authenticated
with check (bucket_id = 'candidaturas');
create policy "Admins read application files" on storage.objects for select to authenticated
using (bucket_id = 'candidaturas' and public.has_role(auth.uid(), 'admin'));
create policy "Admins delete application files" on storage.objects for delete to authenticated
using (bucket_id = 'candidaturas' and public.has_role(auth.uid(), 'admin'));
