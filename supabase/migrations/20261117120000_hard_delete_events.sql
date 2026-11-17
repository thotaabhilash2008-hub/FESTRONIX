-- Permanently remove an event only when the caller owns its operational scope.
-- Registrations and event assignments cascade with the event. Razorpay orders
-- are intentionally retained and block deletion so paid financial history is
-- never erased as a side effect.

begin;

create or replace function public.hard_delete_event(p_event_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog
as $$
declare
  v_event public.events%rowtype;
  v_order_count integer;
  v_paid_order_count integer;
begin
  if auth.uid() is null then
    raise exception 'Sign in before deleting an event.';
  end if;

  select * into v_event
  from public.events
  where id = p_event_id
  for update;

  if not found then
    raise exception 'Event not found. Refresh the event list and try again.';
  end if;

  if not private.current_is_global_admin()
    and not private.can_manage_event(v_event.id, v_event.department_code) then
    raise exception 'You are not authorized to permanently delete this event.';
  end if;

  select count(*), count(*) filter (where status = 'paid')
    into v_order_count, v_paid_order_count
  from public.razorpay_orders
  where event_id = p_event_id;

  if v_order_count > 0 then
    raise exception 'This event has % Razorpay order(s), including % paid order(s). Reconcile and preserve the payment records before permanently deleting it.',
      v_order_count, v_paid_order_count;
  end if;

  insert into public.audit_logs (actor_id, action, entity_type, entity_id, metadata)
  values (
    auth.uid(),
    'EVENT_PERMANENTLY_DELETED',
    'event',
    p_event_id::text,
    jsonb_build_object(
      'title', v_event.title,
      'department_code', v_event.department_code,
      'cluster_code', v_event.cluster_code
    )
  );

  delete from public.events where id = p_event_id;

  return jsonb_build_object('success', true, 'eventId', p_event_id);
end;
$$;

revoke all on function public.hard_delete_event(uuid) from public, anon;
grant execute on function public.hard_delete_event(uuid) to authenticated;

commit;
