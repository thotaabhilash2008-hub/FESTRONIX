begin;

-- Preserve the signed-in buyer identity on the trusted order row. The client
-- never supplies this ID directly; the order Edge Function derives it from a
-- Supabase access token that it validates with Auth.
alter table public.razorpay_orders
  add column if not exists buyer_user_id uuid references auth.users(id) on delete set null,
  add column if not exists refund_payment_id text;

create or replace function private.link_razorpay_buyer_to_registration()
returns trigger
language plpgsql
security definer
set search_path = pg_catalog, public
as $$
declare
  v_buyer_user_id uuid;
begin
  if new.user_id is not null or new.razorpay_order_id is null then
    return new;
  end if;

  select o.buyer_user_id into v_buyer_user_id
  from public.razorpay_orders o
  where o.razorpay_order_id = new.razorpay_order_id;

  if v_buyer_user_id is not null then
    new.user_id := v_buyer_user_id;
  end if;

  return new;
end;
$$;

drop trigger if exists registrations_link_razorpay_buyer on public.registrations;
create trigger registrations_link_razorpay_buyer
before update of razorpay_order_id on public.registrations
for each row execute function private.link_razorpay_buyer_to_registration();

revoke all on function private.link_razorpay_buyer_to_registration() from public, anon, authenticated;

-- A retry with the same captured payment returns the saved result. A second
-- captured payment for an already-paid Razorpay order must fail so the Edge
-- Function can refund it instead of returning the first buyer's passes.
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

  if not found then raise exception 'Razorpay order was not found.'; end if;

  if v_order.status = 'paid' then
    if v_order.razorpay_payment_id is distinct from trim(p_razorpay_payment_id) then
      raise exception 'Razorpay order was already finalized with a different payment.';
    end if;
    return coalesce(v_order.result_payload, jsonb_build_object(
      'success', true,
      'alreadyFinalized', true,
      'registrations', '[]'::jsonb
    ));
  end if;

  if v_order.status not in ('created', 'attempted') then
    raise exception 'Razorpay order is not available for finalization.';
  end if;

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

    select * into v_event from public.events e
    where e.id = v_event_id and not e.is_deleted;
    if not found then raise exception 'One of the registration events no longer exists.'; end if;
    if v_event.approval_status is distinct from 'approved' then
      raise exception 'One of the registration events is no longer approved.';
    end if;
    if v_event.status not in ('open', 'upcoming') then
      raise exception 'The registration event is no longer accepting registrations.';
    end if;
    if v_event.deadline is not null and v_event.deadline < now() then
      raise exception 'The registration deadline has passed.';
    end if;

    v_team_code := nullif(trim(coalesce(v_item->>'teamCode', v_item->>'team_code', '')), '');
    v_result := private.create_guest_registration(
      v_event_id,
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

    v_registration := jsonb_set(v_registration, '{eventId}', to_jsonb(v_event_id::text));
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

  for v_item in select value from jsonb_array_elements(v_order.payload->'items') loop
    begin
      v_event_id := (v_item->>'eventId')::uuid;
    exception when invalid_text_representation then
      raise exception 'A Razorpay registration item has an invalid event.';
    end;
    v_team_code := nullif(trim(coalesce(v_item->>'teamCode', v_item->>'team_code', '')), '');
    if v_team_code is not null then
      update public.registrations
      set payment_status = 'verified',
          payment_method = 'razorpay',
          transaction_id = trim(p_razorpay_payment_id),
          payment_screenshot_url = null,
          razorpay_order_id = trim(p_razorpay_order_id),
          razorpay_payment_id = trim(p_razorpay_payment_id),
          updated_at = now()
      where event_id = v_event_id
        and regexp_replace(upper(coalesce(team_code, '')), '[^A-Z0-9]', '', 'g') = regexp_replace(upper(v_team_code), '[^A-Z0-9]', '', 'g')
        and payment_status <> 'rejected';
    end if;
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
  where razorpay_order_id = nullif(trim(coalesce(p_razorpay_order_id, '')), '');
  raise;
end;
$$;

revoke all on function public.finalize_razorpay_order(text, text) from public, anon, authenticated;
grant execute on function public.finalize_razorpay_order(text, text) to service_role;

create or replace function private.list_razorpay_refund_orders()
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_all_events boolean;
  v_result jsonb;
begin
  if auth.uid() is null then
    raise exception 'Sign in before reviewing payment refunds.';
  end if;

  v_all_events := private.current_is_global_admin()
    or private.current_user_has_role(array['finance_reviewer']);

  if not v_all_events and not private.current_is_active_admin() then
    raise exception 'You are not authorized to review payment refunds.';
  end if;

  select coalesce(jsonb_agg(item order by created_at desc), '[]'::jsonb)
  into v_result
  from (
    select
      o.created_at,
      jsonb_build_object(
        'orderId', o.razorpay_order_id,
        'paymentId', coalesce(o.refund_payment_id, o.razorpay_payment_id),
        'eventId', e.id::text,
        'eventTitle', e.title,
        'departmentCode', e.department_code,
        'amountPaise', o.amount_paise,
        'orderStatus', o.status,
        'refundStatus', o.refund_status,
        'refundId', o.refund_id,
        'refundError', o.refund_error,
        'lastError', o.last_error,
        'createdAt', o.created_at,
        'updatedAt', o.updated_at
      ) as item
    from public.razorpay_orders o
    join public.events e on e.id = o.event_id
    where o.refund_status <> 'not_requested'
      and (v_all_events or private.can_manage_department(e.department_code))
  ) refunds;

  return v_result;
end;
$$;

revoke all on function private.list_razorpay_refund_orders() from public, anon;
grant execute on function private.list_razorpay_refund_orders() to authenticated;

commit;
