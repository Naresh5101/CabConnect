create table if not exists public.site_settings (
  id text primary key check (id = 'default'),
  booking_enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.site_settings (id, booking_enabled)
values ('default', true)
on conflict (id) do nothing;

alter table public.site_settings
  add column if not exists temple_tours_enabled boolean not null default true,
  add column if not exists tour_packages_enabled boolean not null default true,
  add column if not exists driver_registration_enabled boolean not null default true,
  add column if not exists cab_attachment_enabled boolean not null default true;

alter table public.site_settings enable row level security;
revoke all on public.site_settings from anon, authenticated;
grant select on public.site_settings to anon, authenticated;
grant update (booking_enabled, temple_tours_enabled, tour_packages_enabled, driver_registration_enabled, cab_attachment_enabled) on public.site_settings to authenticated;

drop policy if exists "public can read site settings" on public.site_settings;
create policy "public can read site settings" on public.site_settings
  for select to anon, authenticated using (true);

drop policy if exists "driver admins can update site settings" on public.site_settings;
create policy "driver admins can update site settings" on public.site_settings
  for update to authenticated
  using (public.is_driver_admin())
  with check (public.is_driver_admin());

create or replace function public.touch_site_settings_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  return new;
end;
$$;

drop trigger if exists site_settings_updated_at on public.site_settings;
create trigger site_settings_updated_at
  before update on public.site_settings
  for each row execute function public.touch_site_settings_updated_at();
