-- Refund listings must honour CSE cluster isolation for non-finance staff.
-- Finance reviewers and global admins keep the existing cross-department view.

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
        'paymentId', o.razorpay_payment_id,
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
      and (
        v_all_events
        or (
          private.can_manage_department(e.department_code)
          and private.can_manage_cluster(e.department_code, e.cluster_code)
        )
      )
  ) refunds;

  return v_result;
end;
$$;
