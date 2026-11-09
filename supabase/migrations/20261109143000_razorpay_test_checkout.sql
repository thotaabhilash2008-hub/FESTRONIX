begin;

-- Razorpay is an additional payment rail. Existing UPI/manual-proof columns,
-- upload functions, review screens, and gate-scanner flows are deliberately
-- preserved for fallback and audit purposes.
alter table public.registrations
  add column if not exists payment_method text not null default 'manual_proof',
  add column if not exists razorpay_order_id text,
  add column if not exists razorpay_payment_id text;

alter table public.registrations
  drop constraint if exists registrations_payment_method_check;

alter table public.registrations
  add constraint registrations_payment_method_check
  check (payment_method in ('manual_proof', 'razorpay', 'spot', 'none'));

create index if not exists registrations_razorpay_order_idx
  on public.registrations (razorpay_order_id)
  where razorpay_order_id is not null;

create index if not exists registrations_razorpay_payment_idx
  on public.registrations (razorpay_payment_id)
  where razorpay_payment_id is not null;

-- The browser never receives access to this table. It stores the trusted
-- registration payload used after Razorpay verifies the checkout response,
-- making retries idempotent and preventing amount/details tampering.
create table if not exists public.razorpay_orders (
  id uuid primary key default gen_random_uuid(),
  razorpay_order_id text unique,
  razorpay_payment_id text,
  receipt text not null unique,
  event_id uuid not null references public.events(id) on delete restrict,
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  status text not null default 'creating'
    check (status in ('creating', 'created', 'attempted', 'paid', 'failed', 'expired')),
  payload jsonb not null default '{}'::jsonb,
  result_payload jsonb,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  paid_at timestamptz
);

create index if not exists razorpay_orders_event_status_idx
  on public.razorpay_orders (event_id, status, created_at desc);

alter table public.razorpay_orders enable row level security;
revoke all on table public.razorpay_orders from public, anon, authenticated;

-- Only the service-role Edge Functions may create/update order records. The
-- service role bypasses RLS, while this explicit policy documents the boundary
-- for environments that disable bypass in the future.
drop policy if exists razorpay_orders_service_role on public.razorpay_orders;
create policy razorpay_orders_service_role
  on public.razorpay_orders
  for all to service_role
  using (true)
  with check (true);

