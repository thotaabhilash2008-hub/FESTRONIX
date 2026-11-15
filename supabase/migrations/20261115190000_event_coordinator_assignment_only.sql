-- Event coordinators operate on explicit event assignments only. Their
-- department and CSE cluster metadata must not expand or restrict the event
-- assignment boundary.
begin;

create or replace function private.can_operate_event(p_event_id uuid, p_department_code text)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog
as $$
  select private.can_manage_event(p_event_id, p_department_code)
    or exists (
      select 1
      from public.admin_roles r
      join public.admin_event_assignments a on a.admin_user_id = r.user_id
      where r.user_id = (select auth.uid())
        and r.active
        and r.role in ('event_coordinator', 'faculty_coord', 'student_coord')
        and a.event_id = p_event_id
    )
    or exists (
      select 1
      from public.admin_roles r
      join public.admin_event_assignments a on a.admin_user_id = r.user_id
      join public.events e on e.id = a.event_id
      where r.user_id = (select auth.uid())
        and r.active
        and r.role in ('volunteer_checkin', 'checkin_staff')
        and e.id = p_event_id
        and upper(e.department_code) = upper(p_department_code)
        and (r.cluster_code is null or upper(r.cluster_code) = upper(e.cluster_code))
    );
$$;

revoke all on function private.can_operate_event(uuid, text) from public, anon;
grant execute on function private.can_operate_event(uuid, text) to authenticated;

commit;
