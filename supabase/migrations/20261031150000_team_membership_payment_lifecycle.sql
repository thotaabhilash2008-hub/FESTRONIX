-- Team membership is a reservation until the leader completes checkout.
-- No member registration or ticket is created by joining a team.
create or replace function private.join_team_membership(p_code text, p_member jsonb)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_profile public.profiles%rowtype;
  v_team public.teams%rowtype;
  v_event public.events%rowtype;
  v_leader_registration public.registrations%rowtype;
  v_members jsonb;
  v_norm text := regexp_replace(upper(coalesce(p_code, '')), '[^A-Z0-9]', '', 'g');
  v_member jsonb;
  v_member_count integer := 0;
  v_is_already_member boolean := false;
  v_payment_status text := 'payment_required';
begin
  if auth.uid() is null then raise exception 'Sign in before joining a team.'; end if;
  if v_norm = '' or jsonb_typeof(p_member) <> 'object' then
    raise exception 'A valid team code and member profile are required.';
  end if;

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

  select * into v_team
  from public.teams t
  where regexp_replace(upper(t.team_code), '[^A-Z0-9]', '', 'g') = v_norm
  for update;
  if not found then return jsonb_build_object('success', false, 'error', 'Team not found.'); end if;
  if v_team.leader_id = auth.uid()::text then
    return jsonb_build_object('success', false, 'error', 'You already lead this team.');
  end if;

  select * into v_event from public.events e
  where (e.id::text = v_team.event_id or e.slug = v_team.event_id)
    and not e.is_deleted and e.approval_status = 'approved'
    and e.status in ('open', 'upcoming')
    and (e.deadline is null or now() <= e.deadline);
  if not found then return jsonb_build_object('success', false, 'error', 'This event is no longer accepting team members.'); end if;

  v_members := case when jsonb_typeof(v_team.members) = 'array' then v_team.members else '[]'::jsonb end;
  v_member_count := jsonb_array_length(v_members);
  v_is_already_member := exists (
    select 1 from jsonb_array_elements(v_members) m
    where upper(coalesce(m.value->>'rollNumber', m.value->>'roll_number', '')) = upper(v_profile.roll_number)
       or lower(coalesce(m.value->>'email', '')) = lower(v_profile.email)
  );

  if v_is_already_member then
    select * into v_leader_registration from public.registrations r
    where r.event_id = v_event.id
      and r.user_id::text = v_team.leader_id
      and regexp_replace(upper(coalesce(r.team_code, '')), '[^A-Z0-9]', '', 'g') = v_norm
    order by r.created_at desc limit 1;
    if coalesce(v_event.fee, 0) = 0 then
      v_payment_status := 'not_applicable';
    elsif found then
      v_payment_status := coalesce(v_leader_registration.payment_status, 'payment_required');
    end if;
    return jsonb_build_object(
      'success', true,
      'alreadyMember', true,
      'isLeaderPaid', v_payment_status in ('verified', 'verification_pending', 'not_applicable'),
      'leaderPaymentStatus', v_payment_status,
      'team', jsonb_build_object(
        'id', v_team.id, 'teamCode', v_team.team_code, 'teamName', v_team.team_name,
        'eventId', v_team.event_id, 'eventTitle', v_team.event_title,
        'registrationId', '', 'leaderName', v_team.leader_name, 'leaderRoll', '',
        'leaderEmail', '', 'leaderPhone', '', 'leaderCollege', '',
        'members', '[]'::jsonb, 'memberCount', v_member_count,
        'totalMemberCount', v_member_count + 1,
        'maxTeamSize', v_team.max_team_size, 'minTeamSize', v_team.min_team_size,
        'paymentStatus', v_payment_status, 'createdAt', v_team.created_at,
        'updatedAt', v_team.updated_at, 'isCurrentUserLeader', false,
        'isCurrentUserMember', true
      )
    );
  end if;

  if v_member_count + 1 >= coalesce(v_team.max_team_size, v_event.max_team_size) then
    return jsonb_build_object('success', false, 'error', 'This team is already at full capacity.');
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
    'name', v_profile.full_name, 'email', lower(v_profile.email),
    'phone', coalesce(v_profile.phone, ''), 'college', v_profile.college,
    'rollNumber', upper(v_profile.roll_number)
  );
  update public.teams
  set members = v_members || jsonb_build_array(v_member), updated_at = now()
  where id = v_team.id
  returning * into v_team;

  select * into v_leader_registration from public.registrations r
  where r.event_id = v_event.id
    and r.user_id::text = v_team.leader_id
    and regexp_replace(upper(coalesce(r.team_code, '')), '[^A-Z0-9]', '', 'g') = v_norm
  order by r.created_at desc limit 1;
  if coalesce(v_event.fee, 0) = 0 then
    v_payment_status := 'not_applicable';
  elsif found then
    v_payment_status := coalesce(v_leader_registration.payment_status, 'payment_required');
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'TEAM_MEMBERSHIP_JOINED', 'team', v_team.id::text,
    jsonb_build_object('team_code', v_team.team_code, 'event_id', v_event.id, 'payment_status', v_payment_status));

  return jsonb_build_object(
    'success', true,
    'alreadyMember', false,
    'isLeaderPaid', v_payment_status in ('verified', 'verification_pending', 'not_applicable'),
    'leaderPaymentStatus', v_payment_status,
    'team', jsonb_build_object(
      'id', v_team.id, 'teamCode', v_team.team_code, 'teamName', v_team.team_name,
      'eventId', v_team.event_id, 'eventTitle', v_team.event_title,
      'registrationId', '', 'leaderName', v_team.leader_name, 'leaderRoll', '',
      'leaderEmail', '', 'leaderPhone', '', 'leaderCollege', '',
      'members', '[]'::jsonb, 'memberCount', jsonb_array_length(v_team.members),
      'totalMemberCount', jsonb_array_length(v_team.members) + 1,
      'maxTeamSize', v_team.max_team_size, 'minTeamSize', v_team.min_team_size,
      'paymentStatus', v_payment_status, 'createdAt', v_team.created_at,
      'updatedAt', v_team.updated_at, 'isCurrentUserLeader', false,
      'isCurrentUserMember', true
    )
  );