-- Finalize only after the Edge Function has verified the Razorpay signature and
-- server-side order/payment state. The order payload is the source of truth;
-- no participant fields or amount are accepted from the verification request.
create or replace function public.finalize_razorpay_order(
  p_razorpay_order_id text,
  p_razorpay_payment_id text
)
returns jsonb
language plpgsql
security definer
set search_path = pg_catalog, extensions, public, private
as $$
declare
  v_order public.razorpay_orders%rowtype;
  v_item jsonb;
  v_result jsonb;
  v_registration jsonb;
  v_results jsonb := '[]'::jsonb;
  v_event public.events%rowtype;
  v_event_id uuid;
  v_team_code text;
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    raise exception 'Razorpay finalization is restricted to the payment service.';
  end if;

  if nullif(trim(coalesce(p_razorpay_order_id, '')), '') is null
     or nullif(trim(coalesce(p_razorpay_payment_id, '')), '') is null then
    raise exception 'Razorpay order and payment IDs are required.';
  end if;

  select * into v_order
  from public.razorpay_orders
  where razorpay_order_id = trim(p_razorpay_order_id)
  for update;

  if not found then
    raise exception 'Razorpay order was not found.';
  end if;

  if v_order.status = 'paid' then
    return coalesce(v_order.result_payload, jsonb_build_object(
      'success', true,
      'alreadyFinalized', true,
      'registrations', '[]'::jsonb
    ));
  end if;

  if v_order.status not in ('created', 'attempted') then
    raise exception 'Razorpay order is not available for finalization.';
  end if;

  select * into v_event from public.events e
  where e.id = v_order.event_id and not e.is_deleted;
  if not found then raise exception 'The registration event no longer exists.'; end if;

  if jsonb_typeof(coalesce(v_order.payload->'items', '[]'::jsonb)) <> 'array'
     or jsonb_array_length(coalesce(v_order.payload->'items', '[]'::jsonb)) < 1 then
    raise exception 'Razorpay order does not contain registration items.';
  end if;

  for v_item in select value from jsonb_array_elements(v_order.payload->'items') loop
    begin
      v_event_id := (v_item->>'eventId')::uuid;
    exception when invalid_text_representation then
      raise exception 'A Razorpay registration item has an invalid event.';
    end;

    if v_event_id <> v_order.event_id then
      raise exception 'A Razorpay order cannot contain registrations for multiple events.';
    end if;

    v_team_code := nullif(trim(coalesce(v_item->>'teamCode', v_item->>'team_code', '')), '');
    v_result := private.create_guest_registration(
      v_order.event_id,
      nullif(trim(coalesce(v_item->>'buyerRoll', v_item->>'buyer_roll', '')), ''),
      coalesce(v_item->>'leaderName', v_item->>'leader_name', ''),
      coalesce(v_item->>'leaderEmail', v_item->>'leader_email', ''),
      coalesce(v_item->>'leaderPhone', v_item->>'leader_phone', ''),
      coalesce(v_item->>'leaderCollege', v_item->>'leader_college', ''),
      coalesce(v_item->>'leaderRoll', v_item->>'leader_roll', ''),
      coalesce(v_item->>'format', 'individual'),
      v_event.fee,
      'verification_pending',
      trim(p_razorpay_payment_id),
      'guest/razorpay/' || v_order.id::text,
      coalesce(v_item->'teammates', v_item->'registration_members', '[]'::jsonb),
      nullif(trim(coalesce(v_item->>'teamName', v_item->>'team_name', '')), ''),
      v_team_code
    );

    if coalesce((v_result->>'success')::boolean, false) is not true then
      raise exception '%', coalesce(v_result->>'error', 'The database rejected a Razorpay registration.');
    end if;

    v_registration := v_result->'registration';
    update public.registrations
    set payment_status = case when v_event.fee = 0 then 'not_applicable' else 'verified' end,
        payment_method = case when v_event.fee = 0 then 'none' else 'razorpay' end,
        transaction_id = trim(p_razorpay_payment_id),
        payment_screenshot_url = null,
        razorpay_order_id = trim(p_razorpay_order_id),
        razorpay_payment_id = trim(p_razorpay_payment_id),
        updated_at = now()
    where display_id = v_registration->>'id';

    v_registration := jsonb_set(v_registration, '{paymentStatus}',
      to_jsonb(case when v_event.fee = 0 then 'not_applicable' else 'verified' end));
    v_registration := jsonb_set(v_registration, '{paymentMethod}',
      to_jsonb(case when v_event.fee = 0 then 'none' else 'razorpay' end));
    v_registration := jsonb_set(v_registration, '{transactionId}', to_jsonb(trim(p_razorpay_payment_id)));
    v_registration := jsonb_set(v_registration, '{razorpayOrderId}', to_jsonb(trim(p_razorpay_order_id)));
    v_registration := jsonb_set(v_registration, '{razorpayPaymentId}', to_jsonb(trim(p_razorpay_payment_id)));
    v_registration := v_registration - 'paymentScreenshotUrl';
    v_results := v_results || jsonb_build_array(v_registration);
  end loop;

  -- A team payment belongs to the leader's order. Keep already-joined member
  -- registrations in exactly the same verified state and attach the audit IDs.
  for v_team_code in
    select distinct nullif(trim(coalesce(value->>'teamCode', value->>'team_code', '')), '')
    from jsonb_array_elements(v_order.payload->'items')
    where nullif(trim(coalesce(value->>'teamCode', value->>'team_code', '')), '') is not null
  loop
    update public.registrations
    set payment_status = 'verified',
        payment_method = 'razorpay',
        transaction_id = trim(p_razorpay_payment_id),
        payment_screenshot_url = null,
        razorpay_order_id = trim(p_razorpay_order_id),
        razorpay_payment_id = trim(p_razorpay_payment_id),
        updated_at = now()
    where event_id = v_order.event_id
      and regexp_replace(upper(coalesce(team_code, '')), '[^A-Z0-9]', '', 'g') = regexp_replace(upper(v_team_code), '[^A-Z0-9]', '', 'g')
      and payment_status <> 'rejected';
  end loop;

  v_result := jsonb_build_object(
    'success', true,
    'alreadyFinalized', false,
    'razorpayOrderId', trim(p_razorpay_order_id),
    'razorpayPaymentId', trim(p_razorpay_payment_id),
    'registrations', v_results
  );

  update public.razorpay_orders
  set status = 'paid',
      razorpay_payment_id = trim(p_razorpay_payment_id),
      result_payload = v_result,
      last_error = null,
      paid_at = now(),
      updated_at = now()
  where id = v_order.id;

  return v_result;
exception when others then
  update public.razorpay_orders
  set status = case when status = 'paid' then status else 'attempted' end,
      last_error = left(sqlerrm, 1000),
      updated_at = now()
  where id = v_order.id;
  raise;
end;
$$;

revoke all on function public.finalize_razorpay_order(text, text) from public, anon, authenticated;
grant execute on function public.finalize_razorpay_order(text, text) to service_role;

commit;
