-- Repair the recreated CSE-3 department coordinator account.
--
-- This is intentionally a narrow, idempotent data repair. It does not infer
-- clusters for arbitrary users: only the official Raghavendra identity is
-- repaired, so CSE-3 event ownership remains isolated from CSE-1 and CSE-2.

begin;

-- Keep the role linked to the Supabase Auth identity as well.  The portal can
-- render from a cached profile, but event RLS authorizes the authenticated
-- user's UUID, so this link must be repaired before the cluster is usable.
update public.admin_roles ar
set user_id = au.id,
    email = lower(trim(au.email)),
    updated_at = now()
from auth.users au
where ar.active = true
  and ar.role in ('dept_coordinator', 'dept_chief_coordinator')
  and lower(trim(coalesce(ar.email, ''))) = lower(trim(coalesce(au.email, '')))
  and lower(trim(coalesce(ar.email, ''))) = 'raghavendra1797@vardhaman.org';

update public.admin_roles
set department_code = 'CSE',
    cluster_code = 'CSE-3',
    access_boundary = 'CSE 3 cluster events',
    updated_at = now()
where active = true
  and role in ('dept_coordinator', 'dept_chief_coordinator')
  and (
    lower(trim(coalesce(username, ''))) in ('raghavendra', 'raghavendra_cse', 'm_raghavendra')
    or lower(trim(coalesce(full_name, ''))) in ('m raghavendra', 'm. raghavendra')
    or lower(trim(coalesce(email, ''))) = 'raghavendra1797@vardhaman.org'
  );

commit;
