-- Scope department announcements to the coordinator's exact CSE cluster.
-- Without this, a CSE-1 coordinator can publish an announcement visible to
-- CSE-2/CSE-3 coordinators and students.

alter table public.announcements
  add column if not exists cluster_code text;

create index if not exists idx_announcements_department_cluster
  on public.announcements (department_code, cluster_code);

create or replace function private.can_manage_announcement(
  p_scope text,
  p_department_code text,
  p_cluster_code text default null
)
returns boolean
language sql stable security definer
set search_path = pg_catalog
as $$
  select private.current_is_global_admin()
    or (
      p_scope = 'department'
      and private.can_manage_department(p_department_code)
      and private.can_manage_cluster(p_department_code, p_cluster_code)
    );
$$;

drop policy if exists announcements_insert_scoped on public.announcements;
drop policy if exists announcements_update_scoped on public.announcements;
drop policy if exists announcements_delete_scoped on public.announcements;

create policy announcements_insert_scoped on public.announcements
  for insert to authenticated
  with check (private.can_manage_announcement(scope, department_code, cluster_code));

create policy announcements_update_scoped on public.announcements
  for update to authenticated
  using (private.can_manage_announcement(scope, department_code, cluster_code))
  with check (private.can_manage_announcement(scope, department_code, cluster_code));

create policy announcements_delete_scoped on public.announcements
  for delete to authenticated
  using (private.can_manage_announcement(scope, department_code, cluster_code));

-- Reads are public by design, but the client must still filter by cluster.
comment on column public.announcements.cluster_code is
  'Exact CSE cluster for department announcements; null means department-general.';
