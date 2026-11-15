-- Reconcile portal roles with Supabase Auth before enforcing scoped event RLS.
--
-- The coordinator login uses the email stored on admin_roles, but RLS uses
-- auth.uid(). Older staff records were sometimes created with a stale or
-- missing user_id, so the login could succeed while event INSERT was denied.
-- This migration repairs only an unambiguous active role/email match and does
-- not broaden access across departments or clusters.

begin;

alter table public.admin_roles
  add column if not exists cluster_code text;

-- Link each active role to the Auth account with the same normalized email.
-- The NOT EXISTS guard preserves the one-active-role-per-account invariant and
-- leaves ambiguous records for an administrator to resolve explicitly.
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

-- Backfill the explicit CSE cluster boundary after identity reconciliation.
update public.admin_roles
set cluster_code = 'CSE-1',
    access_boundary = 'CSE 1 cluster events',
    updated_at = now()
where active = true
  and role in ('dept_coordinator', 'dept_chief_coordinator')
  and upper(coalesce(department_code, '')) = 'CSE'
  and (
    lower(coalesce(username, '')) in ('verma', 'varma', 'varma_cse')
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
    lower(coalesce(username, '')) in ('raghavendra', 'raghavendra_cse')
    or lower(coalesce(email, '')) = 'raghavendra1797@vardhaman.org'
  );

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
