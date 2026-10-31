-- Database-backed sponsor and partner registry.
-- The legacy public.sponsors table is intentionally preserved because older
-- projects use it for a different shape (UUID id, name, logo_url, etc.).
create table if not exists public.sponsor_profiles (
  id text primary key,
  company_name text not null,
  tagline text not null default '',
  tier text not null default 'Official Event Partner',
  tier_badge_color text not null default '#38BDF8',
  logo text not null default '/vce_logo.png',
  website text not null default 'https://vardhaman.org',
  poc_name text not null default '',
  poc_role text not null default '',
  poc_contact text not null default '',
  poc_email text not null default '',
  sac_lead_name text not null default '',
  sac_lead_contact text not null default '',
  stall_location text not null default '',
  stall_number text not null default '',
  mou_status text not null default 'Under Review',
  invoice_status text not null default 'Processing',
  metrics jsonb not null default '{}'::jsonb,
  deliverables jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint sponsor_profiles_tier_check check (tier in ('Title Sponsor', 'Platinum Partner', 'Gold Sponsor', 'Official Event Partner', 'Official Tech Partner')),
  constraint sponsor_profiles_mou_status_check check (mou_status in ('Signed & Executed', 'Under Review', 'Draft Sent')),
  constraint sponsor_profiles_invoice_status_check check (invoice_status in ('Paid & Cleared', 'Processing'))
);

create index if not exists sponsor_profiles_company_name_idx on public.sponsor_profiles (lower(company_name));
alter table public.sponsor_profiles enable row level security;

drop policy if exists sponsor_profiles_public_read on public.sponsor_profiles;
create policy sponsor_profiles_public_read on public.sponsor_profiles
  for select to anon, authenticated using (true);

drop policy if exists sponsor_profiles_global_write on public.sponsor_profiles;
create policy sponsor_profiles_global_write on public.sponsor_profiles
  for all to authenticated
  using (private.current_is_global_admin())
  with check (private.current_is_global_admin());

grant select on public.sponsor_profiles to anon, authenticated;
grant insert, update, delete on public.sponsor_profiles to authenticated;

alter table public.sponsor_profiles replica identity full;

create or replace function public.set_sponsor_profiles_updated_at()
returns trigger language plpgsql security invoker set search_path = public as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists sponsor_profiles_set_updated_at on public.sponsor_profiles;
create trigger sponsor_profiles_set_updated_at
  before update on public.sponsor_profiles
  for each row execute function public.set_sponsor_profiles_updated_at();

-- Preserve rows from the older sponsor table when it exists.
do $seed$
begin
  if to_regclass('public.sponsors') is not null then
    execute $sql$
      insert into public.sponsor_profiles
        (id, company_name, tagline, tier, tier_badge_color, logo, website,
         poc_name, poc_role, poc_contact, poc_email, sac_lead_name,
         sac_lead_contact, stall_location, stall_number, mou_status,
         invoice_status, metrics, deliverables)
      select id::text, name, '', 'Official Event Partner', '#38BDF8',
             coalesce(logo_url, ''), coalesce(website_url, ''), '', '', '', '',
             '', '', '', '', 'Under Review', 'Processing', '{}'::jsonb, '[]'::jsonb
      from public.sponsors
      on conflict (id) do nothing
    $sql$;
  end if;
end;
$seed$;

-- Ensure the tables used by the admin console are available to Realtime.
do $$
declare
  item record;
begin
  for item in
    select * from (values
      ('events'), ('registrations'), ('registration_members'), ('tickets'), ('payment_proofs'),
      ('departments'), ('announcements'), ('teams'), ('admin_roles'),
      ('admin_event_assignments'), ('sponsor_profiles')
    ) as tables(table_name)
  loop
    if to_regclass('public.' || item.table_name) is not null and not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = item.table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', item.table_name);
    end if;
  end loop;
end;
$$;
