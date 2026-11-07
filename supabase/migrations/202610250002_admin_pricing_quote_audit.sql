create or replace function public.is_valid_admin_pricing_rules(p_rules jsonb)
returns boolean
language plpgsql
immutable
set search_path = ''
as $$
declare
  field record;
  value jsonb;
  amount numeric;
begin
  if jsonb_typeof(p_rules) is distinct from 'object'
    or jsonb_typeof(p_rules -> 'tariff') is distinct from 'object'
    or jsonb_typeof(p_rules -> 'vehicles') is distinct from 'object'
    or jsonb_typeof(p_rules #> '{vehicles,dzire}') is distinct from 'object'
    or jsonb_typeof(p_rules #> '{vehicles,ertiga}') is distinct from 'object' then
    return false;
  end if;

  for field in select * from (values
    (array['tariff','oneWayMinimumKm'], true),
    (array['tariff','roundTripMinimumKmPerDay'], true),
    (array['tariff','localKmPerHour'], true),
    (array['vehicles','dzire','perKm'], true),
    (array['vehicles','dzire','shortTripPerKm'], true),
    (array['vehicles','dzire','outstationOneWayPerKm'], true),
    (array['vehicles','dzire','outstationRoundTripPerKm'], true),
    (array['vehicles','dzire','extraHourRate'], false),
    (array['vehicles','dzire','airportMinimum'], false),
    (array['vehicles','dzire','driverAllowancePerDay'], false),
    (array['vehicles','dzire','localPackages','4'], true),
    (array['vehicles','dzire','localPackages','8'], true),
    (array['vehicles','dzire','localPackages','12'], true),
    (array['vehicles','ertiga','perKm'], true),
    (array['vehicles','ertiga','shortTripPerKm'], true),
    (array['vehicles','ertiga','outstationOneWayPerKm'], true),
    (array['vehicles','ertiga','outstationRoundTripPerKm'], true),
    (array['vehicles','ertiga','extraHourRate'], false),
    (array['vehicles','ertiga','airportMinimum'], false),
    (array['vehicles','ertiga','driverAllowancePerDay'], false),
    (array['vehicles','ertiga','localPackages','4'], true),
    (array['vehicles','ertiga','localPackages','8'], true),
    (array['vehicles','ertiga','localPackages','12'], true)
  ) as configured(path, must_be_positive)
  loop
    value := p_rules #> field.path;
    if jsonb_typeof(value) is distinct from 'number' then return false; end if;
    amount := (value #>> '{}')::numeric;
    if amount < 0 or amount > 1000000 or (field.must_be_positive and amount = 0) then return false; end if;
  end loop;
  return true;
end;
$$;

revoke all on function public.is_valid_admin_pricing_rules(jsonb) from public, anon;
grant execute on function public.is_valid_admin_pricing_rules(jsonb) to authenticated;

create table if not exists public.admin_pricing_rules (
  id text primary key check (id = 'default'),
  rules jsonb not null check (octet_length(rules::text) <= 20000 and public.is_valid_admin_pricing_rules(rules)),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

insert into public.admin_pricing_rules (id, rules)
values (
  'default',
  '{
    "tariff": {"oneWayMinimumKm": 130, "roundTripMinimumKmPerDay": 250, "localKmPerHour": 10},
    "vehicles": {
      "dzire": {"perKm": 20, "shortTripPerKm": 20, "outstationOneWayPerKm": 16, "outstationRoundTripPerKm": 14, "localPackages": {"4": 1300, "8": 2300, "12": 3300}, "extraHourRate": 250, "airportMinimum": 1000, "driverAllowancePerDay": 300},
      "ertiga": {"perKm": 28, "shortTripPerKm": 30, "outstationOneWayPerKm": 19, "outstationRoundTripPerKm": 17, "localPackages": {"4": 2000, "8": 3400, "12": 4700}, "extraHourRate": 350, "airportMinimum": 1500, "driverAllowancePerDay": 400}
    }
  }'::jsonb
)
on conflict (id) do nothing;

alter table public.admin_pricing_rules enable row level security;
revoke all on public.admin_pricing_rules from anon, authenticated;
grant select on public.admin_pricing_rules to anon, authenticated;
grant update (rules) on public.admin_pricing_rules to authenticated;

drop policy if exists "public can read fare rules" on public.admin_pricing_rules;
create policy "public can read fare rules" on public.admin_pricing_rules
  for select to anon, authenticated using (true);
drop policy if exists "driver admins update fare rules" on public.admin_pricing_rules;
create policy "driver admins update fare rules" on public.admin_pricing_rules
  for update to authenticated using (public.is_driver_admin()) with check (public.is_driver_admin());

create or replace function public.touch_admin_pricing_rules_updated_at()
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

drop trigger if exists admin_pricing_rules_updated_at on public.admin_pricing_rules;
create trigger admin_pricing_rules_updated_at
  before update on public.admin_pricing_rules
  for each row execute function public.touch_admin_pricing_rules_updated_at();

create table if not exists public.customer_request_quote_audit (
  audit_id bigint generated always as identity primary key,
  request_id uuid not null references public.customer_requests(request_id) on delete cascade,
  previous_amount numeric(12,2) check (previous_amount is null or previous_amount >= 0),
  revised_amount numeric(12,2) check (revised_amount is null or revised_amount >= 0),
  admin_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists customer_request_quote_audit_request_created_idx
  on public.customer_request_quote_audit(request_id, created_at desc);

alter table public.customer_request_quote_audit enable row level security;
revoke all on public.customer_request_quote_audit from anon, authenticated;
grant select on public.customer_request_quote_audit to authenticated;
drop policy if exists "driver admins read quote history" on public.customer_request_quote_audit;
create policy "driver admins read quote history" on public.customer_request_quote_audit
  for select to authenticated using (public.is_driver_admin());

create or replace function public.record_customer_request_quote_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.quoted_amount is distinct from new.quoted_amount then
    insert into public.customer_request_quote_audit (request_id, previous_amount, revised_amount, admin_user_id)
    values (new.request_id, old.quoted_amount, new.quoted_amount, auth.uid());
  end if;
  return new;
end;
$$;

revoke all on function public.record_customer_request_quote_change() from public, anon, authenticated;
drop trigger if exists customer_request_quote_audit_trigger on public.customer_requests;
create trigger customer_request_quote_audit_trigger
  after update of quoted_amount on public.customer_requests
  for each row execute function public.record_customer_request_quote_change();
