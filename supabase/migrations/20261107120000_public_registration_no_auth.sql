begin;

-- Public registration is intentionally account-free. Admin, payment-review,
-- coordinator, and gate operations remain protected by their existing RBAC.
-- The public workflow is protected by event validation, invite-code ownership,
-- duplicate roll/email checks, capacity locks, and one-time email tokens.

create or replace function private.team_public_snapshot(p_team public.teams)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_event public.events%rowtype;
  v_leader_registration public.registrations%rowtype;
  v_members jsonb := case when jsonb_typeof(p_team.members) = 'array' then p_team.members else '[]'::jsonb end;
  v_roster jsonb;
  v_payment_status text := 'payment_required';
  v_leader_status text := 'membership_pending';
  v_leader_qr boolean := false;
begin
  select * into v_event from public.events e
  where e.id::text = p_team.event_id or e.slug = p_team.event_id
  limit 1;

  select * into v_leader_registration
  from public.registrations r
  where r.event_id = v_event.id
    and regexp_replace(upper(coalesce(r.team_code, '')), '[^A-Z0-9]', '', 'g') = regexp_replace(upper(p_team.team_code), '[^A-Z0-9]', '', 'g')
    and upper(coalesce(r.leader_roll, '')) = upper(coalesce(p_team.leader_roll, ''))
  order by r.created_at desc
  limit 1;

  if coalesce(v_event.fee, 0) = 0 then
    v_payment_status := 'not_applicable';
  elsif v_leader_registration.id is not null then
    v_payment_status := coalesce(v_leader_registration.payment_status, 'payment_required');
  end if;
  if v_leader_registration.id is not null then
    v_leader_status := v_leader_registration.payment_status;
    select exists (
      select 1 from public.tickets t
      where t.registration_id = v_leader_registration.id
        and nullif(trim(coalesce(t.qr_token, '')), '') is not null
    ) into v_leader_qr;
  end if;

  select coalesce(jsonb_agg(
    jsonb_build_object(
      'name', coalesce(m.value->>'name', ''),
      'rollNumber', coalesce(m.value->>'rollNumber', m.value->>'roll_number', ''),
      'registrationStatus', coalesce(member_registration.payment_status, 'membership_pending'),
      'qrGenerated', case when member_registration.id is null then false else exists (
        select 1 from public.tickets member_ticket
        where member_ticket.registration_id = member_registration.id
          and nullif(trim(coalesce(member_ticket.qr_token, '')), '') is not null
      ) end,
      'registeredAt', member_registration.created_at
    ) order by m.ordinality
  ), '[]'::jsonb)
  into v_roster
  from jsonb_array_elements(v_members) with ordinality as m(value, ordinality)
  left join lateral (
    select r.id, r.payment_status, r.created_at
    from public.registrations r
    where r.event_id = v_event.id
      and regexp_replace(upper(coalesce(r.team_code, '')), '[^A-Z0-9]', '', 'g') = regexp_replace(upper(p_team.team_code), '[^A-Z0-9]', '', 'g')
      and upper(coalesce(r.leader_roll, '')) = upper(coalesce(m.value->>'rollNumber', m.value->>'roll_number', ''))
    order by r.created_at desc
    limit 1
  ) member_registration on true;

  return jsonb_build_object(
    'id', p_team.id,
    'teamCode', p_team.team_code,
    'teamName', p_team.team_name,
    'eventId', p_team.event_id,
    'eventTitle', p_team.event_title,
    'registrationId', coalesce(p_team.registration_id, ''),
    'leaderName', p_team.leader_name,
    'leaderRoll', p_team.leader_roll,
    'leaderEmail', '',
    'leaderPhone', '',
    'leaderCollege', p_team.leader_college,
    'members', v_roster,
    'memberCount', jsonb_array_length(v_members),
    'totalMemberCount', jsonb_array_length(v_members) + 1,
    'maxTeamSize', p_team.max_team_size,
    'minTeamSize', p_team.min_team_size,
    'paymentStatus', v_payment_status,
    'leaderRegistrationStatus', v_leader_status,
    'leaderQrGenerated', v_leader_qr,
    'createdAt', p_team.created_at,
    'updatedAt', p_team.updated_at,
    'isCurrentUserLeader', false,
    'isCurrentUserMember', false
  );
end;
$$;

