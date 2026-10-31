begin;

-- Registration creation is the single source of truth for every portal. The
-- browser-provided fee, status, event title, and event identifier are treated
-- as hints only; trusted event state is read and locked inside the transaction.
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
  if v_actor is null then raise exception 'Sign in before registering.'; end if;
  if p_source is null or p_source not in ('online', 'spot') then raise exception 'Unsupported registration source.'; end if;
  if p_format is null or p_format not in ('individual', 'duo', 'team') then raise exception 'Unsupported participation format.'; end if;
  if jsonb_typeof(coalesce(p_teammates, '[]'::jsonb)) <> 'array' then raise exception 'Teammates must be a list.'; end if;
  if nullif(trim(coalesce(p_leader_name, '')), '') is null then raise exception 'Enter the participant name.'; end if;
  if length(trim(p_leader_name)) > 150 then raise exception 'Participant name is too long.'; end if;
  if nullif(trim(coalesce(p_leader_email, '')), '') is null or position('@' in trim(p_leader_email)) < 2 then raise exception 'Enter a valid participant email.'; end if;
  if nullif(trim(coalesce(p_leader_phone, '')), '') is null then raise exception 'Enter the participant phone number.'; end if;
  if v_leader_roll is null then raise exception 'Enter the participant roll number.'; end if;

  select * into v_event
  from public.events e
  where e.id = p_event_id and not e.is_deleted
  for update;
  if not found then raise exception 'Event not found.'; end if;
  if v_event.status not in ('open', 'upcoming') or v_event.approval_status <> 'approved' then
    raise exception 'This event is not accepting registrations.';
  end if;
  if v_event.deadline is not null and now() > v_event.deadline then
    raise exception 'The registration deadline has passed.';
  end if;
  if p_format <> v_event.format then raise exception 'This event does not support the selected participation format.'; end if;
  if coalesce(v_event.capacity, 0) <= 0 or coalesce(v_event.registered_count, 0) >= v_event.capacity then
    update public.events set status = 'full', updated_at = now() where id = p_event_id;
    return jsonb_build_object('success', false, 'error', 'This event has reached capacity.');
  end if;

  if p_source = 'spot' then
    if not private.can_manage_event(p_event_id, v_event.department_code) then
      raise exception 'You are not authorized to create spot registrations for this event.';
    end if;
    v_user_id := null;
    if v_team_code is null and p_format <> 'individual' then
      v_team_code := 'FX-SPOT-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);
    end if;
  else
    if p_user_id is not null and p_user_id <> v_actor then raise exception 'The registration account does not match the signed-in user.'; end if;
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
    select * into v_team
    from public.teams t
    where regexp_replace(upper(t.team_code), '[^A-Z0-9]', '', 'g') = regexp_replace(v_team_code, '[^A-Z0-9]', '', 'g')
      and t.event_id = p_event_id::text
    for update;
    if not found then raise exception 'The team reservation was not found. Try again before submitting.'; end if;
    if v_team.leader_id is distinct from v_actor::text then raise exception 'Only the team leader can submit this registration.'; end if;
  end if;

  v_teammate_count := jsonb_array_length(coalesce(p_teammates, '[]'::jsonb));
  if p_format = 'individual' and v_teammate_count > 0 then raise exception 'Individual registrations cannot include teammates.'; end if;
  if v_teammate_count + 1 > coalesce(v_event.max_team_size, 1) then raise exception 'The team has exceeded the event maximum size.'; end if;
  -- Online teams may reserve the leader pass before every member has joined;
  -- spot desks must submit a complete roster because entry is issued immediately.
  if p_source = 'spot' and v_teammate_count + 1 < coalesce(v_event.min_team_size, 1) then
    raise exception 'The team must contain at least % members.', v_event.min_team_size;
  end if;

  if p_source = 'online' and v_payment_proof is not null
    and v_payment_proof not like (v_actor::text || '/%') then
    raise exception 'Payment evidence must be uploaded by the signed-in account.';
  end if;
  if length(coalesce(v_transaction_id, '')) > 120 then raise exception 'Transaction reference is too long.'; end if;
  if v_event.fee > 0 and p_source = 'online' and (v_transaction_id is null or v_payment_proof is null) then
    raise exception 'Payment transaction ID and payment proof are required.';
  end if;

  -- Roll numbers identify participants, not buyers. This distinction permits
  -- one buyer to purchase multiple passes while still preventing a student
  -- from participating twice in the same event.
  if exists (
    select 1 from public.registrations r
    where r.event_id = p_event_id and r.payment_status <> 'rejected'
      and upper(coalesce(r.leader_roll, '')) = v_leader_roll
  ) or exists (
    select 1 from public.registration_members m
    join public.registrations r on r.id = m.registration_id
    where r.event_id = p_event_id and r.payment_status <> 'rejected'
      and upper(coalesce(m.roll_number, '')) = v_leader_roll
  ) then
    raise exception 'This participant is already registered for the event.';
  end if;

  for v_teammate in select t.value from jsonb_array_elements(coalesce(p_teammates, '[]'::jsonb)) as t(value) loop
    if nullif(trim(coalesce(v_teammate->>'name', '')), '') is null then raise exception 'Every teammate must have a name.'; end if;
    v_roll := nullif(upper(trim(coalesce(v_teammate->>'rollNumber', v_teammate->>'roll_number', ''))), '');
    if v_roll is null then raise exception 'Every teammate must have a roll number.'; end if;
    if v_roll = v_leader_roll or v_roll = any(v_seen_rolls) then raise exception 'Duplicate roll numbers are not allowed in a registration.'; end if;
    v_seen_rolls := array_append(v_seen_rolls, v_roll);
    if exists (
      select 1 from public.registrations r
      where r.event_id = p_event_id and r.payment_status <> 'rejected'
        and upper(coalesce(r.leader_roll, '')) = v_roll
    ) or exists (
      select 1 from public.registration_members m
      join public.registrations r on r.id = m.registration_id
      where r.event_id = p_event_id and r.payment_status <> 'rejected'
        and upper(coalesce(m.roll_number, '')) = v_roll
    ) then raise exception 'A teammate is already registered for this event.'; end if;
  end loop;

  v_payment_status := case
    when v_event.fee = 0 then 'not_applicable'
    when p_source = 'spot' and p_payment_status = 'verified' then 'verified'
    when p_source = 'spot' then coalesce(p_payment_status, 'payment_required')
    else 'verification_pending'
  end;
  if v_payment_status not in ('payment_required', 'verification_pending', 'verified', 'rejected', 'not_applicable') then
    raise exception 'Unsupported payment status.';
  end if;

  v_display_id := public.generate_display_id();
  v_qr_token := public.generate_qr_token(v_display_id);
  insert into public.registrations (
    display_id, user_id, buyer_roll, event_id, event_title,
    leader_name, leader_email, leader_phone, leader_college, leader_roll,
    format, fee, source, payment_status, transaction_id,
    payment_screenshot_url, spot_registered_by, team_name, team_code,
    department_code, checked_in
  ) values (
    v_display_id, v_user_id, v_buyer_roll, p_event_id, v_event.title,
    trim(p_leader_name), lower(trim(p_leader_email)), trim(p_leader_phone), trim(p_leader_college), v_leader_roll,
    p_format, v_event.fee, p_source, v_payment_status, v_transaction_id,
    v_payment_proof, case when p_source = 'spot' then v_actor else null end,
    v_team_name, v_team_code, v_event.department_code, false
  ) returning id into v_registration_id;

  for v_teammate in select t.value from jsonb_array_elements(coalesce(p_teammates, '[]'::jsonb)) as t(value) loop
    insert into public.registration_members (registration_id, name, email, phone, college, roll_number)
    values (
      v_registration_id,
      trim(coalesce(v_teammate->>'name', '')),
      lower(trim(coalesce(v_teammate->>'email', ''))),
      trim(coalesce(v_teammate->>'phone', '')),
      trim(coalesce(v_teammate->>'college', '')),
      upper(trim(coalesce(v_teammate->>'rollNumber', v_teammate->>'roll_number', '')))
    );
  end loop;

  -- Members who joined before the leader completed payment are already in the
  -- team JSON roster. Attach them to the leader registration as well.
  if v_team_code is not null then
    select * into v_team from public.teams t
    where regexp_replace(upper(t.team_code), '[^A-Z0-9]', '', 'g') = regexp_replace(v_team_code, '[^A-Z0-9]', '', 'g')
      and t.event_id = p_event_id::text
    limit 1;
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
  update public.events
  set registered_count = coalesce(registered_count, 0) + 1,
      status = case when coalesce(registered_count, 0) + 1 >= capacity then 'full' else status end,
      updated_at = now()
  where id = p_event_id;

  -- A team pays once. Keep member passes synchronized with the leader's
  -- pending/verified/rejected state without changing the event seat count.
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
  values (v_actor, 'REGISTRATION_CREATED', 'registration', v_registration_id::text,
    jsonb_build_object('display_id', v_display_id, 'event_id', p_event_id, 'source', p_source));

  return jsonb_build_object('success', true, 'registration', jsonb_build_object(
    'id', v_display_id, 'uuid', v_registration_id, 'eventId', p_event_id,
    'eventTitle', v_event.title, 'leaderName', trim(p_leader_name), 'leaderEmail', lower(trim(p_leader_email)),
    'leaderPhone', trim(p_leader_phone), 'leaderCollege', trim(p_leader_college),
    'leaderRoll', v_leader_roll, 'teamName', v_team_name, 'teamCode', v_team_code,
    'format', p_format, 'fee', v_event.fee, 'source', p_source, 'paymentStatus', v_payment_status,
    'transactionId', v_transaction_id, 'qrToken', v_qr_token, 'checkedIn', false,
    'registrationDate', now()
  ));
