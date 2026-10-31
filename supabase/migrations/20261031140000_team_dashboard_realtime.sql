-- Privacy-safe live team dashboard for both leaders and joined members.
-- It exposes roster identity and payment state, never payment proof or UTR data.
create or replace function private.get_team_dashboard(p_code text)
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
  v_members jsonb;
  v_roster jsonb;
  v_is_leader boolean := false;
  v_is_member boolean := false;
  v_can_manage boolean := false;
  v_payment_status text := 'payment_required';
  v_leader_registration_status text := 'membership_pending';
  v_leader_qr_generated boolean := false;
  v_member_count integer := 0;
begin
  if auth.uid() is null then raise exception 'Sign in before viewing team status.'; end if;
  if v_norm = '' then return jsonb_build_object('success', false, 'error', 'Enter a team code.'); end if;

  select * into v_team
  from public.teams t
  where regexp_replace(upper(t.team_code), '[^A-Z0-9]', '', 'g') = v_norm
  limit 1;
  if not found then return jsonb_build_object('success', false, 'error', 'Team not found.'); end if;

  select * into v_profile from public.profiles where id = auth.uid();
  v_is_leader := v_team.leader_id = auth.uid()::text;
  v_is_member := exists (
    select 1
    from jsonb_array_elements(case when jsonb_typeof(v_team.members) = 'array' then v_team.members else '[]'::jsonb end) m
    where upper(coalesce(m.value->>'rollNumber', m.value->>'roll_number', '')) = upper(coalesce(v_profile.roll_number, ''))
       or lower(coalesce(m.value->>'email', '')) = lower(coalesce(v_profile.email, ''))
  );
  v_can_manage := private.current_is_global_admin() or exists (
    select 1 from public.events e
    where (e.id::text = v_team.event_id or e.slug = v_team.event_id)
      and private.can_manage_event(e.id, e.department_code)
  );

  if not (v_is_leader or v_is_member or v_can_manage) then
    return jsonb_build_object('success', false, 'error', 'You are not a member of this team.');
  end if;

  v_members := case when jsonb_typeof(v_team.members) = 'array' then v_team.members else '[]'::jsonb end;
  v_member_count := jsonb_array_length(v_members);

  select * into v_event
  from public.events e
  where e.id::text = v_team.event_id or e.slug = v_team.event_id
  limit 1;

  select * into v_leader_registration
  from public.registrations r
  where r.event_id = v_event.id
    and r.user_id::text = v_team.leader_id
    and regexp_replace(upper(coalesce(r.team_code, '')), '[^A-Z0-9]', '', 'g') = v_norm
  order by r.created_at desc
  limit 1;

  if coalesce(v_event.fee, 0) = 0 then
    v_payment_status := 'not_applicable';
  elsif found then
    v_payment_status := coalesce(v_leader_registration.payment_status, 'payment_required');
  end if;

  if v_leader_registration.id is not null then
    v_leader_registration_status := v_leader_registration.payment_status;
    select exists (
      select 1 from public.tickets t
      where t.registration_id = v_leader_registration.id
        and nullif(trim(coalesce(t.qr_token, '')), '') is not null
    ) into v_leader_qr_generated;
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
      and regexp_replace(upper(coalesce(r.team_code, '')), '[^A-Z0-9]', '', 'g') = v_norm
      and upper(coalesce(r.leader_roll, '')) = upper(coalesce(m.value->>'rollNumber', m.value->>'roll_number', ''))
    order by r.created_at desc
    limit 1
  ) member_registration on true;

  return jsonb_build_object(
    'success', true,
    'team', jsonb_build_object(
      'id', v_team.id,
      'teamCode', v_team.team_code,
      'teamName', v_team.team_name,
      'eventId', v_team.event_id,
      'eventTitle', v_team.event_title,
      'registrationId', case when v_is_leader or v_can_manage then v_team.registration_id else '' end,
      'leaderId', case when v_is_leader or v_can_manage then v_team.leader_id else null end,
      'leaderName', v_team.leader_name,
      'leaderRoll', v_team.leader_roll,
      'leaderEmail', case when v_is_leader or v_can_manage then v_team.leader_email else '' end,
      'leaderPhone', case when v_is_leader or v_can_manage then v_team.leader_phone else '' end,
      'leaderCollege', case when v_is_leader or v_can_manage then v_team.leader_college else '' end,
      'members', v_roster,
      'memberCount', v_member_count,
      'totalMemberCount', v_member_count + 1,
      'maxTeamSize', v_team.max_team_size,
      'minTeamSize', v_team.min_team_size,
      'paymentStatus', v_payment_status,
      'leaderRegistrationStatus', v_leader_registration_status,
      'leaderQrGenerated', v_leader_qr_generated,
      'createdAt', v_team.created_at,
      'updatedAt', v_team.updated_at,
      'isCurrentUserLeader', v_is_leader,
      'isCurrentUserMember', v_is_member
    )
  );
end;
$$;

create or replace function public.get_team_dashboard(p_code text)
returns jsonb
language sql security invoker
set search_path = pg_catalog
as $$ select private.get_team_dashboard(p_code); $$;

revoke all on function private.get_team_dashboard(text) from public, anon;
grant execute on function private.get_team_dashboard(text) to authenticated;
revoke all on function public.get_team_dashboard(text) from public, anon;
grant execute on function public.get_team_dashboard(text) to authenticated;
