-- Close the legacy anonymous team-data surface and constrain team RPCs to the
-- signed-in leader/member. The browser can only read its own or assigned teams.
begin;

alter table public.teams
  add column if not exists updated_at timestamptz not null default now();

do $$
declare
  v_policy record;
begin
  for v_policy in
    select policyname
    from pg_policies
    where schemaname = 'public' and tablename = 'teams'
  loop
    execute format('drop policy if exists %I on public.teams', v_policy.policyname);
  end loop;
end;
$$;

alter table public.teams enable row level security;
revoke all on table public.teams from public, anon, authenticated;
grant select on table public.teams to authenticated;

create policy teams_read_owner_or_event_admin on public.teams
  for select to authenticated
  using (
    leader_id = (select auth.uid())::text
    or private.current_is_global_admin()
    or exists (
      select 1 from public.events e
      where (e.id::text = teams.event_id or e.slug = teams.event_id)
        and private.can_manage_event(e.id, e.department_code)
    )
  );

create or replace function private.link_team_registration()
returns trigger
language plpgsql security definer
set search_path = pg_catalog
as $$
begin
  if new.team_code is not null and new.user_id is not null then
    update public.teams set
      registration_id = new.display_id,
      team_name = coalesce(nullif(trim(new.team_name), ''), team_name),
      updated_at = now()
    where event_id = new.event_id::text
      and upper(team_code) = upper(new.team_code)
      and leader_id = new.user_id::text;
  end if;
  return new;
end;
$$;

drop trigger if exists link_team_registration on public.registrations;
create trigger link_team_registration
  after insert on public.registrations
  for each row execute function private.link_team_registration();
revoke all on function private.link_team_registration() from public, anon;
grant execute on function private.link_team_registration() to authenticated;

create index if not exists admin_event_assignments_granted_by_idx
  on public.admin_event_assignments (granted_by);
create index if not exists admin_roles_granted_by_idx
  on public.admin_roles (granted_by);
create index if not exists admin_roles_event_id_idx
  on public.admin_roles (event_id);
create index if not exists announcements_department_code_idx
  on public.announcements (department_code);

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
  v_profile public.profiles%rowtype;
  v_event public.events%rowtype;
  v_team public.teams%rowtype;
  v_existing public.teams%rowtype;
  v_code text := upper(trim(coalesce(p_team_code, '')));
  v_norm text;
begin
  if auth.uid() is null then raise exception 'Sign in before creating a team.'; end if;
  if p_leader_id is null or p_leader_id <> auth.uid()::text then
    raise exception 'The team leader must be the signed-in account.';
  end if;
  if v_code !~ '^[A-Z0-9][A-Z0-9-]{3,31}$' then raise exception 'Enter a valid team code.'; end if;
  if nullif(trim(coalesce(p_team_name, '')), '') is null or length(trim(p_team_name)) > 100 then
    raise exception 'Enter a team name of 100 characters or fewer.';
  end if;

  select * into v_profile from public.profiles where id = auth.uid();
  if not found then raise exception 'Complete your account profile before creating a team.'; end if;
  if nullif(trim(v_profile.roll_number), '') is null or nullif(trim(v_profile.email), '') is null then
    raise exception 'Your account needs an email and roll number before creating a team.';
  end if;

  select * into v_event from public.events e
  where (e.id::text = p_event_id or e.slug = p_event_id)
    and not e.is_deleted and e.approval_status = 'approved'
    and e.status in ('open', 'upcoming');
  if not found then raise exception 'The selected event is unavailable for team registration.'; end if;
  if v_event.format = 'individual' then raise exception 'This event does not accept teams.'; end if;
  if p_max_team_size is distinct from v_event.max_team_size
    or p_min_team_size is distinct from v_event.min_team_size then
    raise exception 'Team size does not match the event rules.';
  end if;

  v_norm := regexp_replace(v_code, '[^A-Z0-9]', '', 'g');
  select * into v_existing from public.teams t
  where regexp_replace(upper(t.team_code), '[^A-Z0-9]', '', 'g') = v_norm
  for update;
  if found and (v_existing.leader_id is distinct from auth.uid()::text
      or v_existing.event_id is distinct from v_event.id::text) then
    raise exception 'That team code is already in use.';
  end if;

  insert into public.teams (
    id, team_code, team_name, event_id, event_title, registration_id,
    leader_id, leader_name, leader_roll, leader_email, leader_phone,
    leader_college, members, max_team_size, min_team_size, updated_at
  ) values (
    'TEAM-' || replace(gen_random_uuid()::text, '-', ''), v_code, trim(p_team_name),
    v_event.id::text, v_event.title, coalesce(v_existing.registration_id, ''),
    auth.uid()::text, v_profile.full_name, v_profile.roll_number, v_profile.email,
    coalesce(v_profile.phone, ''), v_profile.college,
    coalesce(v_existing.members, '[]'::jsonb), v_event.max_team_size,
    v_event.min_team_size, now()
  )
  on conflict (team_code) do update set
    team_name = excluded.team_name,
    event_id = excluded.event_id,
    event_title = excluded.event_title,
    leader_name = excluded.leader_name,
    leader_roll = excluded.leader_roll,
    leader_email = excluded.leader_email,
    leader_phone = excluded.leader_phone,
    leader_college = excluded.leader_college,
    max_team_size = excluded.max_team_size,
    min_team_size = excluded.min_team_size,
    updated_at = now()
  where public.teams.leader_id = auth.uid()::text
    and public.teams.event_id = v_event.id::text
  returning * into v_team;
  if not found then raise exception 'That team code is already in use.'; end if;

  return jsonb_build_object('success', true, 'team', to_jsonb(v_team));
