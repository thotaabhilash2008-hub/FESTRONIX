-- Allow a department coordinator to read scoped department events directly.
-- This is required for PostgREST INSERT ... RETURNING: the existing
-- events_admin_read policy queries the event row from inside its RLS helper,
-- which cannot see a row until the INSERT statement has completed.
begin;

drop policy if exists events_department_scope_read on public.events;
create policy events_department_scope_read
on public.events
for select
to authenticated
using (private.can_manage_cluster(department_code, cluster_code));

commit;
