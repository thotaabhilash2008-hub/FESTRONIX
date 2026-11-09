-- Department-scoped operational staff permissions.
-- Central finance/gate accounts with a NULL department remain fest-wide;
-- department-created accounts are limited to their own department/events.

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
        or private.can_manage_event(e.id, e.department_code)
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
        and (r.department_code is null or r.department_code = e.department_code)
    )
    or exists (
      select 1
      from public.events e
      where e.id = p_event_id
        and private.can_manage_event(e.id, e.department_code)
    );
$$;

drop policy if exists registrations_update_scoped on public.registrations;
create policy registrations_update_scoped on public.registrations
  for update to authenticated
  using (
    private.current_is_global_admin()
    or exists (
      select 1 from public.events e
      where e.id = registrations.event_id
        and (private.can_review_department(e.department_code) or private.can_manage_event(e.id, e.department_code))
    )
  )
  with check (
    private.current_is_global_admin()
    or exists (
      select 1 from public.events e
      where e.id = registrations.event_id
        and (private.can_review_department(e.department_code) or private.can_manage_event(e.id, e.department_code))
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
        and (private.can_review_department(e.department_code) or private.can_manage_event(e.id, e.department_code))
    )
  )
  with check (
    private.current_is_global_admin()
    or exists (
      select 1
      from public.registrations r
      join public.events e on e.id = r.event_id
      where r.id = registration_id
        and (private.can_review_department(e.department_code) or private.can_manage_event(e.id, e.department_code))
    )
  );

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
  v_reviewer text;
  v_reason text := case when p_status = 'rejected' then nullif(trim(coalesce(p_rejection_reason, '')), '') else null end;
begin
  if auth.uid() is null then raise exception 'Sign in before reviewing payments.'; end if;
  if p_status not in ('verified', 'rejected', 'verification_pending', 'payment_required', 'not_applicable') then raise exception 'Unsupported payment status.'; end if;
  select r.* into v_reg
    from public.registrations r
    where r.display_id = p_display_id for update;
  if not found then raise exception 'Registration not found.'; end if;
  select e.department_code into v_event_department
    from public.events e
    where e.id = v_reg.event_id;
  if not private.current_is_global_admin()
    and not private.can_review_department(v_event_department)
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

revoke all on function private.can_review_department(text) from public, anon;
grant execute on function private.can_review_department(text) to authenticated;
grant execute on function private.can_view_registration(uuid) to authenticated;
grant execute on function private.can_check_in_event(uuid) to authenticated;