create or replace function private.create_or_reserve_team(
  p_team_code text,
  p_team_name text,
  p_event_id text,
  p_event_title text,
  p_leader_name text,
  p_leader_roll text default '',
  p_leader_email text default '',
  p_leader_phone text default '',
  p_leader_college text default '',
  p_leader_id text default null,
  p_max_team_size integer default 4,
  p_min_team_size integer default 2
)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_event public.events%rowtype;
  v_existing public.teams%rowtype;
  v_team public.teams%rowtype;
  v_code text := upper(trim(coalesce(p_team_code, '')));
  v_norm text;
  v_identity text := nullif(trim(coalesce(p_leader_id, '')) , '');
begin
  if v_identity is null then v_identity := 'guest-' || replace(gen_random_uuid()::text, '-', ''); end if;
  if v_code !~ '^[A-Z0-9][A-Z0-9-]{3,31}$' then raise exception 'Enter a valid team code.'; end if;
  if nullif(trim(coalesce(p_team_name, '')), '') is null or length(trim(p_team_name)) > 100 then raise exception 'Enter a team name of 100 characters or fewer.'; end if;
  if nullif(trim(coalesce(p_leader_name, '')), '') is null then raise exception 'Enter the team leader name.'; end if;
  if nullif(trim(coalesce(p_leader_email, '')), '') is null or position('@' in trim(p_leader_email)) < 2 then raise exception 'Enter a valid team leader email.'; end if;
  if nullif(trim(coalesce(p_leader_roll, '')), '') is null then raise exception 'Enter the team leader roll number.'; end if;
  if nullif(trim(coalesce(p_leader_phone, '')), '') is null then raise exception 'Enter the team leader phone number.'; end if;

  select * into v_event from public.events e
  where (e.id::text = p_event_id or e.slug = p_event_id)
    and not e.is_deleted and e.approval_status = 'approved'
    and e.status in ('open', 'upcoming')
    and (e.deadline is null or now() <= e.deadline);
  if not found then raise exception 'The selected event is unavailable for team registration.'; end if;
  if v_event.format = 'individual' then raise exception 'This event does not accept teams.'; end if;
  if p_max_team_size is distinct from v_event.max_team_size or p_min_team_size is distinct from v_event.min_team_size then
    raise exception 'Team size does not match the event rules.';
  end if;

  v_norm := regexp_replace(v_code, '[^A-Z0-9]', '', 'g');
  select * into v_existing from public.teams t
  where regexp_replace(upper(t.team_code), '[^A-Z0-9]', '', 'g') = v_norm
  for update;
  if found and (
    v_existing.event_id is distinct from v_event.id::text
    or (v_existing.leader_id is distinct from v_identity
        and upper(coalesce(v_existing.leader_roll, '')) <> upper(trim(p_leader_roll))
        and lower(coalesce(v_existing.leader_email, '')) <> lower(trim(p_leader_email)))
  ) then
    raise exception 'That team code is already in use.';
  end if;

  insert into public.teams (
    id, team_code, team_name, event_id, event_title, registration_id,
    leader_id, leader_name, leader_roll, leader_email, leader_phone,
    leader_college, members, max_team_size, min_team_size, updated_at
  ) values (
    coalesce(v_existing.id, 'TEAM-' || replace(gen_random_uuid()::text, '-', '')),
    v_code, trim(p_team_name), v_event.id::text, v_event.title,
    coalesce(v_existing.registration_id, ''), v_identity, trim(p_leader_name),
    upper(trim(p_leader_roll)), lower(trim(p_leader_email)), trim(p_leader_phone),
    trim(coalesce(p_leader_college, '')), coalesce(v_existing.members, '[]'::jsonb),
    v_event.max_team_size, v_event.min_team_size, now()
  )
  on conflict (team_code) do update set
    team_name = excluded.team_name,
    event_id = excluded.event_id,
    event_title = excluded.event_title,
    leader_id = excluded.leader_id,
    leader_name = excluded.leader_name,
    leader_roll = excluded.leader_roll,
    leader_email = excluded.leader_email,
    leader_phone = excluded.leader_phone,
    leader_college = excluded.leader_college,
    max_team_size = excluded.max_team_size,
    min_team_size = excluded.min_team_size,
    updated_at = now()
  returning * into v_team;

  return jsonb_build_object('success', true, 'team', private.team_public_snapshot(v_team));
end;
$$;

create or replace function public.create_or_reserve_team(
  p_team_code text, p_team_name text, p_event_id text, p_event_title text,
  p_leader_name text, p_leader_roll text default '', p_leader_email text default '',
  p_leader_phone text default '', p_leader_college text default '', p_leader_id text default null,
  p_max_team_size integer default 4, p_min_team_size integer default 2
)
returns jsonb language sql security definer set search_path = pg_catalog
as $$ select private.create_or_reserve_team(
  p_team_code, p_team_name, p_event_id, p_event_title, p_leader_name, p_leader_roll,
  p_leader_email, p_leader_phone, p_leader_college, p_leader_id, p_max_team_size, p_min_team_size
); $$;

