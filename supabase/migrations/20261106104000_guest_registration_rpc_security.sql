begin;

-- The public RPC is the controlled entry point for guest registrations. It
-- must be able to call the private validator/writer while the private
-- function remains inaccessible directly to anonymous clients.
create or replace function public.create_registration(
  p_event_id uuid,
  p_user_id uuid default null,
  p_buyer_roll text default null,
  p_leader_name text default '',
  p_leader_email text default '',
  p_leader_phone text default '',
  p_leader_college text default '',
  p_leader_roll text default '',
  p_format text default 'individual',
  p_fee integer default 0,
  p_source text default 'online',
  p_payment_status text default 'payment_required',
  p_transaction_id text default null,
  p_payment_screenshot_url text default null,
  p_spot_registered_by uuid default null,
  p_teammates jsonb default '[]'::jsonb,
  p_team_name text default null,
  p_team_code text default null
)
returns jsonb
language sql
security definer
set search_path = pg_catalog
as $$
  select private.create_registration(
    p_event_id, p_user_id, p_buyer_roll, p_leader_name, p_leader_email,
    p_leader_phone, p_leader_college, p_leader_roll, p_format, p_fee,
    p_source, p_payment_status, p_transaction_id, p_payment_screenshot_url,
    p_spot_registered_by, p_teammates, p_team_name, p_team_code
  );
$$;

create or replace function public.create_registrations(
  p_user_id uuid default null,
  p_items jsonb default '[]'::jsonb,
  p_source text default 'online'
)
returns jsonb
language sql
security definer
set search_path = pg_catalog
as $$
  select private.create_registrations(p_user_id, p_items, p_source);
$$;

revoke all on function public.create_registration(uuid, uuid, text, text, text, text, text, text, text, integer, text, text, text, text, uuid, jsonb, text, text) from public;
grant execute on function public.create_registration(uuid, uuid, text, text, text, text, text, text, text, integer, text, text, text, text, uuid, jsonb, text, text) to anon, authenticated;
revoke all on function public.create_registrations(uuid, jsonb, text) from public;
grant execute on function public.create_registrations(uuid, jsonb, text) to anon, authenticated;

commit;