end;
$$;

create or replace function public.create_or_reserve_team(
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
language sql security invoker
set search_path = pg_catalog
as $$
  select private.create_or_reserve_team(
    p_team_code, p_team_name, p_event_id, p_event_title, p_leader_name,
    p_leader_roll, p_leader_email, p_leader_phone, p_leader_college,
    p_leader_id, p_max_team_size, p_min_team_size
  );
$$;

create or replace function private.find_team_by_code(p_code text)
returns jsonb
language plpgsql security definer
set search_path = pg_catalog
as $$
declare
  v_profile public.profiles%rowtype;
  v_team public.teams%rowtype;
  v_norm text := regexp_replace(upper(coalesce(p_code, '')), '[^A-Z0-9]', '', 'g');
  v_is_leader boolean;
  v_is_member boolean;
  v_can_manage boolean;
  v_full_access boolean;
  v_member_count integer;
begin
  if auth.uid() is null then raise exception 'Sign in before looking up a team.'; end if;
  if v_norm = '' then return jsonb_build_object('success', false, 'error', 'Enter a team code.'); end if;

  select * into v_team from public.teams t
  where regexp_replace(upper(t.team_code), '[^A-Z0-9]', '', 'g') = v_norm
  limit 1;
  if not found then return jsonb_build_object('success', false, 'error', 'Team not found.'); end if;

  select * into v_profile from public.profiles where id = auth.uid();
  v_is_leader := v_team.leader_id = auth.uid()::text;
  v_can_manage := private.current_is_global_admin() or exists (
    select 1 from public.events e
    where (e.id::text = v_team.event_id or e.slug = v_team.event_id)
      and private.can_manage_event(e.id, e.department_code)
  );
  v_is_member := exists (
    select 1 from jsonb_array_elements(
      case when jsonb_typeof(v_team.members) = 'array' then v_team.members else '[]'::jsonb end
    ) m
    where upper(coalesce(m.value->>'rollNumber', m.value->>'roll_number', '')) = upper(coalesce(v_profile.roll_number, ''))
      or lower(coalesce(m.value->>'email', '')) = lower(coalesce(v_profile.email, ''))
  );
  v_full_access := v_is_leader or v_can_manage;
  v_member_count := coalesce(jsonb_array_length(case when jsonb_typeof(v_team.members) = 'array' then v_team.members else '[]'::jsonb end), 0);

  return jsonb_build_object('success', true, 'team', jsonb_build_object(
    'id', v_team.id,
    'teamCode', v_team.team_code,
    'teamName', v_team.team_name,
    'eventId', v_team.event_id,
    'eventTitle', v_team.event_title,
    'registrationId', case when v_full_access then v_team.registration_id else '' end,
    'leaderId', case when v_full_access then v_team.leader_id else null end,
    'leaderName', v_team.leader_name,
    'leaderRoll', case when v_full_access then v_team.leader_roll else '' end,
    'leaderEmail', case when v_full_access then v_team.leader_email else '' end,
    'leaderPhone', case when v_full_access then v_team.leader_phone else '' end,
    'leaderCollege', case when v_full_access then v_team.leader_college else '' end,
    'members', case when v_full_access then coalesce(v_team.members, '[]'::jsonb) else '[]'::jsonb end,
    'memberCount', v_member_count,
    'isCurrentUserLeader', v_is_leader,
    'isCurrentUserMember', v_is_member,
    'maxTeamSize', v_team.max_team_size,
    'minTeamSize', v_team.min_team_size,
    'createdAt', v_team.created_at
  ));
end;
$$;

create or replace function public.find_team_by_code(p_code text)
returns jsonb
language sql security invoker
set search_path = pg_catalog
as $$ select private.find_team_by_code(p_code); $$;

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
  v_norm text := regexp_replace(upper(coalesce(p_code, '')), '[^A-Z0-9]', '', 'g');
  v_member jsonb;
  v_members jsonb;
  v_is_leader_paid boolean := false;
  v_leader_payment_status text;
  v_leader_transaction_id text;
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

  v_member := jsonb_build_object(
    'name', v_profile.full_name,
    'email', v_profile.email,
    'phone', coalesce(v_profile.phone, ''),
    'college', v_profile.college,
    'rollNumber', v_profile.roll_number
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
    if not exists (
      select 1 from public.registration_members m
      where m.registration_id = v_leader_registration.id
        and upper(coalesce(m.roll_number, '')) = upper(v_profile.roll_number)
    ) then
      insert into public.registration_members (registration_id, name, email, phone, college, roll_number)
      values (v_leader_registration.id, v_profile.full_name, v_profile.email, coalesce(v_profile.phone, ''), v_profile.college, v_profile.roll_number);
    end if;
  end if;

  return jsonb_build_object(
    'success', true,
    'isLeaderPaid', v_is_leader_paid,
    'leaderPaymentStatus', v_leader_payment_status,
    'leaderTransactionId', v_leader_transaction_id,
    'team', jsonb_build_object(
      'id', v_team.id, 'teamCode', v_team.team_code, 'teamName', v_team.team_name,
      'eventId', v_team.event_id, 'eventTitle', v_team.event_title,
      'registrationId', '', 'leaderName', v_team.leader_name,
      'leaderRoll', '', 'leaderEmail', '', 'leaderPhone', '', 'leaderCollege', '',
      'members', '[]'::jsonb, 'memberCount', jsonb_array_length(v_members),
      'maxTeamSize', v_team.max_team_size, 'minTeamSize', v_team.min_team_size,
      'createdAt', v_team.created_at, 'isCurrentUserLeader', false, 'isCurrentUserMember', true
    )
  );
end;
$$;

create or replace function public.join_team_by_code(p_code text, p_member jsonb)
returns jsonb
language sql security invoker
set search_path = pg_catalog
as $$ select private.join_team_by_code(p_code, p_member); $$;

revoke all on function private.create_or_reserve_team(text, text, text, text, text, text, text, text, text, text, integer, integer) from public, anon;
grant execute on function private.create_or_reserve_team(text, text, text, text, text, text, text, text, text, text, integer, integer) to authenticated;
revoke all on function public.create_or_reserve_team(text, text, text, text, text, text, text, text, text, text, integer, integer) from public, anon;
grant execute on function public.create_or_reserve_team(text, text, text, text, text, text, text, text, text, text, integer, integer) to authenticated;

revoke all on function private.find_team_by_code(text) from public, anon;
grant execute on function private.find_team_by_code(text) to authenticated;
revoke all on function public.find_team_by_code(text) from public, anon;
grant execute on function public.find_team_by_code(text) to authenticated;

revoke all on function private.join_team_by_code(text, jsonb) from public, anon;
grant execute on function private.join_team_by_code(text, jsonb) to authenticated;
revoke all on function public.join_team_by_code(text, jsonb) from public, anon;
grant execute on function public.join_team_by_code(text, jsonb) to authenticated;

-- The DDL event trigger remains active, but its implementation is not an RPC.
revoke all on function public.rls_auto_enable() from public, anon, authenticated;

alter function public.generate_display_id() set search_path = pg_catalog;
alter function public.generate_qr_token(text) set search_path = pg_catalog;
alter function public.get_user_role(uuid) set search_path = pg_catalog;
alter function public.is_admin(uuid) set search_path = pg_catalog;
alter function public.is_global_admin(uuid) set search_path = pg_catalog;

commit;