create or replace function private.find_team_by_code(p_code text)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_team public.teams%rowtype;
  v_norm text := regexp_replace(upper(coalesce(p_code, '')), '[^A-Z0-9]', '', 'g');
begin
  if v_norm = '' then return jsonb_build_object('success', false, 'error', 'Enter a team code.'); end if;
  select * into v_team from public.teams t
  where regexp_replace(upper(t.team_code), '[^A-Z0-9]', '', 'g') = v_norm
  limit 1;
  if not found then return jsonb_build_object('success', false, 'error', 'Team not found.'); end if;
  return jsonb_build_object('success', true, 'team', private.team_public_snapshot(v_team));
end;
$$;

create or replace function public.find_team_by_code(p_code text)
returns jsonb language sql security definer set search_path = pg_catalog
as $$ select private.find_team_by_code(p_code); $$;

create or replace function private.get_team_dashboard(p_code text)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_team public.teams%rowtype;
  v_norm text := regexp_replace(upper(coalesce(p_code, '')), '[^A-Z0-9]', '', 'g');
begin
  if v_norm = '' then return jsonb_build_object('success', false, 'error', 'Enter a team code.'); end if;
  select * into v_team from public.teams t
  where regexp_replace(upper(t.team_code), '[^A-Z0-9]', '', 'g') = v_norm
  limit 1;
  if not found then return jsonb_build_object('success', false, 'error', 'Team not found.'); end if;
  return jsonb_build_object('success', true, 'team', private.team_public_snapshot(v_team));
end;
$$;

create or replace function public.get_team_dashboard(p_code text)
returns jsonb language sql security definer set search_path = pg_catalog
as $$ select private.get_team_dashboard(p_code); $$;

create or replace function private.join_team_membership(p_code text, p_member jsonb)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_team public.teams%rowtype;
  v_event public.events%rowtype;
  v_leader_registration public.registrations%rowtype;
  v_norm text := regexp_replace(upper(coalesce(p_code, '')), '[^A-Z0-9]', '', 'g');
  v_members jsonb;
  v_member jsonb;
  v_status text := 'payment_required';
