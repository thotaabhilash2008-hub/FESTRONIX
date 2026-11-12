-- Keep duplicate-payment recovery auditable and retry-safe. A captured payment
-- can still race with another registration between order creation and the
-- finalization RPC, so the verifier must be able to record a refund outcome.
alter table public.razorpay_orders
  add column if not exists refund_status text not null default 'not_requested',
  add column if not exists refund_id text,
  add column if not exists refund_error text;

alter table public.razorpay_orders
  drop constraint if exists razorpay_orders_refund_status_check;

alter table public.razorpay_orders
  add constraint razorpay_orders_refund_status_check
  check (refund_status in ('not_requested', 'pending', 'succeeded', 'failed'));

create index if not exists razorpay_orders_refund_status_idx
  on public.razorpay_orders (refund_status)
  where refund_status <> 'not_requested';
