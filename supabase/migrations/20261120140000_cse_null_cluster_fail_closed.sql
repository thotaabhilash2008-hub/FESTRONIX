-- Make CSE NULL-cluster semantics fail closed. A department coordinator with
-- no explicit CSE cluster must not manage general CSE events, matching the
-- dashboard UI which hides unclassified CSE events from cluster coordinators.
-- Non-CSE departments continue to use NULL as "no cluster concept".

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
        and (
          -- Non-CSE departments have no cluster dimension.
          upper(coalesce(r.department_code, '')) <> 'CSE'
          or (
            r.cluster_code is not null
            and p_cluster_code is not null
            and upper(r.cluster_code) = upper(p_cluster_code)
          )
        )
    );
$$;