begin
  if v_norm = '' or jsonb_typeof(p_member) <> 'object' then raise exception 'A valid team code and member details are required.'; end if;
  if nullif(trim(coalesce(p_member->>'name', '')), '') is null then raise exception 'Enter your full name.'; end if;
  if nullif(trim(coalesce(p_member->>'email', '')), '') is null or position('@' in trim(p_member->>'email')) < 2 then raise exception 'Enter a valid email.'; end if;
  if nullif(trim(coalesce(p_member->>'rollNumber', p_member->>'roll_number', '')), '') is null then raise exception 'Enter your roll number.'; end if;

  select * into v_team from public.teams t
  where regexp_replace(upper(t.team_code), '[^A-Z0-9]', '', 'g') = v_norm
  for update;
  if not found then return jsonb_build_object('success', false, 'error', 'Team not found.'); end if;
  select * into v_event from public.events e
  where (e.id::text = v_team.event_id or e.slug = v_team.event_id)
    and not e.is_deleted and e.approval_status = 'approved'
    and e.status in ('open', 'upcoming')
    and (e.deadline is null or now() <= e.deadline);
  if not found then return jsonb_build_object('success', false, 'error', 'This event is no longer accepting team members.'); end if;

  v_members := case when jsonb_typeof(v_team.members) = 'array' then v_team.members else '[]'::jsonb end;
  if jsonb_array_length(v_members) + 1 >= coalesce(v_team.max_team_size, v_event.max_team_size) then
    return jsonb_build_object('success', false, 'error', 'This team is already at full capacity.');
  end if;
  if upper(coalesce(v_team.leader_roll, '')) = upper(trim(coalesce(p_member->>'rollNumber', p_member->>'roll_number', '')))
     or lower(coalesce(v_team.leader_email, '')) = lower(trim(p_member->>'email')) then
    return jsonb_build_object('success', false, 'error', 'You are already the team leader.');
  end if;
  if exists (select 1 from jsonb_array_elements(v_members) m
    where upper(coalesce(m.value->>'rollNumber', m.value->>'roll_number', '')) = upper(trim(coalesce(p_member->>'rollNumber', p_member->>'roll_number', '')))
       or lower(coalesce(m.value->>'email', '')) = lower(trim(p_member->>'email'))) then
    return jsonb_build_object('success', false, 'error', 'You are already a member of this team.');
  end if;
  if exists (select 1 from public.registrations r where r.event_id = v_event.id and r.payment_status <> 'rejected' and upper(coalesce(r.leader_roll, '')) = upper(trim(coalesce(p_member->>'rollNumber', p_member->>'roll_number', ''))))
     or exists (select 1 from public.registration_members m join public.registrations r on r.id = m.registration_id where r.event_id = v_event.id and r.payment_status <> 'rejected' and upper(coalesce(m.roll_number, '')) = upper(trim(coalesce(p_member->>'rollNumber', p_member->>'roll_number', '')))) then
    return jsonb_build_object('success', false, 'error', 'This participant is already registered for the event.');
  end if;

  v_member := jsonb_build_object(
    'name', trim(p_member->>'name'), 'email', lower(trim(p_member->>'email')),
    'phone', trim(coalesce(p_member->>'phone', '')), 'college', trim(coalesce(p_member->>'college', '')),
    'rollNumber', upper(trim(coalesce(p_member->>'rollNumber', p_member->>'roll_number', '')))
  );
  update public.teams set members = v_members || jsonb_build_array(v_member), updated_at = now()
  where id = v_team.id returning * into v_team;

  select * into v_leader_registration from public.registrations r
  where r.event_id = v_event.id
    and regexp_replace(upper(coalesce(r.team_code, '')), '[^A-Z0-9]', '', 'g') = v_norm
    and upper(coalesce(r.leader_roll, '')) = upper(coalesce(v_team.leader_roll, ''))
  order by r.created_at desc limit 1;
  if found then
    v_status := coalesce(v_leader_registration.payment_status, 'payment_required');
    if not exists (select 1 from public.registration_members m where m.registration_id = v_leader_registration.id and upper(coalesce(m.roll_number, '')) = upper(v_member->>'rollNumber')) then
      insert into public.registration_members (registration_id, name, email, phone, college, roll_number)
      values (v_leader_registration.id, v_member->>'name', v_member->>'email', v_member->>'phone', v_member->>'college', v_member->>'rollNumber');
    end if;
  elsif coalesce(v_event.fee, 0) = 0 then
    v_status := 'not_applicable';
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (null, 'TEAM_MEMBERSHIP_JOINED', 'team', v_team.id::text,
    jsonb_build_object('team_code', v_team.team_code, 'event_id', v_event.id, 'payment_status', v_status, 'guest', true));

  return jsonb_build_object('success', true, 'alreadyMember', false,
    'isLeaderPaid', v_status in ('verified', 'verification_pending', 'not_applicable'),
    'leaderPaymentStatus', v_status, 'team', private.team_public_snapshot(v_team));
end;
$$;

create or replace function public.join_team_membership(p_code text, p_member jsonb)
returns jsonb language sql security definer set search_path = pg_catalog
as $$ select private.join_team_membership(p_code, p_member); $$;

-- Guest checkout path. Authenticated callers continue using the existing
-- hardened private.create_registration implementation.
create or replace function private.create_guest_registration(
  p_event_id uuid, p_buyer_roll text default null, p_leader_name text default '',
  p_leader_email text default '', p_leader_phone text default '', p_leader_college text default '',
  p_leader_roll text default '', p_format text default 'individual', p_fee integer default 0,
  p_payment_status text default 'payment_required', p_transaction_id text default null,
  p_payment_screenshot_url text default null, p_teammates jsonb default '[]'::jsonb,
  p_team_name text default null, p_team_code text default null
)
returns jsonb language plpgsql security definer set search_path = pg_catalog
as $$
declare
  v_event public.events%rowtype;
  v_team public.teams%rowtype;
  v_registration_id uuid;
  v_display_id text;
  v_qr_token text;
  v_delivery_token text := encode(gen_random_bytes(32), 'hex');
  v_roll text;
  v_leader_roll text := nullif(upper(trim(coalesce(p_leader_roll, ''))), '');
  v_payment_proof text := nullif(trim(coalesce(p_payment_screenshot_url, '')), '');
  v_transaction_id text := nullif(trim(coalesce(p_transaction_id, '')), '');
  v_teammate jsonb;
  v_seen_rolls text[] := '{}'::text[];
  v_payment_status text;
