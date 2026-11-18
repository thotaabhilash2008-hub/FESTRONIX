begin;

-- Team member registrations are created by the registration trigger and do
-- not appear in the payment finalizer's leader-only response. Let payment
-- Edge Functions find their queued pass emails by the finalized order.
create or replace function public.razorpay_order_email_delivery_tokens(
  p_razorpay_order_id text
)
returns text[]
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_tokens text[];
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Pass email delivery lookup is restricted to the payment service.';
  end if;

  select coalesce(array_agg(d.delivery_token), array[]::text[])
    into v_tokens
  from public.registration_email_deliveries d
  join public.registrations r on r.id = d.registration_id
  where r.razorpay_order_id = trim(coalesce(p_razorpay_order_id, ''))
    and d.status <> 'sent';

  return v_tokens;
end;
$$;

revoke all on function public.razorpay_order_email_delivery_tokens(text) from public, anon, authenticated;
grant execute on function public.razorpay_order_email_delivery_tokens(text) to service_role;

commit;
