alter table public.site_settings
  add column if not exists booking_daily_enabled boolean not null default true,
  add column if not exists booking_oneway_enabled boolean not null default true,
  add column if not exists booking_roundtrip_enabled boolean not null default true,
  add column if not exists booking_rentals_enabled boolean not null default true,
  add column if not exists booking_airport_enabled boolean not null default true;

grant update (booking_daily_enabled, booking_oneway_enabled, booking_roundtrip_enabled, booking_rentals_enabled, booking_airport_enabled)
  on public.site_settings to authenticated;