begin
  if nullif(trim(coalesce(p_leader_name, '')), '') is null then raise exception 'Enter the participant name.'; end if;
  if nullif(trim(coalesce(p_leader_email, '')), '') is null or position('@' in trim(p_leader_email)) < 2 then raise exception 'Enter a valid participant email.'; end if;
  if nullif(trim(coalesce(p_leader_phone, '')), '') is null then raise exception 'Enter the participant phone number.'; end if;
  if v_leader_roll is null then raise exception 'Enter the participant roll number.'; end if;
  if p_format not in ('individual', 'duo', 'team') then raise exception 'Unsupported participation format.'; end if;
  if jsonb_typeof(coalesce(p_teammates, '[]'::jsonb)) <> 'array' then raise exception 'Teammates must be a list.'; end if;

  select * into v_event from public.events e where e.id = p_event_id and not e.is_deleted for update;
  if not found then raise exception 'Event not found.'; end if;
  if v_event.status not in ('open', 'upcoming') or v_event.approval_status <> 'approved' then raise exception 'This event is not accepting registrations.'; end if;
  if v_event.deadline is not null and now() > v_event.deadline then raise exception 'The registration deadline has passed.'; end if;
  if p_format <> v_event.format then raise exception 'This event does not support the selected participation format.'; end if;
  if coalesce(v_event.capacity, 0) <= 0 or coalesce(v_event.registered_count, 0) >= v_event.capacity then
    update public.events set status = 'full', updated_at = now() where id = p_event_id;
    return jsonb_build_object('success', false, 'error', 'This event has reached capacity.');
  end if;
  if p_format <> 'individual' then
    if nullif(trim(coalesce(p_team_name, '')), '') is null then raise exception 'Enter your team name.'; end if;
    if nullif(trim(coalesce(p_team_code, '')), '') is null then raise exception 'Create or enter a team invite code.'; end if;
    select * into v_team from public.teams t
    where t.event_id = p_event_id::text
      and regexp_replace(upper(t.team_code), '[^A-Z0-9]', '', 'g') = regexp_replace(upper(trim(p_team_code)), '[^A-Z0-9]', '', 'g')
    for update;
    if not found then raise exception 'The team reservation was not found. Create the team first.'; end if;
    if upper(coalesce(v_team.leader_roll, '')) <> v_leader_roll or lower(coalesce(v_team.leader_email, '')) <> lower(trim(p_leader_email)) then
      raise exception 'The checkout details do not match the team leader details.';
    end if;
  end if;
  if v_payment_proof is not null and v_payment_proof not like 'guest/%' then raise exception 'Guest payment evidence is invalid.'; end if;
  if v_event.fee > 0 and (v_transaction_id is null or v_payment_proof is null) then raise exception 'Payment transaction ID and payment proof are required.'; end if;

  if exists (select 1 from public.registrations r where r.event_id = p_event_id and r.payment_status <> 'rejected' and upper(coalesce(r.leader_roll, '')) = v_leader_roll)
     or exists (select 1 from public.registration_members m join public.registrations r on r.id = m.registration_id where r.event_id = p_event_id and r.payment_status <> 'rejected' and upper(coalesce(m.roll_number, '')) = v_leader_roll) then
    raise exception 'This participant is already registered for the event.';
  end if;
  for v_teammate in select value from jsonb_array_elements(coalesce(p_teammates, '[]'::jsonb)) loop
    v_roll := nullif(upper(trim(coalesce(v_teammate->>'rollNumber', v_teammate->>'roll_number', ''))), '');
    if nullif(trim(coalesce(v_teammate->>'name', '')), '') is null or v_roll is null then raise exception 'Every teammate must have a name and roll number.'; end if;
    if v_roll = v_leader_roll or v_roll = any(v_seen_rolls) then raise exception 'Duplicate roll numbers are not allowed in a registration.'; end if;
    v_seen_rolls := array_append(v_seen_rolls, v_roll);
  end loop;

  v_payment_status := case when v_event.fee = 0 then 'not_applicable' else 'verification_pending' end;
  v_display_id := public.generate_display_id();
  v_qr_token := public.generate_qr_token(v_display_id);
  insert into public.registrations (
    display_id, user_id, buyer_roll, event_id, event_title, leader_name, leader_email,
    leader_phone, leader_college, leader_roll, format, fee, source, payment_status,
    transaction_id, payment_screenshot_url, team_name, team_code, department_code, checked_in
  ) values (
    v_display_id, null, nullif(trim(p_buyer_roll), ''), p_event_id, v_event.title,
    trim(p_leader_name), lower(trim(p_leader_email)), trim(p_leader_phone), trim(p_leader_college),
    v_leader_roll, p_format, v_event.fee, 'online', v_payment_status, v_transaction_id,
    v_payment_proof, nullif(trim(p_team_name), ''), nullif(trim(p_team_code), ''), v_event.department_code, false
  ) returning id into v_registration_id;

  for v_teammate in select value from jsonb_array_elements(coalesce(p_teammates, '[]'::jsonb)) loop
    insert into public.registration_members (registration_id, name, email, phone, college, roll_number)
    values (v_registration_id, trim(v_teammate->>'name'), lower(trim(coalesce(v_teammate->>'email', ''))), trim(coalesce(v_teammate->>'phone', '')), trim(coalesce(v_teammate->>'college', '')), upper(trim(coalesce(v_teammate->>'rollNumber', v_teammate->>'roll_number', ''))));
  end loop;
  if v_team.id is not null then
    update public.teams set registration_id = v_display_id, updated_at = now() where id = v_team.id;
  end if;
  insert into public.tickets (registration_id, qr_token) values (v_registration_id, v_qr_token);
  insert into public.registration_email_deliveries (registration_id, recipient_email, delivery_token)
  values (v_registration_id, lower(trim(p_leader_email)), v_delivery_token);
  update public.events set registered_count = coalesce(registered_count, 0) + 1, status = case when coalesce(registered_count, 0) + 1 >= capacity then 'full' else status end, updated_at = now() where id = p_event_id;
  if v_team.id is not null then
    update public.registrations set payment_status = v_payment_status, transaction_id = coalesce(v_transaction_id, transaction_id), payment_screenshot_url = coalesce(v_payment_proof, payment_screenshot_url), updated_at = now()
    where event_id = p_event_id and id <> v_registration_id and upper(coalesce(team_code, '')) = upper(trim(p_team_code)) and fee = 0 and source = 'online';
  end if;
  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (null, 'REGISTRATION_CREATED', 'registration', v_registration_id::text, jsonb_build_object('display_id', v_display_id, 'event_id', p_event_id, 'source', 'online', 'guest', true));
  return jsonb_build_object('success', true, 'registration', jsonb_build_object(
    'id', v_display_id, 'uuid', v_registration_id, 'eventId', p_event_id, 'eventTitle', v_event.title,
    'leaderName', trim(p_leader_name), 'leaderEmail', lower(trim(p_leader_email)), 'leaderPhone', trim(p_leader_phone),
    'leaderCollege', trim(p_leader_college), 'leaderRoll', v_leader_roll, 'teamName', nullif(trim(p_team_name), ''),
    'teamCode', nullif(trim(p_team_code), ''), 'format', p_format, 'fee', v_event.fee, 'source', 'online',
    'paymentStatus', v_payment_status, 'transactionId', v_transaction_id, 'qrToken', v_qr_token,
    'checkedIn', false, 'registrationDate', now(), 'emailDeliveryToken', v_delivery_token
  ));