end;
$$;

-- One transaction for a multi-pass order. If any event is full, closed, past
-- deadline, duplicated, or otherwise invalid, no pass from the order remains.
create or replace function private.create_registrations(
  p_user_id uuid default null,
  p_items jsonb default '[]'::jsonb,
  p_source text default 'online'
)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_actor uuid := auth.uid();
  v_item jsonb;
  v_result jsonb;
  v_event_id uuid;
  v_items_count integer;
  v_results jsonb := '[]'::jsonb;
begin
  if v_actor is null then raise exception 'Sign in before registering.'; end if;
  if p_source <> 'online' then raise exception 'Batch registration is available for online orders only.'; end if;
  if p_user_id is not null and p_user_id <> v_actor then raise exception 'The registration account does not match the signed-in user.'; end if;
  if jsonb_typeof(coalesce(p_items, '[]'::jsonb)) <> 'array' then raise exception 'Registration items must be a list.'; end if;
  v_items_count := jsonb_array_length(coalesce(p_items, '[]'::jsonb));
  if v_items_count < 1 then raise exception 'Select at least one pass.'; end if;
  if v_items_count > 10 then raise exception 'You can create at most 10 passes in one order.'; end if;

  for v_item in select value from jsonb_array_elements(p_items) loop
    begin
      v_event_id := (coalesce(v_item->>'eventId', v_item->>'event_id'))::uuid;
    exception when invalid_text_representation then
      raise exception 'A registration item has an invalid event.';
    end;

    v_result := private.create_registration(
      v_event_id,
      v_actor,
      nullif(trim(coalesce(v_item->>'buyerRoll', v_item->>'buyer_roll', '')), ''),
      coalesce(v_item->>'leaderName', v_item->>'leader_name', ''),
      coalesce(v_item->>'leaderEmail', v_item->>'leader_email', ''),
      coalesce(v_item->>'leaderPhone', v_item->>'leader_phone', ''),
      coalesce(v_item->>'leaderCollege', v_item->>'leader_college', ''),
      coalesce(v_item->>'leaderRoll', v_item->>'leader_roll', ''),
      coalesce(v_item->>'format', 'individual'),
      coalesce((v_item->>'fee')::integer, 0),
      'online',
      coalesce(v_item->>'paymentStatus', v_item->>'payment_status', 'payment_required'),
      nullif(trim(coalesce(v_item->>'transactionId', v_item->>'transaction_id', '')), ''),
      nullif(trim(coalesce(v_item->>'paymentScreenshotUrl', v_item->>'payment_screenshot_url', '')), ''),
      null,
      coalesce(v_item->'teammates', v_item->'registration_members', '[]'::jsonb),
      nullif(trim(coalesce(v_item->>'teamName', v_item->>'team_name', '')), ''),
      nullif(trim(coalesce(v_item->>'teamCode', v_item->>'team_code', '')), '')
    );
    if coalesce((v_result->>'success')::boolean, false) is not true then
      raise exception '%', coalesce(v_result->>'error', 'The database rejected a registration item.');
    end if;
    v_results := v_results || jsonb_build_array(v_result->'registration');
  end loop;

  return jsonb_build_object('success', true, 'registrations', v_results);