end;
$$;

create or replace function public.join_team_membership(p_code text, p_member jsonb)
returns jsonb
language sql security invoker
set search_path = pg_catalog
as $$ select private.join_team_membership(p_code, p_member); $$;

revoke all on function private.join_team_membership(text, jsonb) from public, anon;
grant execute on function private.join_team_membership(text, jsonb) to authenticated;
revoke all on function public.join_team_membership(text, jsonb) from public, anon;
grant execute on function public.join_team_membership(text, jsonb) to authenticated;

-- Once the leader registration is created, issue the member registrations and
-- tickets in the same transaction. Joining alone never creates these rows.
create or replace function private.expand_team_registration()
returns trigger
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_team public.teams%rowtype;
  v_event public.events%rowtype;
  v_member jsonb;
  v_member_roll text;
  v_member_email text;
  v_member_profile uuid;
  v_member_registration_id uuid;
  v_member_display_id text;
  v_member_qr_token text;
  v_new_member_count integer := 0;
begin
  if new.team_code is null or new.user_id is null or new.format = 'individual' then return new; end if;

  select * into v_team from public.teams t
  where t.event_id = new.event_id::text
    and regexp_replace(upper(t.team_code), '[^A-Z0-9]', '', 'g') = regexp_replace(upper(new.team_code), '[^A-Z0-9]', '', 'g')
    and t.leader_id = new.user_id::text
  for update;
  if not found then return new; end if;

  select * into v_event from public.events e where e.id = new.event_id for update;
  for v_member in select value from jsonb_array_elements(case when jsonb_typeof(v_team.members) = 'array' then v_team.members else '[]'::jsonb end) loop
    v_member_roll := nullif(upper(trim(coalesce(v_member->>'rollNumber', v_member->>'roll_number', ''))), '');
    v_member_email := nullif(lower(trim(coalesce(v_member->>'email', ''))), '');
    if v_member_roll is null then continue; end if;

    if not exists (
      select 1 from public.registrations r
      where r.event_id = new.event_id
        and regexp_replace(upper(coalesce(r.team_code, '')), '[^A-Z0-9]', '', 'g') = regexp_replace(upper(new.team_code), '[^A-Z0-9]', '', 'g')
        and upper(coalesce(r.leader_roll, '')) = v_member_roll
        and r.payment_status <> 'rejected'
    ) then
      v_new_member_count := v_new_member_count + 1;
    end if;
  end loop;

  if coalesce(v_event.registered_count, 0) + v_new_member_count > coalesce(v_event.capacity, 0) then
    raise exception 'The event does not have enough remaining capacity for the full team.';
  end if;

  for v_member in select value from jsonb_array_elements(case when jsonb_typeof(v_team.members) = 'array' then v_team.members else '[]'::jsonb end) loop
    v_member_roll := nullif(upper(trim(coalesce(v_member->>'rollNumber', v_member->>'roll_number', ''))), '');
    v_member_email := nullif(lower(trim(coalesce(v_member->>'email', ''))), '');
    if v_member_roll is null then continue; end if;

    select id into v_member_profile from public.profiles p
    where upper(coalesce(p.roll_number, '')) = v_member_roll
       or lower(coalesce(p.email, '')) = v_member_email
    limit 1;

    select id into v_member_registration_id from public.registrations r
    where r.event_id = new.event_id
      and regexp_replace(upper(coalesce(r.team_code, '')), '[^A-Z0-9]', '', 'g') = regexp_replace(upper(new.team_code), '[^A-Z0-9]', '', 'g')
      and upper(coalesce(r.leader_roll, '')) = v_member_roll
      and r.payment_status <> 'rejected'
    limit 1;

    if v_member_registration_id is null then
      v_member_display_id := public.generate_display_id();
      v_member_qr_token := public.generate_qr_token(v_member_display_id);
      insert into public.registrations (
        display_id, user_id, buyer_roll, event_id, event_title,
        leader_name, leader_email, leader_phone, leader_college, leader_roll,
        format, fee, source, payment_status, transaction_id,
        team_name, team_code, department_code, checked_in
      ) values (
        v_member_display_id, v_member_profile, v_member_roll, new.event_id, v_event.title,
        trim(coalesce(v_member->>'name', 'Participant')),
        lower(trim(coalesce(v_member->>'email', ''))),
        trim(coalesce(v_member->>'phone', '')),
        trim(coalesce(v_member->>'college', '')),
        v_member_roll, new.format, 0, 'online', new.payment_status,
        new.transaction_id, new.team_name, new.team_code, v_event.department_code, false
      ) returning id into v_member_registration_id;
      insert into public.tickets (registration_id, qr_token) values (v_member_registration_id, v_member_qr_token);
      insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
      values (new.user_id, 'TEAM_MEMBER_REGISTRATION_CREATED', 'registration', v_member_registration_id::text,
        jsonb_build_object('team_code', new.team_code, 'event_id', new.event_id));
    else
      update public.registrations
      set payment_status = new.payment_status,
          transaction_id = new.transaction_id,
          updated_at = now()
      where id = v_member_registration_id;
    end if;
  end loop;

  if v_new_member_count > 0 then
    update public.events
    set registered_count = coalesce(registered_count, 0) + v_new_member_count,
        status = case when coalesce(registered_count, 0) + v_new_member_count >= capacity then 'full' else status end,
        updated_at = now()
    where id = new.event_id;
  end if;

  return new;
