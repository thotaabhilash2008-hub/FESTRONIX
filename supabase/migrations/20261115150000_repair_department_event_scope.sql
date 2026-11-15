-- Final repair for department event creation and CSE cluster isolation.
--
-- Run this after the earlier cluster/RLS migrations. It is deliberately
-- idempotent and repairs only unambiguous Auth <-> admin_roles email links.
-- Non-CSE departments intentionally keep cluster_code NULL; clusters are a
-- CSE-only boundary.

begin;

alter table public.admin_roles
  add column if not exists cluster_code text;

alter table public.events
  add column if not exists cluster_code text;

-- Link an active role to its Auth identity only when the normalized email is
-- unique and that Auth user does not already have another active role.
update public.admin_roles ar
set user_id = au.id,
    email = lower(trim(au.email)),
    updated_at = now()
from auth.users au
where ar.active = true
  and au.email is not null
  and ar.email is not null
  and lower(trim(ar.email)) = lower(trim(au.email))
  and ar.user_id is distinct from au.id
  and not exists (
    select 1
    from public.admin_roles existing
    where existing.active = true
      and existing.user_id = au.id
      and existing.id <> ar.id
  );

-- Explicit CSE ownership. These are the only department roles that receive a
-- cluster boundary; all other department roles remain department-scoped.
update public.admin_roles
set cluster_code = 'CSE-1',
    access_boundary = 'CSE 1 cluster events',
    updated_at = now()
where active = true
  and role in ('dept_coordinator', 'dept_chief_coordinator')
  and upper(coalesce(department_code, '')) = 'CSE'
  and (
    lower(coalesce(username, '')) in ('verma', 'varma', 'varma_cse', 'bjv_varma')
    or lower(coalesce(full_name, '')) in ('bjv varma', 'b j v varma')
    or lower(coalesce(email, '')) = 'varma@vardhaman.org'
  );

update public.admin_roles
set cluster_code = 'CSE-2',
    access_boundary = 'CSE 2 cluster events',
    updated_at = now()
where active = true
  and role in ('dept_coordinator', 'dept_chief_coordinator')
  and upper(coalesce(department_code, '')) = 'CSE'
  and (
    lower(coalesce(username, '')) in ('balu', 'balu_cse', 'balusubramanyam')
    or lower(coalesce(full_name, '')) in ('ch bala subramanyam', 'bala subramanyam')
    or lower(coalesce(email, '')) = 'balu1681@vardhaman.org'
  );

update public.admin_roles
set cluster_code = 'CSE-3',
    access_boundary = 'CSE 3 cluster events',
    updated_at = now()
where active = true
  and role in ('dept_coordinator', 'dept_chief_coordinator')
  and upper(coalesce(department_code, '')) = 'CSE'
  and (
    lower(coalesce(username, '')) in ('raghavendra', 'raghavendra_cse', 'm_raghavendra')
    or lower(coalesce(full_name, '')) in ('m raghavendra', 'm. raghavendra')
    or lower(coalesce(email, '')) = 'raghavendra1797@vardhaman.org'
  );

-- Prevent stale cluster labels on non-CSE department roles from affecting
-- authorization. NULL here is intentional and means department-wide scope.
update public.admin_roles
set cluster_code = null,
    updated_at = now()
where active = true
  and role in ('dept_coordinator', 'dept_chief_coordinator')
  and upper(coalesce(department_code, '')) <> 'CSE'
  and cluster_code is not null;

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
  select private.current_is_global_admin()
    or exists (
      select 1
      from public.admin_roles ar
      where ar.user_id = (select auth.uid())
        and ar.active = true
        and ar.role in ('dept_chief_coordinator', 'dept_coordinator')
        and upper(coalesce(ar.department_code, '')) = upper(coalesce(p_department_code, ''))
        and (
          upper(coalesce(p_department_code, '')) <> 'CSE'
          or upper(coalesce(ar.cluster_code, '')) = upper(coalesce(p_cluster_code, ''))
        )
    );
$$;

revoke all on function private.can_manage_cluster(text, text) from public, anon;
grant execute on function private.can_manage_cluster(text, text) to authenticated;

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

commit;
