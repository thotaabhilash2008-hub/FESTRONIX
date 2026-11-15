-- Compatibility guard for department-created events.
-- This is intentionally idempotent so it can be applied after either the
-- original RBAC migration or an older production schema.

alter table public.admin_roles
  add column if not exists cluster_code text;

alter table public.events
  add column if not exists cluster_code text;

-- Keep the three CSE coordinator scopes explicit.  These updates are limited
-- to the known coordinator accounts and do not broaden any policy.
update public.admin_roles
set cluster_code = 'CSE-1'
where role in ('dept_coordinator', 'dept_chief_coordinator')
  and department_code = 'CSE'
  and (lower(username) in ('verma', 'varma', 'varma_cse') or lower(email) = 'varma@vardhaman.org');

update public.admin_roles
set cluster_code = 'CSE-2'
where role in ('dept_coordinator', 'dept_chief_coordinator')
  and department_code = 'CSE'
  and (lower(username) in ('balu', 'balu_cse', 'balusubramanyam') or lower(email) = 'balu1681@vardhaman.org');

update public.admin_roles
set cluster_code = 'CSE-3'
where role in ('dept_coordinator', 'dept_chief_coordinator')
  and department_code = 'CSE'
  and (lower(username) in ('raghavendra', 'raghavendra_cse') or lower(email) = 'raghavendra1797@vardhaman.org');

create or replace function private.can_manage_cluster(
  p_department_code text,
  p_cluster_code text default null
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.admin_roles ar
    where ar.user_id = auth.uid()
      and ar.active = true
      and ar.role in ('dept_chief_coordinator', 'dept_coordinator')
      and upper(ar.department_code) = upper(p_department_code)
      and (
        upper(p_department_code) <> 'CSE'
        or upper(coalesce(ar.cluster_code, '')) = upper(coalesce(p_cluster_code, ''))
      )
  );
$$;

grant execute on function private.can_manage_cluster(text, text) to authenticated;
grant insert (
  slug, title, tagline, department_code, cluster_code, category, format,
  min_team_size, max_team_size, fee, capacity, deadline, date_display,
  time_display, venue, description, rules, prizes, eligibility,
  coordinator_name, coordinator_phone, coordinator_email, status,
  banner_gradient, payment_instructions, faqs, approval_status
) on public.events to authenticated;

drop policy if exists events_insert_department_or_global on public.events;

create policy events_insert_department_or_global
on public.events
for insert
to authenticated
with check (
  not is_deleted
  and (
    private.current_is_global_admin()
    or (
      private.can_manage_cluster(department_code, cluster_code)
      and status = 'pending_approval'
      and approval_status = 'pending'
    )
  )
);
