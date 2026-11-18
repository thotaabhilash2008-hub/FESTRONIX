begin;

-- Lock every event row for a multi-event payment in one deterministic order.
-- This prevents two carts containing the same events in different orders from
-- deadlocking during their atomic registration finalization.
create or replace function private.lock_razorpay_order_events(p_order_id text)
returns void
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_payload jsonb;
  v_event_ref text;
  v_event_id uuid;
begin
  select o.payload into v_payload
  from public.razorpay_orders o
  where o.razorpay_order_id = trim(coalesce(p_order_id, ''))
  for update;

  if not found then raise exception 'Razorpay order was not found.'; end if;
  if jsonb_typeof(coalesce(v_payload->'items', '[]'::jsonb)) <> 'array' then
    raise exception 'Razorpay order does not contain valid registration items.';
  end if;

  for v_event_ref in
    select distinct coalesce(item.value->>'eventId', item.value->>'event_id')
    from jsonb_array_elements(coalesce(v_payload->'items', '[]'::jsonb)) as item(value)
    where nullif(trim(coalesce(item.value->>'eventId', item.value->>'event_id', '')), '') is not null
    order by 1
  loop
    begin
      v_event_id := v_event_ref::uuid;
    exception when invalid_text_representation then
      raise exception 'A Razorpay registration item has an invalid event.';
    end;

    perform e.id
    from public.events e
    where e.id = v_event_id
    for update;
  end loop;
end;
$$;

revoke all on function private.lock_razorpay_order_events(text) from public, anon, authenticated;

-- The wrapper executes the event locks and the existing finalizer in the same
-- database transaction. Keep the underlying finalizer service-role-only.
create or replace function public.finalize_razorpay_order_safely(
  p_razorpay_order_id text,
  p_razorpay_payment_id text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, public, private
as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Razorpay finalization is restricted to the payment service.';
  end if;

  perform private.lock_razorpay_order_events(p_razorpay_order_id);
  return public.finalize_razorpay_order(p_razorpay_order_id, p_razorpay_payment_id);
end;
$$;

revoke all on function public.finalize_razorpay_order_safely(text, text) from public, anon, authenticated;
grant execute on function public.finalize_razorpay_order_safely(text, text) to service_role;

commit;