end;
$$;

create or replace function private.create_guest_registrations(p_items jsonb default '[]'::jsonb)
returns jsonb language plpgsql security definer set search_path = pg_catalog
as $$
declare
  v_item jsonb;
  v_result jsonb;
  v_results jsonb := '[]'::jsonb;
  v_event_id uuid;
begin
  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' then raise exception 'Registration items must be a list.'; end if;
  if jsonb_array_length(coalesce(p_items, '[]'::jsonb)) < 1 or jsonb_array_length(coalesce(p_items, '[]'::jsonb)) > 10 then raise exception 'Select between 1 and 10 passes.'; end if;
  for v_item in select value from jsonb_array_elements(p_items) loop
    begin v_event_id := (coalesce(v_item->>'eventId', v_item->>'event_id'))::uuid; exception when invalid_text_representation then raise exception 'A registration item has an invalid event.'; end;
    v_result := private.create_guest_registration(v_event_id, nullif(trim(coalesce(v_item->>'buyerRoll', v_item->>'buyer_roll', '')), ''), coalesce(v_item->>'leaderName', v_item->>'leader_name', ''), coalesce(v_item->>'leaderEmail', v_item->>'leader_email', ''), coalesce(v_item->>'leaderPhone', v_item->>'leader_phone', ''), coalesce(v_item->>'leaderCollege', v_item->>'leader_college', ''), coalesce(v_item->>'leaderRoll', v_item->>'leader_roll', ''), coalesce(v_item->>'format', 'individual'), coalesce((v_item->>'fee')::integer, 0), nullif(trim(coalesce(v_item->>'paymentStatus', v_item->>'payment_status', '')), ''), nullif(trim(coalesce(v_item->>'transactionId', v_item->>'transaction_id', '')), ''), nullif(trim(coalesce(v_item->>'paymentScreenshotUrl', v_item->>'payment_screenshot_url', '')), ''), coalesce(v_item->'teammates', v_item->'registration_members', '[]'::jsonb), nullif(trim(coalesce(v_item->>'teamName', v_item->>'team_name', '')), ''), nullif(trim(coalesce(v_item->>'teamCode', v_item->>'team_code', '')), ''));
    if coalesce((v_result->>'success')::boolean, false) is not true then raise exception '%', coalesce(v_result->>'error', 'The database rejected a registration item.'); end if;
    v_results := v_results || jsonb_build_array(v_result->'registration');
  end loop;
  return jsonb_build_object('success', true, 'registrations', v_results);
