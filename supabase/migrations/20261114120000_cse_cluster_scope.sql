-- CSE cluster isolation
--
-- CSE is one department in the academic hierarchy, but its three operational
-- clusters are separate workspaces.  This migration makes that boundary part
-- of the authorization model so a portal cannot read or mutate another
-- cluster's events, registrations, payments, or attendance.

begin;

alter table public.admin_roles add column if not exists cluster_code text;
alter table public.events add column if not exists cluster_code text;

alter table public.admin_roles drop constraint if exists admin_roles_cluster_code_check;
alter table public.admin_roles add constraint admin_roles_cluster_code_check
  check (cluster_code is null or cluster_code in ('CSE-1', 'CSE-2', 'CSE-3'));

alter table public.events drop constraint if exists events_cluster_code_check;
alter table public.events add constraint events_cluster_code_check
  check (cluster_code is null or cluster_code in ('CSE-1', 'CSE-2', 'CSE-3'));

-- Backfill the three known CSE cluster coordinators.
update public.admin_roles
set cluster_code = 'CSE-1',
    access_boundary = 'CSE 1 cluster events'
where lower(coalesce(username, '')) in ('varma', 'varma_cse')
   or lower(coalesce(email, '')) = 'varma@vardhaman.org';

update public.admin_roles
set cluster_code = 'CSE-2',
    access_boundary = 'CSE 2 cluster events'
where lower(coalesce(username, '')) in ('balu', 'balu_cse')
   or lower(coalesce(email, '')) = 'balu1681@vardhaman.org';

update public.admin_roles
set cluster_code = 'CSE-3',
    access_boundary = 'CSE 3 cluster events'
where lower(coalesce(username, '')) in ('raghavendra', 'raghavendra_cse')
   or lower(coalesce(email, '')) = 'raghavendra1797@vardhaman.org';

-- Preserve existing event assignments when this boundary is introduced.  An
-- event is auto-associated only when every active cluster-scoped assignee
-- agrees on the same cluster.  Ambiguous or previously unassigned events are
-- intentionally left NULL for a global administrator to classify explicitly.
with eligible_events as (
  select e.id, min(r.cluster_code) as cluster_code
  from public.events e
  join public.admin_event_assignments a on a.event_id = e.id
  join public.admin_roles r on r.user_id = a.admin_user_id
  where upper(e.department_code) = 'CSE'
    and e.cluster_code is null
    and e.is_deleted = false
    and r.active
    and r.cluster_code is not null
  group by e.id
  having count(distinct r.cluster_code) = 1
)
update public.events e
set cluster_code = eligible_events.cluster_code
from eligible_events
where e.id = eligible_events.id;

create index if not exists admin_roles_department_cluster_idx
  on public.admin_roles (department_code, cluster_code, role)
  where active = true;

create index if not exists events_department_cluster_idx
  on public.events (department_code, cluster_code)
  where is_deleted = false;

-- A department coordinator can manage only its exact cluster.  A NULL
-- cluster is a deliberate unassigned/general scope and never matches a
-- cluster coordinator.
create or replace function private.can_manage_cluster(
  p_department_code text,
  p_cluster_code text default null
)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.current_is_global_admin()
    or exists (
      select 1
      from public.admin_roles r
      where r.user_id = (select auth.uid())
        and r.active
        and r.role in ('dept_chief_coordinator', 'dept_coordinator')
        and upper(coalesce(r.department_code, '')) = upper(coalesce(p_department_code, ''))
        and upper(coalesce(r.cluster_code, '')) = upper(coalesce(p_cluster_code, ''))
    );
$$;

create or replace function private.can_review_department(p_department_code text)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.current_is_global_admin()
    or exists (
      select 1
      from public.admin_roles r
      where r.user_id = (select auth.uid())
        and r.active
        and r.role = 'finance_reviewer'
        and (r.department_code is null or upper(r.department_code) = upper(p_department_code))
        and r.cluster_code is null
    );
$$;

