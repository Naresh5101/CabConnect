alter table public.site_settings
  add column if not exists unpublished_temple_ids text[] not null default '{}';

grant update (unpublished_temple_ids) on public.site_settings to authenticated;