end;
$$;

-- Team joins must produce real registrations and tickets, not just a local
-- browser pass. This makes user, admin, HOD, coordinator, finance, and gate
-- portals all read the same participant records.
create or replace function private.join_team_by_code(p_code text, p_member jsonb)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_profile public.profiles%rowtype;
  v_team public.teams%rowtype;
  v_event public.events%rowtype;
  v_leader_registration public.registrations%rowtype;
  v_member_registration public.registrations%rowtype;
  v_norm text := regexp_replace(upper(coalesce(p_code, '')), '[^A-Z0-9]', '', 'g');
  v_member jsonb;
  v_members jsonb;
  v_is_leader_paid boolean := false;
  v_leader_payment_status text;
  v_leader_transaction_id text;
  v_member_payment_status text;
  v_member_display_id text;
  v_member_qr_token text;
begin
  if auth.uid() is null then raise exception 'Sign in before joining a team.'; end if;
  if v_norm = '' or jsonb_typeof(p_member) <> 'object' then raise exception 'A valid team code and member profile are required.'; end if;

  select * into v_profile from public.profiles where id = auth.uid();
  if not found or nullif(trim(v_profile.full_name), '') is null
      or nullif(trim(v_profile.email), '') is null
      or nullif(trim(v_profile.roll_number), '') is null then
    raise exception 'Complete your account profile before joining a team.';
  end if;
  if lower(trim(coalesce(p_member->>'email', ''))) <> lower(v_profile.email)
      or upper(trim(coalesce(p_member->>'rollNumber', p_member->>'roll_number', ''))) <> upper(v_profile.roll_number) then
    raise exception 'The member details must match the signed-in account.';
  end if;

  select * into v_team from public.teams t
  where regexp_replace(upper(t.team_code), '[^A-Z0-9]', '', 'g') = v_norm
  for update;
  if not found then return jsonb_build_object('success', false, 'error', 'Team not found.'); end if;
  if v_team.leader_id = auth.uid()::text then return jsonb_build_object('success', false, 'error', 'You already lead this team.'); end if;

  select * into v_event from public.events e
  where (e.id::text = v_team.event_id or e.slug = v_team.event_id)
    and not e.is_deleted and e.approval_status = 'approved'
    and e.status in ('open', 'upcoming')
    and (e.deadline is null or now() <= e.deadline);
  if not found then return jsonb_build_object('success', false, 'error', 'This event is no longer accepting team members.'); end if;

  -- Retry-safe: return the already-created pass after a client timeout.
  select * into v_member_registration from public.registrations r
  where r.event_id = v_event.id and r.user_id = auth.uid()
    and upper(coalesce(r.team_code, '')) = upper(v_team.team_code)
  order by r.created_at desc limit 1;
  if found then
    return jsonb_build_object(
      'success', true, 'isLeaderPaid', v_member_registration.payment_status in ('verified', 'verification_pending', 'not_applicable'),
      'leaderPaymentStatus', v_member_registration.payment_status,
      'leaderTransactionId', v_member_registration.transaction_id,
      'registration', jsonb_build_object('id', v_member_registration.display_id, 'uuid', v_member_registration.id,
        'eventId', v_event.id, 'eventTitle', v_event.title, 'leaderName', v_member_registration.leader_name,
        'leaderEmail', v_member_registration.leader_email, 'leaderPhone', v_member_registration.leader_phone,
        'leaderCollege', v_member_registration.leader_college, 'leaderRoll', v_member_registration.leader_roll,
        'teamName', v_member_registration.team_name, 'teamCode', v_member_registration.team_code,
        'format', v_member_registration.format, 'fee', v_member_registration.fee,
        'paymentStatus', v_member_registration.payment_status, 'transactionId', v_member_registration.transaction_id,
        'qrToken', (select t.qr_token from public.tickets t where t.registration_id = v_member_registration.id),
        'checkedIn', v_member_registration.checked_in)
    );
  end if;

  v_members := case when jsonb_typeof(v_team.members) = 'array' then v_team.members else '[]'::jsonb end;
  if jsonb_array_length(v_members) + 1 >= coalesce(v_team.max_team_size, v_event.max_team_size) then
    return jsonb_build_object('success', false, 'error', 'This team is already at full capacity.');
  end if;
  if exists (
    select 1 from jsonb_array_elements(v_members) m
    where upper(coalesce(m.value->>'rollNumber', m.value->>'roll_number', '')) = upper(v_profile.roll_number)
      or lower(coalesce(m.value->>'email', '')) = lower(v_profile.email)
  ) then
    return jsonb_build_object('success', false, 'error', 'This account is already a member of the team.');
  end if;
  if exists (
    select 1 from public.registrations r
    where r.event_id = v_event.id and r.payment_status <> 'rejected'
      and upper(coalesce(r.leader_roll, '')) = upper(v_profile.roll_number)
  ) or exists (
    select 1 from public.registration_members m
    join public.registrations r on r.id = m.registration_id
    where r.event_id = v_event.id and r.payment_status <> 'rejected'
      and upper(coalesce(m.roll_number, '')) = upper(v_profile.roll_number)
  ) then
    return jsonb_build_object('success', false, 'error', 'This participant is already registered for the event.');
  end if;

  v_member := jsonb_build_object(
    'name', v_profile.full_name, 'email', v_profile.email, 'phone', coalesce(v_profile.phone, ''),
    'college', v_profile.college, 'rollNumber', v_profile.roll_number
  );
  v_members := v_members || jsonb_build_array(v_member);
  update public.teams set members = v_members, updated_at = now() where id = v_team.id returning * into v_team;

  select * into v_leader_registration from public.registrations r
  where r.event_id = v_event.id
    and r.user_id::text = v_team.leader_id
    and upper(coalesce(r.team_code, '')) = upper(v_team.team_code)
  order by r.created_at desc limit 1;
  if found then
    v_is_leader_paid := v_leader_registration.payment_status in ('verified', 'verification_pending', 'not_applicable');
    v_leader_payment_status := v_leader_registration.payment_status;
    v_leader_transaction_id := v_leader_registration.transaction_id;
  end if;
  v_member_payment_status := case when v_event.fee = 0 then 'not_applicable' else coalesce(v_leader_payment_status, 'payment_required') end;

  if found and not exists (
    select 1 from public.registration_members m
    where m.registration_id = v_leader_registration.id
      and upper(coalesce(m.roll_number, '')) = upper(v_profile.roll_number)
  ) then
    insert into public.registration_members (registration_id, name, email, phone, college, roll_number)
    values (v_leader_registration.id, v_profile.full_name, v_profile.email, coalesce(v_profile.phone, ''), v_profile.college, v_profile.roll_number);
  end if;

  v_member_display_id := public.generate_display_id();
  v_member_qr_token := public.generate_qr_token(v_member_display_id);
  insert into public.registrations (
    display_id, user_id, buyer_roll, event_id, event_title,
    leader_name, leader_email, leader_phone, leader_college, leader_roll,
    format, fee, source, payment_status, transaction_id, payment_screenshot_url,
    team_name, team_code, department_code, checked_in
  ) values (
    v_member_display_id, auth.uid(), v_profile.roll_number, v_event.id, v_event.title,
    v_profile.full_name, lower(v_profile.email), coalesce(v_profile.phone, ''), v_profile.college, upper(v_profile.roll_number),
    v_event.format, 0, 'online', v_member_payment_status,
    case when v_is_leader_paid then v_leader_transaction_id else null end,
    case when v_is_leader_paid then v_leader_registration.payment_screenshot_url else null end,
    v_team.team_name, v_team.team_code, v_event.department_code, false
  ) returning id into v_member_registration;
  insert into public.tickets (registration_id, qr_token) values (v_member_registration.id, v_member_qr_token);

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'TEAM_MEMBER_JOINED', 'registration', v_member_registration.id::text,
    jsonb_build_object('display_id', v_member_display_id, 'team_code', v_team.team_code, 'event_id', v_event.id));

  return jsonb_build_object(
    'success', true, 'isLeaderPaid', v_is_leader_paid,
    'leaderPaymentStatus', v_leader_payment_status, 'leaderTransactionId', v_leader_transaction_id,
    'registration', jsonb_build_object('id', v_member_display_id, 'uuid', v_member_registration.id,
      'eventId', v_event.id, 'eventTitle', v_event.title, 'leaderName', v_profile.full_name,
      'leaderEmail', lower(v_profile.email), 'leaderPhone', coalesce(v_profile.phone, ''),
      'leaderCollege', v_profile.college, 'leaderRoll', upper(v_profile.roll_number),
      'teamName', v_team.team_name, 'teamCode', v_team.team_code, 'format', v_event.format,
      'fee', 0, 'source', 'online', 'paymentStatus', v_member_payment_status,
      'transactionId', case when v_is_leader_paid then v_leader_transaction_id else null end,
      'qrToken', v_member_qr_token, 'checkedIn', false),
    'team', jsonb_build_object(
      'id', v_team.id, 'teamCode', v_team.team_code, 'teamName', v_team.team_name,
      'eventId', v_team.event_id, 'eventTitle', v_team.event_title, 'registrationId', '',
      'leaderName', v_team.leader_name, 'leaderRoll', '', 'leaderEmail', '', 'leaderPhone', '', 'leaderCollege', '',
      'members', '[]'::jsonb, 'memberCount', jsonb_array_length(v_members),
      'maxTeamSize', v_team.max_team_size, 'minTeamSize', v_team.min_team_size,
      'createdAt', v_team.created_at, 'isCurrentUserLeader', false, 'isCurrentUserMember', true
    )
  );