create or replace function private.can_review_event(
  p_event_id uuid,
  p_department_code text
)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.current_is_global_admin()
    or exists (
      select 1
      from public.admin_roles r
      join public.events e on e.id = p_event_id
      where r.user_id = (select auth.uid())
        and r.active
        and r.role = 'finance_reviewer'
        and (r.department_code is null or upper(r.department_code) = upper(p_department_code))
        and (r.cluster_code is null or upper(r.cluster_code) = upper(e.cluster_code))
    );
$$;

-- Payment review uses the event's cluster, not only its department.  This is
-- important for the public review_registration_payment RPC because the RPC is
-- security-definer and therefore must enforce the same boundary itself.
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
  v_event_department text;
  v_event_id uuid;
  v_reviewer text;
  v_reason text := case when p_status = 'rejected' then nullif(trim(coalesce(p_rejection_reason, '')), '') else null end;
begin
  if auth.uid() is null then raise exception 'Sign in before reviewing payments.'; end if;
  if p_status not in ('verified', 'rejected', 'verification_pending', 'payment_required', 'not_applicable') then raise exception 'Unsupported payment status.'; end if;

  select r.* into v_reg
    from public.registrations r
    where r.display_id = p_display_id
    for update;
  if not found then raise exception 'Registration not found.'; end if;

  select e.id, e.department_code into v_event_id, v_event_department
    from public.events e
    where e.id = v_reg.event_id;
  if not private.current_is_global_admin()
    and not private.can_review_event(v_event_id, v_event_department)
    and not private.can_manage_event(v_event_id, v_event_department) then
    raise exception 'You are not authorized to review this registration.';
  end if;

  select r.full_name into v_reviewer
    from public.admin_roles r
    where r.user_id = auth.uid() and r.active
    limit 1;
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
  where event_id = v_reg.event_id
    and v_reg.team_code is not null
    and upper(coalesce(team_code, '')) = upper(v_reg.team_code)
    and id <> v_reg.id
    and fee = 0
    and source = 'online';

  update public.payment_proofs set
    status = case when p_status = 'verified' then 'verified' when p_status = 'rejected' then 'rejected' else 'pending' end,
    reviewed_by = auth.uid(),
    reviewer_name = v_reviewer,
    rejection_reason = v_reason,
    reviewed_at = case when p_status in ('verified', 'rejected') then now() else null end
  where registration_id = v_reg.id;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (auth.uid(), 'PAYMENT_' || upper(p_status), 'registration', v_reg.id::text,
    jsonb_build_object('display_id', v_reg.display_id, 'status', p_status, 'reason', v_reason));

  return jsonb_build_object(
    'success', true,
    'displayId', v_reg.display_id,
    'status', p_status,
    'verifiedBy', v_reviewer,
    'verifiedAt', now()
  );
end;
$$;

revoke all on function private.review_registration_payment(text, text, text) from public, anon;
grant execute on function private.review_registration_payment(text, text, text) to authenticated;

create or replace function private.can_manage_event(p_event_id uuid, p_department_code text)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.current_is_global_admin()
    or exists (
      select 1
      from public.events e
      where e.id = p_event_id
        and upper(e.department_code) = upper(p_department_code)
        and private.can_manage_cluster(e.department_code, e.cluster_code)
    );
$$;

create or replace function private.can_operate_event(p_event_id uuid, p_department_code text)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.can_manage_event(p_event_id, p_department_code)
    or exists (
      select 1
      from public.admin_roles r
      join public.admin_event_assignments a on a.admin_user_id = r.user_id
      join public.events e on e.id = a.event_id
      where r.user_id = (select auth.uid())
        and r.active
        and r.role in ('event_coordinator', 'faculty_coord', 'student_coord')
        and e.id = p_event_id
        and upper(e.department_code) = upper(p_department_code)
        and (r.cluster_code is null or upper(r.cluster_code) = upper(e.cluster_code))
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
        or private.can_review_event(e.id, e.department_code)
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
    or private.can_operate_event(p_event_id, (select e.department_code from public.events e where e.id = p_event_id))
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
        and (r.cluster_code is null or upper(r.cluster_code) = upper(e.cluster_code))
    );
$$;

