create extension if not exists pgcrypto;

create table if not exists public.driver_applications (
  application_id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(trim(full_name)) between 1 and 100),
  mobile text not null check (mobile ~ '^[6-9][0-9]{9}$'),
  whatsapp text not null check (whatsapp ~ '^[6-9][0-9]{9}$'),
  city_area text not null check (char_length(trim(city_area)) between 1 and 120),
  experience_years integer not null check (experience_years between 0 and 60),
  licence_status text not null check (licence_status in ('Valid', 'Renewal in progress', 'No')),
  badge_status text not null check (badge_status in ('Yes', 'No', 'Not applicable')),
  preferred_work_type text not null check (preferred_work_type in ('Full-time', 'Part-time', 'Weekend')),
  preferred_shift text not null check (char_length(trim(preferred_shift)) between 1 and 120),
  languages text not null default '' check (char_length(languages) <= 120),
  previous_experience text not null default '' check (char_length(previous_experience) <= 1000),
  expected_monthly_salary integer check (expected_monthly_salary between 1 and 1000000),
  additional_information text not null default '' check (char_length(additional_information) <= 1000),
  contact_consent boolean not null check (contact_consent),
  status text not null default 'New' check (status in ('New', 'Reviewing', 'Shortlisted', 'Contacted', 'Rejected', 'Hired')),
  admin_notes text not null default '' check (char_length(admin_notes) <= 5000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint driver_applications_mobile_unique unique (mobile)
);

create table if not exists public.driver_application_rate_limits (
  ip_hash text primary key,
  window_started_at timestamptz not null default now(),
  request_count integer not null default 0
);

create or replace function public.touch_driver_application_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
drop trigger if exists driver_application_updated_at on public.driver_applications;
create trigger driver_application_updated_at before update on public.driver_applications
for each row execute function public.touch_driver_application_updated_at();

create or replace function public.is_driver_admin()
returns boolean language sql stable set search_path = '' as $$
  select coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'driver_admin', false);
$$;

alter table public.driver_applications enable row level security;
revoke all on public.driver_applications from anon, authenticated;
grant select, update on public.driver_applications to authenticated;
drop policy if exists "driver admins can read applications" on public.driver_applications;
create policy "driver admins can read applications" on public.driver_applications
for select to authenticated using (public.is_driver_admin());
drop policy if exists "driver admins can update applications" on public.driver_applications;
create policy "driver admins can update applications" on public.driver_applications
for update to authenticated using (public.is_driver_admin()) with check (public.is_driver_admin());

alter table public.driver_application_rate_limits enable row level security;
revoke all on public.driver_application_rate_limits from anon, authenticated;

create or replace function public.consume_driver_application_rate_limit(p_ip_hash text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare allowed boolean;
begin
  insert into public.driver_application_rate_limits(ip_hash, window_started_at, request_count)
  values (p_ip_hash, now(), 1)
  on conflict (ip_hash) do update set
    window_started_at = case when public.driver_application_rate_limits.window_started_at < now() - interval '1 hour' then now() else public.driver_application_rate_limits.window_started_at end,
    request_count = case when public.driver_application_rate_limits.window_started_at < now() - interval '1 hour' then 1 else public.driver_application_rate_limits.request_count + 1 end;
  select request_count <= 5 into allowed from public.driver_application_rate_limits where ip_hash = p_ip_hash;
  return allowed;
end;
$$;
revoke all on function public.consume_driver_application_rate_limit(text) from public, anon, authenticated;
grant execute on function public.consume_driver_application_rate_limit(text) to service_role;
