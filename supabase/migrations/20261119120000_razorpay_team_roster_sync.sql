begin;

-- Save manually entered teammates and invite-code members together before a
-- Razorpay team order is created. Finalization uses this roster to issue each
-- participant a registration and ticket atomically with the leader pass.
create or replace function private.sync_razorpay_team_roster(
  p_event_id uuid,
  p_team_code text,
  p_leader_user_id uuid,
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
  if p_event_id is null or p_leader_user_id is null
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
  if v_team.leader_id is distinct from p_leader_user_id::text then
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

  -- Do not let checkout silently remove members who already joined by code.
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

create or replace function public.sync_razorpay_team_roster(
  p_event_id uuid,
  p_team_code text,
  p_leader_user_id uuid,
  p_leader_roll text,
  p_leader_email text,
  p_members jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Team roster synchronization is restricted to the payment service.';
  end if;
  return private.sync_razorpay_team_roster(
    p_event_id, p_team_code, p_leader_user_id, p_leader_roll, p_leader_email, p_members
  );
end;
$$;

revoke all on function private.sync_razorpay_team_roster(uuid, text, uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function private.sync_razorpay_team_roster(uuid, text, uuid, text, text, jsonb) to service_role;
revoke all on function public.sync_razorpay_team_roster(uuid, text, uuid, text, text, jsonb) from public, anon, authenticated;
grant execute on function public.sync_razorpay_team_roster(uuid, text, uuid, text, text, jsonb) to service_role;

commit;