end;
$$;

-- Joining a team remains a reservation. Once the leader submits checkout,
-- this trigger creates the member registrations and tickets atomically for
-- both authenticated and guest-created teams.
create or replace function private.expand_team_registration()
returns trigger
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_team public.teams%rowtype;
  v_event public.events%rowtype;
  v_member jsonb;
  v_roll text;
  v_email text;
  v_registration_id uuid;
  v_display_id text;
  v_qr_token text;
  v_delivery_token text;
  v_new_count integer := 0;
begin
  if new.team_code is null or new.format = 'individual' then return new; end if;

  select * into v_team from public.teams t
  where t.event_id = new.event_id::text
    and regexp_replace(upper(t.team_code), '[^A-Z0-9]', '', 'g') = regexp_replace(upper(new.team_code), '[^A-Z0-9]', '', 'g')
  for update;
  if not found then return new; end if;
  select * into v_event from public.events e where e.id = new.event_id for update;

  for v_member in select value from jsonb_array_elements(case when jsonb_typeof(v_team.members) = 'array' then v_team.members else '[]'::jsonb end) loop
    v_roll := nullif(upper(trim(coalesce(v_member->>'rollNumber', v_member->>'roll_number', ''))), '');
    if v_roll is null or v_roll = upper(coalesce(new.leader_roll, '')) then continue; end if;
    if not exists (
      select 1 from public.registrations r
      where r.event_id = new.event_id
        and regexp_replace(upper(coalesce(r.team_code, '')), '[^A-Z0-9]', '', 'g') = regexp_replace(upper(new.team_code), '[^A-Z0-9]', '', 'g')
        and upper(coalesce(r.leader_roll, '')) = v_roll
        and r.payment_status <> 'rejected'
    ) then v_new_count := v_new_count + 1; end if;
  end loop;

  if coalesce(v_event.registered_count, 0) + v_new_count + 1 > coalesce(v_event.capacity, 0) then
    raise exception 'The event does not have enough remaining capacity for the full team.';
  end if;

  for v_member in select value from jsonb_array_elements(case when jsonb_typeof(v_team.members) = 'array' then v_team.members else '[]'::jsonb end) loop
    v_roll := nullif(upper(trim(coalesce(v_member->>'rollNumber', v_member->>'roll_number', ''))), '');
    if v_roll is null or v_roll = upper(coalesce(new.leader_roll, '')) then continue; end if;
    if not exists (
      select 1 from public.registrations r
      where r.event_id = new.event_id
        and regexp_replace(upper(coalesce(r.team_code, '')), '[^A-Z0-9]', '', 'g') = regexp_replace(upper(new.team_code), '[^A-Z0-9]', '', 'g')
        and upper(coalesce(r.leader_roll, '')) = v_roll
        and r.payment_status <> 'rejected'
    ) then
      v_email := nullif(lower(trim(coalesce(v_member->>'email', ''))), '');
      v_display_id := public.generate_display_id();
      v_qr_token := public.generate_qr_token(v_display_id);
      v_delivery_token := encode(gen_random_bytes(32), 'hex');
      insert into public.registrations (
        display_id, user_id, buyer_roll, event_id, event_title, leader_name, leader_email,
        leader_phone, leader_college, leader_roll, format, fee, source, payment_status,
        transaction_id, team_name, team_code, department_code, checked_in
      ) values (
        v_display_id, null, v_roll, new.event_id, v_event.title,
        trim(coalesce(v_member->>'name', 'Participant')), coalesce(v_email, ''),
        trim(coalesce(v_member->>'phone', '')), trim(coalesce(v_member->>'college', '')), v_roll,
        new.format, 0, 'online', new.payment_status, new.transaction_id,
        new.team_name, new.team_code, v_event.department_code, false
      ) returning id into v_registration_id;
      insert into public.tickets (registration_id, qr_token) values (v_registration_id, v_qr_token);
      if v_email is not null then
        insert into public.registration_email_deliveries (registration_id, recipient_email, delivery_token)
        values (v_registration_id, v_email, v_delivery_token);
      end if;
      insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
      values (null, 'TEAM_MEMBER_REGISTRATION_CREATED', 'registration', v_registration_id::text,
        jsonb_build_object('team_code', new.team_code, 'event_id', new.event_id, 'guest', true));
    end if;
  end loop;

  if v_new_count > 0 then
    update public.events set registered_count = coalesce(registered_count, 0) + v_new_count,
      status = case when coalesce(registered_count, 0) + v_new_count >= capacity then 'full' else status end,
      updated_at = now() where id = new.event_id;
  end if;
  return new;