end;
$$;

-- Payment review also propagates to the zero-fee member passes of the same team.
create or replace function private.review_registration_payment(
  p_display_id text,
  p_status text,
  p_rejection_reason text default null
)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_reg public.registrations%rowtype;
  v_reviewer text;
  v_reason text := case when p_status = 'rejected' then nullif(trim(coalesce(p_rejection_reason, '')), '') else null end;
begin
  if auth.uid() is null then raise exception 'Sign in before reviewing payments.'; end if;
  if p_status not in ('verified', 'rejected', 'verification_pending', 'payment_required', 'not_applicable') then raise exception 'Unsupported payment status.'; end if;
  select * into v_reg from public.registrations where display_id = p_display_id for update;
  if not found then raise exception 'Registration not found.'; end if;
  if not private.current_is_global_admin()
    and not private.current_user_has_role(array['finance_reviewer'])
    and not exists (select 1 from public.events e where e.id = v_reg.event_id and private.can_manage_event(e.id, e.department_code)) then
    raise exception 'You are not authorized to review this registration.';
  end if;
  select r.full_name into v_reviewer from public.admin_roles r where r.user_id = auth.uid() and r.active limit 1;
  v_reviewer := coalesce(v_reviewer, 'FESTRONIX Admin');

  update public.registrations set
    payment_status = p_status,
    verified_by = v_reviewer,
    verified_at = case when p_status in ('verified', 'rejected') then now() else null end,
    rejection_reason = v_reason,
    updated_at = now()
  where id = v_reg.id;

  update public.registrations set
    payment_status = p_status,
    rejection_reason = v_reason,
    updated_at = now()
  where event_id = v_reg.event_id and v_reg.team_code is not null
    and upper(coalesce(team_code, '')) = upper(v_reg.team_code)
    and id <> v_reg.id and fee = 0 and source = 'online';

  update public.payment_proofs set
    status = case when p_status = 'verified' then 'verified' when p_status = 'rejected' then 'rejected' else 'pending' end,
    reviewed_by = auth.uid(), reviewer_name = v_reviewer,
    rejection_reason = v_reason,
    reviewed_at = case when p_status in ('verified', 'rejected') then now() else null end
  where registration_id = v_reg.id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'PAYMENT_' || upper(p_status), 'registration', v_reg.id::text,
    jsonb_build_object('display_id', v_reg.display_id, 'status', p_status, 'reason', v_reason));
  return jsonb_build_object('success', true, 'displayId', v_reg.display_id, 'status', p_status,
    'verifiedBy', v_reviewer, 'verifiedAt', now());