end;
$$;

drop trigger if exists expand_team_registration on public.registrations;
create trigger expand_team_registration
  after insert on public.registrations
  for each row execute function private.expand_team_registration();

revoke all on function private.expand_team_registration() from public, anon;
grant execute on function private.expand_team_registration() to authenticated;

-- Keep member pass states synchronized when finance reviews the leader's
-- payment. This never copies private payment proof into member records.
create or replace function private.sync_team_payment_status()
returns trigger
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_team public.teams%rowtype;
begin
  if new.team_code is null or new.user_id is null or new.payment_status = old.payment_status then return new; end if;

  select * into v_team from public.teams t
  where t.event_id = new.event_id::text
    and regexp_replace(upper(t.team_code), '[^A-Z0-9]', '', 'g') = regexp_replace(upper(new.team_code), '[^A-Z0-9]', '', 'g')
    and t.leader_id = new.user_id::text
  limit 1;
  if not found then return new; end if;

  update public.registrations
  set payment_status = new.payment_status,
      verified_by = new.verified_by,
      verified_at = new.verified_at,
      rejection_reason = new.rejection_reason,
      updated_at = now()
  where event_id = new.event_id
    and id <> new.id
    and regexp_replace(upper(coalesce(team_code, '')), '[^A-Z0-9]', '', 'g') = regexp_replace(upper(new.team_code), '[^A-Z0-9]', '', 'g');

  return new;
