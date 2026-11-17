-- Guest registration runs through a trusted service-role function. Its event
-- counter/status update must pass the event guard, while all coordinator and
-- admin edits remain subject to the existing department/cluster checks.
begin;

create or replace function private.guard_event_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  -- Registration may change only these event fields after it has validated
  -- the event and capacity. Keep service-role writes to all other event
  -- fields behind the regular global-admin/cluster authorization below.
  if coalesce(auth.role(), '') = 'service_role'
    and tg_op = 'UPDATE'
    and (to_jsonb(new) - array['registered_count', 'status', 'updated_at'])
      = (to_jsonb(old) - array['registered_count', 'status', 'updated_at'])
    and coalesce(new.registered_count, 0) >= coalesce(old.registered_count, 0)
    and (
      new.status is not distinct from old.status
      or (new.status = 'full' and coalesce(new.registered_count, 0) >= coalesce(new.capacity, 0))
    ) then
    return new;
  end if;

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

commit;