end;
$$;

create or replace function public.create_registration(
  p_event_id uuid, p_user_id uuid default null, p_buyer_roll text default null,
  p_leader_name text default '', p_leader_email text default '', p_leader_phone text default '',
  p_leader_college text default '', p_leader_roll text default '', p_format text default 'individual',
  p_fee integer default 0, p_source text default 'online', p_payment_status text default 'payment_required',
  p_transaction_id text default null, p_payment_screenshot_url text default null,
  p_spot_registered_by uuid default null, p_teammates jsonb default '[]'::jsonb,
  p_team_name text default null, p_team_code text default null
)
returns jsonb language sql security invoker set search_path = pg_catalog
as $$ select private.create_registration(
  p_event_id, p_user_id, p_buyer_roll, p_leader_name, p_leader_email, p_leader_phone,
  p_leader_college, p_leader_roll, p_format, p_fee, p_source, p_payment_status,
  p_transaction_id, p_payment_screenshot_url, p_spot_registered_by, p_teammates,
  p_team_name, p_team_code
); $$;

create or replace function public.create_registrations(
  p_user_id uuid default null, p_items jsonb default '[]'::jsonb, p_source text default 'online'
)
returns jsonb language sql security invoker set search_path = pg_catalog
as $$ select private.create_registrations(p_user_id, p_items, p_source); $$;

