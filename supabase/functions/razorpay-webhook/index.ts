import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { refundCapturedPayment, resolveRazorpayMode, sendPassEmails } from '../_shared/razorpay.ts';

const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { 'Content-Type': 'application/json' }
});

const clean = (value: unknown) => String(value ?? '').trim();

async function hmacHex(message: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
  return Array.from(new Uint8Array(signature)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function signaturesMatch(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

async function persistRefund(
  db: any,
  order: any,
  paymentId: string,
  reason: string,
  refund: Awaited<ReturnType<typeof refundCapturedPayment>>
) {
  const update = refund.success
    ? {
        status: order.status === 'paid' ? 'paid' : 'failed',
        razorpay_payment_id: order.status === 'paid' ? order.razorpay_payment_id : paymentId,
        refund_status: 'succeeded',
        refund_id: refund.refundId || order.refund_id || null,
        refund_payment_id: paymentId,
        refund_error: null,
        last_error: reason,
        updated_at: new Date().toISOString()
      }
    : {
        status: order.status === 'paid' ? 'paid' : 'attempted',
        razorpay_payment_id: order.status === 'paid' ? order.razorpay_payment_id : paymentId,
        refund_status: 'failed',
        refund_payment_id: paymentId,
        refund_error: refund.error || 'Refund failed.',
        last_error: `${reason} Refund requires manual review.`,
        updated_at: new Date().toISOString()
      };
  const { error } = await db.from('razorpay_orders').update(update).eq('id', order.id);
  if (error) console.error('Unable to persist webhook refund outcome:', error.message);
  return !error;
}

Deno.serve(async request => {
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405);

  const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET') || '';
  const keyId = clean(Deno.env.get('RAZORPAY_KEY_ID'));
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
  if (!webhookSecret || !keyId || !keySecret) {
    console.error('Razorpay webhook secrets are not configured.');
    return respond({ error: 'Razorpay webhook is not configured.' }, 503);
  }
  if (!resolveRazorpayMode(keyId, Deno.env.get('RAZORPAY_MODE'))) {
    return respond({ error: 'Razorpay credentials are invalid or do not match the configured payment mode.' }, 503);
  }

  const rawBody = await request.text();
  const signature = clean(request.headers.get('x-razorpay-signature')).toLowerCase();
  if (!signature || !signaturesMatch(await hmacHex(rawBody, webhookSecret), signature)) {
    return respond({ error: 'Invalid Razorpay webhook signature.' }, 400);
  }

  try {
    const event = JSON.parse(rawBody);
    if (event.event !== 'payment.captured') return respond({ received: true, ignored: true });

    const webhookPayment = event?.payload?.payment?.entity;
    const paymentId = clean(webhookPayment?.id);
    const orderId = clean(webhookPayment?.order_id);
    if (!paymentId || !orderId) return respond({ error: 'Captured payment webhook is missing its payment or order ID.' }, 400);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const db: any = createClient(supabaseUrl, serviceRoleKey);
    const { data: order, error: orderError } = await db.from('razorpay_orders')
      .select('id, razorpay_order_id, razorpay_payment_id, amount_paise, currency, status, result_payload, refund_status, refund_id')
      .eq('razorpay_order_id', orderId)
      .maybeSingle();
    if (orderError) throw new Error(`Unable to load payment order: ${orderError.message}`);
    if (!order) return respond({ received: true, ignored: true });

    const authHeader = { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` };
    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, { headers: authHeader });
    const payment = await paymentResponse.json().catch(() => ({}));
    if (!paymentResponse.ok) throw new Error('Unable to confirm the captured payment with Razorpay.');
    if (payment.order_id !== orderId || payment.status !== 'captured' || !Number.isSafeInteger(Number(payment.amount)) || Number(payment.amount) <= 0) {
      return respond({ error: 'Razorpay payment details do not match the captured order.' }, 409);
    }

    if (order.status === 'paid' && order.result_payload && order.razorpay_payment_id === paymentId) {
      if (Number(payment.amount) !== Number(order.amount_paise) || payment.currency !== order.currency) {
        return respond({ error: 'Captured payment details do not match the finalized order.' }, 409);
      }
      await sendPassEmails(order.result_payload.registrations, supabaseUrl, serviceRoleKey);
      return respond({ received: true, processed: true, alreadyFinalized: true });
    }

    if (order.status === 'paid' && order.result_payload) {
      const refund = await refundCapturedPayment(
        paymentId,
        orderId,
        Number(payment.amount),
        authHeader,
        Number(payment.amount_refunded || 0)
      );
      const stored = await persistRefund(db, order, paymentId, 'An additional captured payment was made for an already paid order.', refund);
      if (!refund.success) return respond({ error: 'Additional captured payment needs manual refund review.', retryable: stored }, 500);
      return respond({ received: true, processed: true, refunded: true });
    }

    if (payment.currency !== order.currency || Number(payment.amount) !== Number(order.amount_paise)) {
      const refund = await refundCapturedPayment(
        paymentId,
        orderId,
        Number(payment.amount),
        authHeader,
        Number(payment.amount_refunded || 0)
      );
      const stored = await persistRefund(db, order, paymentId, 'Captured payment amount or currency did not match the stored Razorpay order.', refund);
      return respond({
        error: refund.success ? 'Captured payment did not match the order and was refunded.' : 'Captured payment amount mismatch needs manual refund review.',
        retryable: stored
      }, refund.success ? 200 : 500);
    }

    if (order.status === 'failed' && order.refund_status === 'succeeded') {
      return respond({ received: true, processed: true, alreadyRefunded: true });
    }

    const { data: result, error: finalizeError } = await db.rpc('finalize_razorpay_order_safely', {
      p_razorpay_order_id: orderId,
      p_razorpay_payment_id: paymentId
    });
    if (finalizeError) {
      console.error('Webhook registration finalization failed:', finalizeError.message);
      const { data: latestOrder } = await db.from('razorpay_orders')
        .select('razorpay_payment_id, status, result_payload')
        .eq('id', order.id)
        .maybeSingle();
      if (latestOrder?.status === 'paid' && latestOrder.razorpay_payment_id === paymentId && latestOrder.result_payload) {
        await sendPassEmails(latestOrder.result_payload.registrations, supabaseUrl, serviceRoleKey);
        return respond({ received: true, processed: true, alreadyFinalized: true });
      }
      const orderForRefund = latestOrder?.status === 'paid'
        ? { ...order, status: 'paid', razorpay_payment_id: latestOrder.razorpay_payment_id }
        : order;
      if (latestOrder?.status === 'paid') {
        const refund = await refundCapturedPayment(paymentId, orderId, Number(payment.amount), authHeader, Number(payment.amount_refunded || 0));
        const stored = await persistRefund(db, orderForRefund, paymentId, 'An additional captured payment was made for an already paid order.', refund);
        if (!refund.success) return respond({ error: 'Additional captured payment needs manual refund review.', retryable: stored }, 500);
        return respond({ received: true, processed: true, refunded: true });
      }

      const reason = `Payment was captured but registration finalization failed: ${clean(finalizeError.message).slice(0, 700)}`;
      await db.from('razorpay_orders').update({
        status: 'attempted',
        razorpay_payment_id: paymentId,
        refund_status: 'pending',
        refund_error: null,
        last_error: reason,
        updated_at: new Date().toISOString()
      }).eq('id', order.id).neq('status', 'paid');

      const refund = await refundCapturedPayment(
        paymentId,
        orderId,
        Number(payment.amount),
        authHeader,
        Number(payment.amount_refunded || 0)
      );
      const stored = await persistRefund(db, orderForRefund, paymentId, reason, refund);
      if (!refund.success) return respond({ error: 'Registration failed and the captured payment refund needs manual review.', retryable: stored }, 500);
      return respond({ received: true, processed: true, refunded: true });
    }

    await sendPassEmails(result?.registrations, supabaseUrl, serviceRoleKey);
    return respond({ received: true, processed: true });
  } catch (error) {
    console.error('Razorpay webhook processing failed:', error instanceof Error ? error.message : 'unknown error');
    return respond({ error: 'Razorpay webhook processing failed; retry is safe.' }, 500);
  }
});
