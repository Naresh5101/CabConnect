alter table public.driver_applications
  add column if not exists police_verification_certificate text not null default 'No'
  check (police_verification_certificate in ('Yes', 'No'));

alter table public.driver_applications
  alter column police_verification_certificate drop default;