end;
$$;

drop trigger if exists expand_team_registration on public.registrations;
create trigger expand_team_registration after insert on public.registrations
for each row execute function private.expand_team_registration();

-- Route anonymous calls to the account-free writer and keep authenticated
-- calls on the existing account-aware implementation.
create or replace function public.create_registration(
  p_event_id uuid, p_user_id uuid default null, p_buyer_roll text default null,
  p_leader_name text default '', p_leader_email text default '', p_leader_phone text default '',
  p_leader_college text default '', p_leader_roll text default '', p_format text default 'individual',
  p_fee integer default 0, p_source text default 'online', p_payment_status text default 'payment_required',
  p_transaction_id text default null, p_payment_screenshot_url text default null,
  p_spot_registered_by uuid default null, p_teammates jsonb default '[]'::jsonb,
  p_team_name text default null, p_team_code text default null
)
returns jsonb language plpgsql security definer set search_path = pg_catalog
as $$
begin
  if auth.uid() is null then
    if p_source <> 'online' or p_user_id is not null or p_spot_registered_by is not null then raise exception 'Guest registration is only available for online registrations.'; end if;
    return private.create_guest_registration(p_event_id, p_buyer_roll, p_leader_name, p_leader_email, p_leader_phone, p_leader_college, p_leader_roll, p_format, p_fee, p_payment_status, p_transaction_id, p_payment_screenshot_url, p_teammates, p_team_name, p_team_code);
  end if;
  return private.create_registration(p_event_id, p_user_id, p_buyer_roll, p_leader_name, p_leader_email, p_leader_phone, p_leader_college, p_leader_roll, p_format, p_fee, p_source, p_payment_status, p_transaction_id, p_payment_screenshot_url, p_spot_registered_by, p_teammates, p_team_name, p_team_code);
end;
$$;

create or replace function public.create_registrations(p_user_id uuid default null, p_items jsonb default '[]'::jsonb, p_source text default 'online')
returns jsonb language plpgsql security definer set search_path = pg_catalog
as $$
begin
  if auth.uid() is null then
    if p_source <> 'online' or p_user_id is not null then raise exception 'Guest registration is only available for online registrations.'; end if;
    return private.create_guest_registrations(p_items);
  end if;
  return private.create_registrations(p_user_id, p_items, p_source);
end;
$$;

revoke all on function public.create_or_reserve_team(text, text, text, text, text, text, text, text, text, text, integer, integer) from public;
grant execute on function public.create_or_reserve_team(text, text, text, text, text, text, text, text, text, text, integer, integer) to anon, authenticated;
revoke all on function public.find_team_by_code(text) from public;
grant execute on function public.find_team_by_code(text) to anon, authenticated;
revoke all on function public.get_team_dashboard(text) from public;
grant execute on function public.get_team_dashboard(text) to anon, authenticated;
revoke all on function public.join_team_membership(text, jsonb) from public;
grant execute on function public.join_team_membership(text, jsonb) to anon, authenticated;
revoke all on function public.create_registration(uuid, uuid, text, text, text, text, text, text, text, integer, text, text, text, text, uuid, jsonb, text, text) from public;
grant execute on function public.create_registration(uuid, uuid, text, text, text, text, text, text, text, integer, text, text, text, text, uuid, jsonb, text, text) to anon, authenticated;
revoke all on function public.create_registrations(uuid, jsonb, text) from public;
grant execute on function public.create_registrations(uuid, jsonb, text) to anon, authenticated;

commit;