end;
$$;

drop trigger if exists sync_team_payment_status on public.registrations;
create trigger sync_team_payment_status
  after update of payment_status on public.registrations
  for each row execute function private.sync_team_payment_status();

revoke all on function private.sync_team_payment_status() from public, anon;
grant execute on function private.sync_team_payment_status() to authenticated;

-- Also support the leader's optional manually entered roster. These members
-- are converted into official participant registrations only after the leader
-- registration exists, never when the roster is merely typed into the form.
create or replace function private.expand_registration_member()
returns trigger
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_parent public.registrations%rowtype;
  v_team public.teams%rowtype;
  v_event public.events%rowtype;
  v_profile uuid;
  v_existing uuid;
  v_display_id text;
  v_qr_token text;
begin
  select * into v_parent from public.registrations r where r.id = new.registration_id;
  if not found or v_parent.team_code is null or v_parent.user_id is null then return new; end if;

  select * into v_team from public.teams t
  where t.event_id = v_parent.event_id::text
    and regexp_replace(upper(t.team_code), '[^A-Z0-9]', '', 'g') = regexp_replace(upper(v_parent.team_code), '[^A-Z0-9]', '', 'g')
    and t.leader_id = v_parent.user_id::text
  limit 1;
  if not found then return new; end if;

  select * into v_event from public.events e where e.id = v_parent.event_id for update;
  select id into v_existing from public.registrations r
  where r.event_id = v_parent.event_id
    and regexp_replace(upper(coalesce(r.team_code, '')), '[^A-Z0-9]', '', 'g') = regexp_replace(upper(v_parent.team_code), '[^A-Z0-9]', '', 'g')
    and upper(coalesce(r.leader_roll, '')) = upper(new.roll_number)
    and r.payment_status <> 'rejected'
  limit 1;
  if v_existing is not null then return new; end if;

  if coalesce(v_event.registered_count, 0) >= coalesce(v_event.capacity, 0) then
    raise exception 'The event does not have capacity for the complete team.';
  end if;

  select id into v_profile from public.profiles p
  where upper(coalesce(p.roll_number, '')) = upper(new.roll_number)
     or lower(coalesce(p.email, '')) = lower(coalesce(new.email, ''))
  limit 1;

  v_display_id := public.generate_display_id();
  v_qr_token := public.generate_qr_token(v_display_id);
  insert into public.registrations (
    display_id, user_id, buyer_roll, event_id, event_title,
    leader_name, leader_email, leader_phone, leader_college, leader_roll,
    format, fee, source, payment_status, transaction_id,
    team_name, team_code, department_code, checked_in
  ) values (
    v_display_id, v_profile, new.roll_number, v_parent.event_id, v_event.title,
    new.name, lower(new.email), new.phone, new.college, upper(new.roll_number),
    v_parent.format, 0, 'online', v_parent.payment_status, v_parent.transaction_id,
    v_parent.team_name, v_parent.team_code, v_event.department_code, false
  ) returning id into v_existing;
  insert into public.tickets (registration_id, qr_token) values (v_existing, v_qr_token);
  update public.events
  set registered_count = coalesce(registered_count, 0) + 1,
      status = case when coalesce(registered_count, 0) + 1 >= capacity then 'full' else status end,
      updated_at = now()
  where id = v_parent.event_id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (v_parent.user_id, 'TEAM_MEMBER_REGISTRATION_CREATED', 'registration', v_existing::text,
    jsonb_build_object('team_code', v_parent.team_code, 'event_id', v_parent.event_id));
  return new;
end;
$$;

drop trigger if exists expand_registration_member on public.registration_members;
create trigger expand_registration_member
  after insert on public.registration_members
  for each row execute function private.expand_registration_member();

revoke all on function private.expand_registration_member() from public, anon;
grant execute on function private.expand_registration_member() to authenticated;
