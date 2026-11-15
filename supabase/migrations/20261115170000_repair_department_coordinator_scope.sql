-- Repair department-coordinator authorization after the cluster rollout.
--
-- Department coordinators are allowed to create pending events and manage
-- department-scoped operational staff. They do not need a global-admin role.
-- This migration repairs the Auth identity link first, then applies the
-- department/CSE-cluster boundary used by the events INSERT policy.

begin;

alter table public.admin_roles
  add column if not exists cluster_code text;

alter table public.events
  add column if not exists cluster_code text;

-- Normalize scope values so comparisons do not fail because a role was saved
-- as "it", " IT ", or with a lowercase CSE cluster.
update public.admin_roles
set department_code = upper(nullif(trim(department_code), '')),
    cluster_code = upper(nullif(trim(cluster_code), '')),
    updated_at = now()
where active = true;

-- Do not mass-update existing events here. The earlier cluster migration
-- installed a BEFORE UPDATE guard that intentionally evaluates the caller's
-- authenticated scope; migration execution has no auth.uid(), so rewriting
-- legacy rows would be rejected by that guard. Authorization comparisons use
-- upper(trim(...)) and new event writes already store normalized codes.

-- Repair the most reliable identity mapping: the active role's email must
-- point to the same Auth user that signs in. The NOT EXISTS guard preserves
-- the one-active-role-per-user invariant.
update public.admin_roles ar
set user_id = au.id,
    email = lower(trim(au.email)),
    updated_at = now()
from auth.users au
where ar.active = true
  and au.email is not null
  and nullif(trim(ar.email), '') is not null
  and lower(trim(ar.email)) = lower(trim(au.email))
  and ar.user_id is distinct from au.id
  and not exists (
    select 1
    from public.admin_roles existing
    where existing.active = true
      and existing.user_id = au.id
      and existing.id <> ar.id
  );

-- Some older coordinator rows were created before user_id was populated or
-- retained an obsolete Auth UUID. Repair only an unambiguous email/username
-- match from profiles; never guess between multiple accounts.
with candidates as (
  select distinct
    ar.id as role_id,
    p.id as auth_id,
    count(*) over (partition by ar.id) as candidate_count
  from public.admin_roles ar
  join public.profiles p
    on (
      (nullif(trim(ar.email), '') is not null
       and lower(trim(ar.email)) = lower(trim(coalesce(p.email, ''))))
      or
      (nullif(trim(ar.username), '') is not null
       and lower(trim(ar.username)) = lower(trim(coalesce(p.username, ''))))
    )
  where ar.active = true
    and ar.role in ('dept_chief_coordinator', 'dept_coordinator')
    and ar.user_id is distinct from p.id
), unique_candidates as (
  select role_id, auth_id
  from candidates
  where candidate_count = 1
)
update public.admin_roles ar
set user_id = c.auth_id,
    updated_at = now()
from unique_candidates c
where ar.id = c.role_id
  and not exists (
    select 1
    from public.admin_roles existing
    where existing.active = true
      and existing.user_id = c.auth_id
      and existing.id <> ar.id
  );

-- CSE is the only department with cluster boundaries. These assignments are
-- intentionally explicit so the three CSE coordinators cannot see or create
-- events for one another's cluster. Non-CSE coordinators are department-wide.
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

update public.admin_roles
set cluster_code = null,
    updated_at = now()
where active = true
  and role in ('dept_coordinator', 'dept_chief_coordinator')
  and upper(coalesce(department_code, '')) <> 'CSE'
  and cluster_code is not null;

-- Keep the existing signature exactly: changing parameter names/defaults on a
-- live PostgreSQL function raises 42P13 and leaves the old policy in place.
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

-- RLS is the final authority. A department coordinator can insert only a
-- pending event inside the coordinator's department; CSE also requires the
-- exact cluster. Global admins retain their existing ability to create any
-- event/status.
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

-- The grant is harmless without the policy and avoids a misleading RLS error
-- when an older project had narrowed table privileges for authenticated.
grant insert on public.events to authenticated;

commit;
