-- Event coordinators are operations-only accounts.
-- They can inspect and operate the events assigned to them, including gate
-- check-in, but they cannot create/edit events, review payments, or manage staff.

create or replace function private.can_manage_event(p_event_id uuid, p_department_code text)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.current_is_global_admin()
    or private.can_manage_department(p_department_code);
$$;

create or replace function private.can_operate_event(p_event_id uuid, p_department_code text)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.current_is_global_admin()
    or private.can_manage_department(p_department_code)
    or exists (
      select 1
      from public.admin_roles r
      join public.admin_event_assignments a on a.admin_user_id = r.user_id
      where r.user_id = (select auth.uid())
        and r.active
        and r.role in ('event_coordinator', 'faculty_coord', 'student_coord')
        and a.event_id = p_event_id
        and upper(coalesce(r.department_code, '')) = upper(coalesce(p_department_code, ''))
    );
$$;

create or replace function private.can_view_registration(p_registration_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select exists (
    select 1
    from public.registrations r
    join public.events e on e.id = r.event_id
    where r.id = p_registration_id
      and (
        r.user_id = (select auth.uid())
        or private.current_is_global_admin()
        or private.can_review_department(e.department_code)
        or private.can_operate_event(e.id, e.department_code)
      )
  );
$$;

create or replace function private.can_check_in_event(p_event_id uuid)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.current_is_global_admin()
    or exists (
      select 1
      from public.admin_roles r
      join public.admin_event_assignments a on a.admin_user_id = r.user_id
      join public.events e on e.id = a.event_id
      where r.user_id = (select auth.uid())
        and r.active
        and r.role in ('volunteer_checkin', 'checkin_staff')
        and e.id = p_event_id
        and (r.department_code is null or upper(r.department_code) = upper(e.department_code))
    )
    or exists (
      select 1
      from public.events e
      where e.id = p_event_id
        and private.can_operate_event(e.id, e.department_code)
    );
$$;

revoke all on function private.can_operate_event(uuid, text) from public, anon;
grant execute on function private.can_operate_event(uuid, text) to authenticated;

-- Assigned event coordinators may read their assigned event even when its
-- public approval state is not yet published. They still cannot mutate it.
drop policy if exists events_admin_read on public.events;
create policy events_admin_read on public.events
  for select to authenticated
  using (private.can_operate_event(id, department_code));

