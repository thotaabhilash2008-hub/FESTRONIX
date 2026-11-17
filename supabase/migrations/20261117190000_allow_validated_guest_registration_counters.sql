-- Public and authenticated registration RPCs run with the caller's JWT role,
-- not service_role. Mark a transaction only when a registration row is being
-- inserted so its validated registration flow can update the event counters.
begin;

create or replace function private.mark_registration_event_counter_update()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
begin
  perform set_config('festronix.registration_event_counter_update', 'on', true);
  return new;
end;
$$;

revoke all on function private.mark_registration_event_counter_update() from public, anon, authenticated;

drop trigger if exists mark_registration_event_counter_update on public.registrations;
create trigger mark_registration_event_counter_update
before insert on public.registrations
for each row execute function private.mark_registration_event_counter_update();

create or replace function private.guard_event_admin_fields()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_registration_counter_update boolean :=
    coalesce(auth.role(), '') = 'service_role'
    or coalesce(current_setting('festronix.registration_event_counter_update', true), '') = 'on';
begin
  -- Registration may change only event counters/status/timestamps. The
  -- transaction marker is set by the registrations BEFORE INSERT trigger;
  -- direct coordinator event edits still pass through the usual scope checks.
  if tg_op = 'UPDATE'
    and (to_jsonb(new) - array['registered_count', 'status', 'updated_at'])
      = (to_jsonb(old) - array['registered_count', 'status', 'updated_at'])
    and coalesce(new.registered_count, 0) >= coalesce(old.registered_count, 0)
    and (
      new.status is not distinct from old.status
      or (new.status = 'full' and coalesce(new.registered_count, 0) >= coalesce(new.capacity, 0))
    )
    and (
      v_registration_counter_update
      or (
        new.status = 'full'
        and new.registered_count is not distinct from old.registered_count
        and coalesce(new.registered_count, 0) >= coalesce(new.capacity, 0)
      )
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