revoke all on function private.can_manage_cluster(text, text) from public, anon;
revoke all on function private.can_review_event(uuid, text) from public, anon;
grant execute on function private.can_manage_cluster(text, text) to authenticated;
grant execute on function private.can_review_event(uuid, text) to authenticated;

-- Public visitors are anonymous.  Authenticated staff must use the scoped
-- admin/finance policies below instead of inheriting the public event list.
drop policy if exists events_public_read on public.events;
create policy events_public_read on public.events
  for select to anon
  using (is_deleted = false and approval_status = 'approved');

drop policy if exists events_admin_read on public.events;
create policy events_admin_read on public.events
  for select to authenticated
  using (private.can_operate_event(id, department_code));

drop policy if exists events_finance_read on public.events;
create policy events_finance_read on public.events
  for select to authenticated
  using (private.can_review_event(id, department_code));

drop policy if exists events_insert_department_or_global on public.events;
create policy events_insert_department_or_global on public.events
  for insert to authenticated
  with check (
    not is_deleted and (
      private.current_is_global_admin()
      or (private.can_manage_cluster(department_code, cluster_code)
          and status = 'pending_approval'
          and approval_status = 'pending')
    )
  );

drop policy if exists registrations_update_scoped on public.registrations;
create policy registrations_update_scoped on public.registrations
  for update to authenticated
  using (
    private.current_is_global_admin()
    or exists (
      select 1 from public.events e
      where e.id = registrations.event_id
        and (private.can_review_event(e.id, e.department_code) or private.can_manage_event(e.id, e.department_code))
    )
  )
  with check (
    private.current_is_global_admin()
    or exists (
      select 1 from public.events e
      where e.id = registrations.event_id
        and (private.can_review_event(e.id, e.department_code) or private.can_manage_event(e.id, e.department_code))
    )
  );

drop policy if exists payment_proofs_update_reviewers on public.payment_proofs;
create policy payment_proofs_update_reviewers on public.payment_proofs
  for update to authenticated
  using (
    private.current_is_global_admin()
    or exists (
      select 1
      from public.registrations r
      join public.events e on e.id = r.event_id
      where r.id = registration_id
        and (private.can_review_event(e.id, e.department_code) or private.can_manage_event(e.id, e.department_code))
    )
  )
  with check (
    private.current_is_global_admin()
    or exists (
      select 1
      from public.registrations r
      join public.events e on e.id = r.event_id
      where r.id = registration_id
        and (private.can_review_event(e.id, e.department_code) or private.can_manage_event(e.id, e.department_code))
    )
  );

-- Cluster coordinators may only submit/update events inside their cluster.
create or replace function private.guard_event_admin_fields()
returns trigger
language plpgsql security definer
set search_path = pg_catalog
as $$
begin
  if private.current_is_global_admin() then
    return new;
  end if;

  if not private.can_manage_cluster(new.department_code, new.cluster_code) then
    raise exception 'This event is outside your department cluster scope.';
  end if;

  if tg_op = 'INSERT' then
    if new.status <> 'pending_approval' or new.approval_status <> 'pending' then
      raise exception 'Department events must be submitted for central approval.';
    end if;
    return new;
  end if;

  if new.approval_status is distinct from old.approval_status
    or new.is_deleted is distinct from old.is_deleted
    or new.deleted_at is distinct from old.deleted_at
    or new.deleted_by is distinct from old.deleted_by then
    raise exception 'Only central administrators can approve or delete events.';
  end if;
  if old.approval_status <> 'approved' and new.status <> 'pending_approval' then
    raise exception 'This event must be approved before it can be opened or closed.';
  end if;
  if new.status = 'pending_approval' and new.approval_status <> 'pending' then
    raise exception 'An approved or rejected event cannot be resubmitted by a department account.';
  end if;
  return new;
end;
$$;

-- Existing column-level grants are additive in PostgreSQL; explicitly grant
-- the new field so department event creation/editing continues to work.
grant insert (cluster_code) on table public.events to authenticated;
grant update (cluster_code) on table public.events to authenticated;

commit;
