begin;

-- Guest registration is intentionally limited to the public registration
-- workflow. Team creation/joining and payment review remain authenticated.
create table if not exists public.registration_email_deliveries (
  id uuid primary key default gen_random_uuid(),
  registration_id uuid not null references public.registrations(id) on delete cascade,
  recipient_email text not null,
  delivery_token text not null unique,
  status text not null default 'queued' check (status in ('queued', 'sending', 'sent', 'failed')),
  attempts integer not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists registration_email_deliveries_registration_idx
  on public.registration_email_deliveries(registration_id);
create index if not exists registration_email_deliveries_status_idx
  on public.registration_email_deliveries(status, created_at);

alter table public.registration_email_deliveries enable row level security;
revoke all on table public.registration_email_deliveries from public, anon, authenticated;

-- Allow public online individual registration. The security-definer function
-- still validates the event, capacity, duplicate roll number, payment proof,
-- and all participant fields before writing anything.
grant execute on function public.create_registration(
  uuid, uuid, text, text, text, text, text, text, text, integer, text, text,
  text, text, uuid, jsonb, text, text
) to anon, authenticated;
grant execute on function public.create_registrations(uuid, jsonb, text) to anon, authenticated;

create or replace function private.create_registration(
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
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_actor uuid := auth.uid();
  v_event public.events%rowtype;
  v_team public.teams%rowtype;
  v_registration_id uuid;
  v_display_id text;
  v_qr_token text;
  v_delivery_token text;
  v_payment_status text;
  v_user_id uuid;
  v_teammate jsonb;
  v_roll text;
  v_leader_roll text := nullif(upper(trim(coalesce(p_leader_roll, ''))), '');
  v_buyer_roll text := nullif(upper(trim(coalesce(p_buyer_roll, ''))), '');
  v_team_name text := nullif(trim(coalesce(p_team_name, '')), '');
  v_team_code text := nullif(upper(trim(coalesce(p_team_code, ''))), '');
  v_transaction_id text := nullif(trim(coalesce(p_transaction_id, '')), '');
  v_payment_proof text := nullif(trim(coalesce(p_payment_screenshot_url, '')), '');
  v_seen_rolls text[] := '{}'::text[];
  v_teammate_count integer := 0;
begin
  if p_source is null or p_source not in ('online', 'spot') then raise exception 'Unsupported registration source.'; end if;
  if p_format is null or p_format not in ('individual', 'duo', 'team') then raise exception 'Unsupported participation format.'; end if;
  if p_source = 'spot' and v_actor is null then raise exception 'Sign in as an authorized coordinator before creating a spot registration.'; end if;
  if p_source = 'online' and p_format <> 'individual' and v_actor is null then
    raise exception 'Sign in before creating or joining a team registration.';
  end if;
  if p_user_id is not null and (v_actor is null or p_user_id <> v_actor) then raise exception 'The registration account does not match the signed-in user.'; end if;
  if jsonb_typeof(coalesce(p_teammates, '[]'::jsonb)) <> 'array' then raise exception 'Teammates must be a list.'; end if;
  if nullif(trim(coalesce(p_leader_name, '')), '') is null then raise exception 'Enter the participant name.'; end if;
  if length(trim(p_leader_name)) > 150 then raise exception 'Participant name is too long.'; end if;
  if nullif(trim(coalesce(p_leader_email, '')), '') is null or position('@' in trim(p_leader_email)) < 2 then raise exception 'Enter a valid participant email.'; end if;
  if nullif(trim(coalesce(p_leader_phone, '')), '') is null then raise exception 'Enter the participant phone number.'; end if;
  if v_leader_roll is null then raise exception 'Enter the participant roll number.'; end if;

  select * into v_event from public.events e where e.id = p_event_id and not e.is_deleted for update;
  if not found then raise exception 'Event not found.'; end if;
  if v_event.status not in ('open', 'upcoming') or v_event.approval_status <> 'approved' then raise exception 'This event is not accepting registrations.'; end if;
  if v_event.deadline is not null and now() > v_event.deadline then raise exception 'The registration deadline has passed.'; end if;
  if p_format <> v_event.format then raise exception 'This event does not support the selected participation format.'; end if;
  if coalesce(v_event.capacity, 0) <= 0 or coalesce(v_event.registered_count, 0) >= v_event.capacity then
    update public.events set status = 'full', updated_at = now() where id = p_event_id;
    return jsonb_build_object('success', false, 'error', 'This event has reached capacity.');
  end if;

  if p_source = 'spot' then
    if not private.can_manage_event(p_event_id, v_event.department_code) then raise exception 'You are not authorized to create spot registrations for this event.'; end if;
    v_user_id := null;
  else
    v_user_id := v_actor;
  end if;

  if p_format <> 'individual' then
    if v_team_name is null then v_team_name := trim(p_leader_name) || '''s Team'; end if;
    if length(v_team_name) > 100 then raise exception 'Team name must be 100 characters or fewer.'; end if;
    if v_team_code is null then raise exception 'Create a team code before registering this event.'; end if;
    if v_team_code !~ '^[A-Z0-9][A-Z0-9-]{3,31}$' then raise exception 'Enter a valid team code.'; end if;
  elsif v_team_code is not null or v_team_name is not null then
    raise exception 'Individual registrations cannot include team details.';
  end if;

  if p_source = 'online' and p_format <> 'individual' then
    select * into v_team from public.teams t
    where regexp_replace(upper(t.team_code), '[^A-Z0-9]', '', 'g') = regexp_replace(v_team_code, '[^A-Z0-9]', '', 'g')
      and t.event_id = p_event_id::text for update;
    if not found then raise exception 'The team reservation was not found. Try again before submitting.'; end if;
    if v_team.leader_id is distinct from v_actor::text then raise exception 'Only the team leader can submit this registration.'; end if;
  end if;

  v_teammate_count := jsonb_array_length(coalesce(p_teammates, '[]'::jsonb));
  if p_format = 'individual' and v_teammate_count > 0 then raise exception 'Individual registrations cannot include teammates.'; end if;
  if v_teammate_count + 1 > coalesce(v_event.max_team_size, 1) then raise exception 'The team has exceeded the event maximum size.'; end if;
  if p_source = 'spot' and v_teammate_count + 1 < coalesce(v_event.min_team_size, 1) then raise exception 'The team must contain at least % members.', v_event.min_team_size; end if;

  if p_source = 'online' and v_payment_proof is not null then
    if v_actor is not null and v_payment_proof not like (v_actor::text || '/%') then raise exception 'Payment evidence must be uploaded by the signed-in account.'; end if;
    if v_actor is null and v_payment_proof not like 'guest/%' then raise exception 'Guest payment evidence is invalid.'; end if;
  end if;
  if length(coalesce(v_transaction_id, '')) > 120 then raise exception 'Transaction reference is too long.'; end if;
  if v_event.fee > 0 and p_source = 'online' and (v_transaction_id is null or v_payment_proof is null) then raise exception 'Payment transaction ID and payment proof are required.'; end if;

  if exists (select 1 from public.registrations r where r.event_id = p_event_id and r.payment_status <> 'rejected' and upper(coalesce(r.leader_roll, '')) = v_leader_roll)
     or exists (select 1 from public.registration_members m join public.registrations r on r.id = m.registration_id where r.event_id = p_event_id and r.payment_status <> 'rejected' and upper(coalesce(m.roll_number, '')) = v_leader_roll) then
    raise exception 'This participant is already registered for the event.';
  end if;

  for v_teammate in select t.value from jsonb_array_elements(coalesce(p_teammates, '[]'::jsonb)) as t(value) loop
    if nullif(trim(coalesce(v_teammate->>'name', '')), '') is null then raise exception 'Every teammate must have a name.'; end if;
    v_roll := nullif(upper(trim(coalesce(v_teammate->>'rollNumber', v_teammate->>'roll_number', ''))), '');
    if v_roll is null then raise exception 'Every teammate must have a roll number.'; end if;
    if v_roll = v_leader_roll or v_roll = any(v_seen_rolls) then raise exception 'Duplicate roll numbers are not allowed in a registration.'; end if;
    v_seen_rolls := array_append(v_seen_rolls, v_roll);
    if exists (select 1 from public.registrations r where r.event_id = p_event_id and r.payment_status <> 'rejected' and upper(coalesce(r.leader_roll, '')) = v_roll)
       or exists (select 1 from public.registration_members m join public.registrations r on r.id = m.registration_id where r.event_id = p_event_id and r.payment_status <> 'rejected' and upper(coalesce(m.roll_number, '')) = v_roll) then raise exception 'A teammate is already registered for this event.'; end if;
  end loop;

  v_payment_status := case when v_event.fee = 0 then 'not_applicable' when p_source = 'spot' and p_payment_status = 'verified' then 'verified' when p_source = 'spot' then coalesce(p_payment_status, 'payment_required') else 'verification_pending' end;
  v_display_id := public.generate_display_id();
  v_qr_token := public.generate_qr_token(v_display_id);
  v_delivery_token := encode(gen_random_bytes(32), 'hex');

  insert into public.registrations (display_id, user_id, buyer_roll, event_id, event_title, leader_name, leader_email, leader_phone, leader_college, leader_roll, format, fee, source, payment_status, transaction_id, payment_screenshot_url, spot_registered_by, team_name, team_code, department_code, checked_in)
  values (v_display_id, v_user_id, v_buyer_roll, p_event_id, v_event.title, trim(p_leader_name), lower(trim(p_leader_email)), trim(p_leader_phone), trim(p_leader_college), v_leader_roll, p_format, v_event.fee, p_source, v_payment_status, v_transaction_id, v_payment_proof, case when p_source = 'spot' then v_actor else null end, v_team_name, v_team_code, v_event.department_code, false)
  returning id into v_registration_id;

  for v_teammate in select t.value from jsonb_array_elements(coalesce(p_teammates, '[]'::jsonb)) as t(value) loop
    insert into public.registration_members (registration_id, name, email, phone, college, roll_number)
    values (v_registration_id, trim(coalesce(v_teammate->>'name', '')), lower(trim(coalesce(v_teammate->>'email', ''))), trim(coalesce(v_teammate->>'phone', '')), trim(coalesce(v_teammate->>'college', '')), upper(trim(coalesce(v_teammate->>'rollNumber', v_teammate->>'roll_number', ''))));
  end loop;

  -- Preserve the existing team workflow: members who joined before checkout
  -- are attached to the leader registration atomically.
  if v_team_code is not null then
    select * into v_team from public.teams t
    where regexp_replace(upper(t.team_code), '[^A-Z0-9]', '', 'g') = regexp_replace(v_team_code, '[^A-Z0-9]', '', 'g')
      and t.event_id = p_event_id::text limit 1;
    if found and jsonb_typeof(v_team.members) = 'array' then
      for v_teammate in select t.value from jsonb_array_elements(v_team.members) as t(value) loop
        insert into public.registration_members (registration_id, name, email, phone, college, roll_number)
        select v_registration_id,
          trim(coalesce(v_teammate->>'name', '')),
          lower(trim(coalesce(v_teammate->>'email', ''))),
          trim(coalesce(v_teammate->>'phone', '')),
          trim(coalesce(v_teammate->>'college', '')),
          upper(trim(coalesce(v_teammate->>'rollNumber', v_teammate->>'roll_number', '')))
        where nullif(trim(coalesce(v_teammate->>'rollNumber', v_teammate->>'roll_number', '')), '') is not null
          and not exists (
            select 1 from public.registration_members m
            where m.registration_id = v_registration_id
              and upper(coalesce(m.roll_number, '')) = upper(trim(coalesce(v_teammate->>'rollNumber', v_teammate->>'roll_number', '')))
          );
      end loop;
    end if;
  end if;

  insert into public.tickets (registration_id, qr_token) values (v_registration_id, v_qr_token);
  insert into public.registration_email_deliveries (registration_id, recipient_email, delivery_token)
  values (v_registration_id, lower(trim(p_leader_email)), v_delivery_token);
  update public.events set registered_count = coalesce(registered_count, 0) + 1, status = case when coalesce(registered_count, 0) + 1 >= capacity then 'full' else status end, updated_at = now() where id = p_event_id;

  if v_team_code is not null and p_source = 'online' then
    update public.registrations
    set payment_status = v_payment_status,
        transaction_id = coalesce(v_transaction_id, transaction_id),
        payment_screenshot_url = coalesce(v_payment_proof, payment_screenshot_url),
        updated_at = now()
    where event_id = p_event_id and upper(coalesce(team_code, '')) = upper(v_team_code)
      and id <> v_registration_id and fee = 0 and source = 'online';
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (v_actor, 'REGISTRATION_CREATED', 'registration', v_registration_id::text, jsonb_build_object('display_id', v_display_id, 'event_id', p_event_id, 'source', p_source, 'guest', v_actor is null));
  return jsonb_build_object('success', true, 'registration', jsonb_build_object('id', v_display_id, 'uuid', v_registration_id, 'eventId', p_event_id, 'eventTitle', v_event.title, 'leaderName', trim(p_leader_name), 'leaderEmail', lower(trim(p_leader_email)), 'leaderPhone', trim(p_leader_phone), 'leaderCollege', trim(p_leader_college), 'leaderRoll', v_leader_roll, 'teamName', v_team_name, 'teamCode', v_team_code, 'format', p_format, 'fee', v_event.fee, 'source', p_source, 'paymentStatus', v_payment_status, 'transactionId', v_transaction_id, 'qrToken', v_qr_token, 'checkedIn', false, 'registrationDate', now(), 'emailDeliveryToken', v_delivery_token));
end;
$$;

create or replace function private.create_registrations(
  p_user_id uuid default null,
  p_items jsonb default '[]'::jsonb,
  p_source text default 'online'
)
returns jsonb language plpgsql security definer set search_path = pg_catalog
as $$
declare
  v_actor uuid := auth.uid();
  v_item jsonb;
  v_result jsonb;
  v_event_id uuid;
  v_items_count integer;
  v_results jsonb := '[]'::jsonb;
begin
  if p_source <> 'online' then raise exception 'Batch registration is available for online orders only.'; end if;
  if p_user_id is not null and (v_actor is null or p_user_id <> v_actor) then raise exception 'The registration account does not match the signed-in user.'; end if;
  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' then raise exception 'Registration items must be a list.'; end if;
  v_items_count := jsonb_array_length(coalesce(p_items, '[]'::jsonb));
  if v_items_count < 1 or v_items_count > 10 then raise exception 'Select between 1 and 10 passes.'; end if;
  for v_item in select value from jsonb_array_elements(p_items) loop
    begin v_event_id := (coalesce(v_item->>'eventId', v_item->>'event_id'))::uuid; exception when invalid_text_representation then raise exception 'A registration item has an invalid event.'; end;
    v_result := private.create_registration(v_event_id, v_actor, nullif(trim(coalesce(v_item->>'buyerRoll', v_item->>'buyer_roll', '')), ''), coalesce(v_item->>'leaderName', v_item->>'leader_name', ''), coalesce(v_item->>'leaderEmail', v_item->>'leader_email', ''), coalesce(v_item->>'leaderPhone', v_item->>'leader_phone', ''), coalesce(v_item->>'leaderCollege', v_item->>'leader_college', ''), coalesce(v_item->>'leaderRoll', v_item->>'leader_roll', ''), coalesce(v_item->>'format', 'individual'), coalesce((v_item->>'fee')::integer, 0), 'online', coalesce(v_item->>'paymentStatus', v_item->>'payment_status', 'payment_required'), nullif(trim(coalesce(v_item->>'transactionId', v_item->>'transaction_id', '')), ''), nullif(trim(coalesce(v_item->>'paymentScreenshotUrl', v_item->>'payment_screenshot_url', '')), ''), null, coalesce(v_item->'teammates', v_item->'registration_members', '[]'::jsonb), nullif(trim(coalesce(v_item->>'teamName', v_item->>'team_name', '')), ''), nullif(trim(coalesce(v_item->>'teamCode', v_item->>'team_code', '')), ''));
    if coalesce((v_result->>'success')::boolean, false) is not true then raise exception '%', coalesce(v_result->>'error', 'The database rejected a registration item.'); end if;
    v_results := v_results || jsonb_build_array(v_result->'registration');
  end loop;
  return jsonb_build_object('success', true, 'registrations', v_results);
end;
$$;

revoke all on function public.create_registration(uuid, uuid, text, text, text, text, text, text, text, integer, text, text, text, text, uuid, jsonb, text, text) from public, anon, authenticated;
grant execute on function public.create_registration(uuid, uuid, text, text, text, text, text, text, text, integer, text, text, text, text, uuid, jsonb, text, text) to anon, authenticated;
revoke all on function public.create_registrations(uuid, jsonb, text) from public, anon, authenticated;
grant execute on function public.create_registrations(uuid, jsonb, text) to anon, authenticated;

commit;
