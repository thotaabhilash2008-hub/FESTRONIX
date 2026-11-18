begin;

-- Team dashboards are available to anyone who has an invite code, so their
-- ordinary roster response must continue to omit contact information. The
-- leader can retrieve the complete roster only after proving the stored
-- leader roll, email, and phone in addition to possessing the invite code.
create or replace function private.get_team_checkout_roster(
  p_code text,
  p_leader_roll text,
  p_leader_email text,
  p_leader_phone text,
  p_event_id text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_team public.teams%rowtype;
  v_norm text := regexp_replace(upper(coalesce(p_code, '')), '[^A-Z0-9]', '', 'g');
  v_snapshot jsonb;
  v_members jsonb;
begin
  if v_norm = '' then
    return jsonb_build_object('success', false, 'error', 'Enter a team invite code.');
  end if;

  select t.* into v_team
  from public.teams t
  join public.events e on (e.id::text = t.event_id or e.slug = t.event_id)
  where regexp_replace(upper(t.team_code), '[^A-Z0-9]', '', 'g') = v_norm
    and (nullif(trim(coalesce(p_event_id, '')), '') is null
      or e.id::text = trim(p_event_id)
      or e.slug = trim(p_event_id))
  limit 1;
  if not found then
    return jsonb_build_object('success', false, 'error', 'The team code or leader details did not match.');
  end if;

  if nullif(trim(coalesce(p_leader_roll, '')), '') is null
     or upper(trim(p_leader_roll)) <> upper(coalesce(v_team.leader_roll, ''))
     or nullif(trim(coalesce(p_leader_email, '')), '') is null
     or lower(trim(p_leader_email)) <> lower(coalesce(v_team.leader_email, ''))
     or nullif(trim(coalesce(p_leader_phone, '')), '') is null
     or regexp_replace(coalesce(p_leader_phone, ''), '[^0-9]', '', 'g')
        <> regexp_replace(coalesce(v_team.leader_phone, ''), '[^0-9]', '', 'g') then
    return jsonb_build_object('success', false, 'error', 'The team code or leader details did not match.');
  end if;

  select coalesce(jsonb_agg(
    member.value || jsonb_build_object(
      'email', coalesce(member.value->>'email', ''),
      'phone', coalesce(member.value->>'phone', ''),
      'college', coalesce(member.value->>'college', '')
    ) order by member.ordinality
  ), '[]'::jsonb)
  into v_members
  from jsonb_array_elements(
    case when jsonb_typeof(v_team.members) = 'array' then v_team.members else '[]'::jsonb end
  ) with ordinality as member(value, ordinality);

  v_snapshot := private.team_public_snapshot(v_team);
  return jsonb_build_object(
    'success', true,
    'team', v_snapshot || jsonb_build_object(
      'leaderEmail', v_team.leader_email,
      'leaderPhone', v_team.leader_phone,
      'leaderCollege', v_team.leader_college,
      'members', v_members
    )
  );
end;
$$;

create or replace function public.get_team_checkout_roster(
  p_code text,
  p_leader_roll text,
  p_leader_email text,
  p_leader_phone text,
  p_event_id text
)
returns jsonb
language sql
security definer
set search_path = pg_catalog
as $$
  select private.get_team_checkout_roster(p_code, p_leader_roll, p_leader_email, p_leader_phone, p_event_id);
$$;

revoke all on function private.get_team_checkout_roster(text, text, text, text, text) from public, anon, authenticated;
revoke all on function public.get_team_checkout_roster(text, text, text, text, text) from public;
grant execute on function public.get_team_checkout_roster(text, text, text, text, text) to anon, authenticated, service_role;

-- The payment service is trusted to sync a roster only after it has found the
-- team by code and validated the leader's saved contact details. Use a text
-- leader identity because guest teams have a guest-* identifier, not an auth
-- UUID. Existing UUID-based RPC remains available for older function versions.
create or replace function private.sync_razorpay_team_roster_guest(
  p_event_id uuid,
  p_team_code text,
  p_leader_id text,
  p_leader_roll text,
  p_leader_email text,
  p_members jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_event public.events%rowtype;
  v_team public.teams%rowtype;
  v_member jsonb;
  v_clean_member jsonb;
  v_clean_members jsonb := '[]'::jsonb;
  v_seen_rolls text[] := '{}'::text[];
  v_roll text;
  v_email text;
  v_phone text;
  v_name text;
  v_min_size integer;
  v_max_size integer;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Team roster synchronization is restricted to the payment service.';
  end if;
  if p_event_id is null
     or nullif(trim(coalesce(p_leader_id, '')), '') is null
     or nullif(trim(coalesce(p_team_code, '')), '') is null
     or jsonb_typeof(coalesce(p_members, '[]'::jsonb)) <> 'array' then
    raise exception 'The event, team, leader, and roster are required.';
  end if;

  select * into v_event
  from public.events e
  where e.id = p_event_id and not e.is_deleted
    and e.approval_status = 'approved'
    and e.status in ('open', 'upcoming')
    and (e.deadline is null or now() <= e.deadline)
  for update;
  if not found then raise exception 'The event is no longer accepting registrations.'; end if;
  if v_event.format not in ('duo', 'team') then raise exception 'The event does not accept a team roster.'; end if;

  select * into v_team
  from public.teams t
  where t.event_id = p_event_id::text
    and regexp_replace(upper(t.team_code), '[^A-Z0-9]', '', 'g')
      = regexp_replace(upper(trim(p_team_code)), '[^A-Z0-9]', '', 'g')
  for update;
  if not found then raise exception 'The team reservation was not found for this event.'; end if;
  if v_team.leader_id is distinct from p_leader_id then
    raise exception 'Only the saved team leader can pay for this team.';
  end if;
  if upper(coalesce(v_team.leader_roll, '')) <> upper(trim(coalesce(p_leader_roll, '')))
     or lower(coalesce(v_team.leader_email, '')) <> lower(trim(coalesce(p_leader_email, ''))) then
    raise exception 'The team leader details do not match the saved reservation.';
  end if;
  if v_team.min_team_size is distinct from v_event.min_team_size
     or v_team.max_team_size is distinct from v_event.max_team_size then
    raise exception 'The team reservation no longer matches the event team-size rules.';
  end if;

  -- Keep members who joined using the invite code even if a checkout tab has
  -- stale local state.
  if exists (
    select 1
    from jsonb_array_elements(case when jsonb_typeof(v_team.members) = 'array' then v_team.members else '[]'::jsonb end) saved(value)
    where not exists (
      select 1 from jsonb_array_elements(p_members) submitted(value)
      where upper(trim(coalesce(submitted.value->>'rollNumber', submitted.value->>'roll_number', '')))
        = upper(trim(coalesce(saved.value->>'rollNumber', saved.value->>'roll_number', '')))
    )
  ) then
    raise exception 'The submitted roster omitted a member already joined to this team. Refresh the team and retry.';
  end if;

  for v_member in select value from jsonb_array_elements(p_members) loop
    v_name := nullif(trim(coalesce(v_member->>'name', '')), '');
    v_roll := nullif(upper(trim(coalesce(v_member->>'rollNumber', v_member->>'roll_number', ''))), '');
    v_email := nullif(lower(trim(coalesce(v_member->>'email', ''))), '');
    v_phone := nullif(trim(coalesce(v_member->>'phone', '')), '');
    if v_name is null or v_roll is null or v_phone is null then
      raise exception 'Every teammate needs a name, roll number, and phone number.';
    end if;
    if v_email is not null and v_email !~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$' then
      raise exception 'A teammate email address is invalid.';
    end if;
    if v_roll = upper(trim(coalesce(v_team.leader_roll, ''))) or v_roll = any(v_seen_rolls) then
      raise exception 'Duplicate participant roll numbers are not allowed in a team.';
    end if;
    v_seen_rolls := array_append(v_seen_rolls, v_roll);
    v_clean_member := jsonb_build_object(
      'name', v_name,
      'email', coalesce(v_email, ''),
      'phone', v_phone,
      'college', trim(coalesce(v_member->>'college', '')),
      'rollNumber', v_roll,
      'deptSection', upper(trim(coalesce(v_member->>'deptSection', v_member->>'dept_section', '')))
    );
    v_clean_members := v_clean_members || jsonb_build_array(v_clean_member);
  end loop;

  v_min_size := greatest(1, coalesce(v_event.min_team_size, 1));
  v_max_size := coalesce(v_event.max_team_size, 1);
  if 1 + jsonb_array_length(v_clean_members) < v_min_size then
    raise exception 'This event requires at least % team members.', v_min_size;
  end if;
  if 1 + jsonb_array_length(v_clean_members) > v_max_size then
    raise exception 'This event permits a maximum of % team members.', v_max_size;
  end if;

  update public.teams set members = v_clean_members, updated_at = now() where id = v_team.id;
  return jsonb_build_object('success', true, 'memberCount', jsonb_array_length(v_clean_members));
end;
$$;

create or replace function public.sync_razorpay_team_roster_guest(
  p_event_id uuid,
  p_team_code text,
  p_leader_id text,
  p_leader_roll text,
  p_leader_email text,
  p_members jsonb
)
returns jsonb
language sql
security definer
set search_path = pg_catalog
as $$
  select private.sync_razorpay_team_roster_guest(
    p_event_id, p_team_code, p_leader_id, p_leader_roll, p_leader_email, p_members
  );
$$;

revoke all on function private.sync_razorpay_team_roster_guest(uuid, text, text, text, text, jsonb) from public, anon, authenticated, service_role;
revoke all on function public.sync_razorpay_team_roster_guest(uuid, text, text, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.sync_razorpay_team_roster_guest(uuid, text, text, text, text, jsonb) to service_role;

commit;