create or replace function public.join_team_by_code(p_code text, p_member jsonb)
returns jsonb language sql security invoker set search_path = pg_catalog
as $$ select private.join_team_by_code(p_code, p_member); $$;

create or replace function public.review_registration_payment(
  p_display_id text, p_status text, p_rejection_reason text default null
)
returns jsonb language sql security invoker set search_path = pg_catalog
as $$ select private.review_registration_payment(p_display_id, p_status, p_rejection_reason); $$;

revoke all on function private.create_registration(uuid, uuid, text, text, text, text, text, text, text, integer, text, text, text, text, uuid, jsonb, text, text) from public, anon;
grant execute on function private.create_registration(uuid, uuid, text, text, text, text, text, text, text, integer, text, text, text, text, uuid, jsonb, text, text) to authenticated;
revoke all on function public.create_registration(uuid, uuid, text, text, text, text, text, text, text, integer, text, text, text, text, uuid, jsonb, text, text) from public, anon;
grant execute on function public.create_registration(uuid, uuid, text, text, text, text, text, text, text, integer, text, text, text, text, uuid, jsonb, text, text) to authenticated;
revoke all on function private.create_registrations(uuid, jsonb, text) from public, anon;
grant execute on function private.create_registrations(uuid, jsonb, text) to authenticated;
revoke all on function public.create_registrations(uuid, jsonb, text) from public, anon;
grant execute on function public.create_registrations(uuid, jsonb, text) to authenticated;
revoke all on function private.join_team_by_code(text, jsonb) from public, anon;
grant execute on function private.join_team_by_code(text, jsonb) to authenticated;
revoke all on function public.join_team_by_code(text, jsonb) from public, anon;
grant execute on function public.join_team_by_code(text, jsonb) to authenticated;
revoke all on function private.review_registration_payment(text, text, text) from public, anon;
grant execute on function private.review_registration_payment(text, text, text) to authenticated;
revoke all on function public.review_registration_payment(text, text, text) from public, anon;
grant execute on function public.review_registration_payment(text, text, text) to authenticated;

create index if not exists registrations_event_leader_roll_idx
  on public.registrations (event_id, upper(leader_roll));
create index if not exists registrations_event_team_code_idx
  on public.registrations (event_id, upper(team_code));

commit;
