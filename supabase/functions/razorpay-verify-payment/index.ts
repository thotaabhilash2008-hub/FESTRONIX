import { createClient } from 'npm:@supabase/supabase-js@2.118.0';
import { refundCapturedPayment, resolveRazorpayMode, sendPassEmails } from '../_shared/razorpay.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});

const clean = (value: unknown) => String(value ?? '').trim();

async function createSignature(orderId: string, paymentId: string, secret: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(`${orderId}|${paymentId}`));
  return Array.from(new Uint8Array(signature)).map(byte => byte.toString(16).padStart(2, '0')).join('');
}

function signaturesMatch(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return difference === 0;
}

function removeDeliveryTokens(result: any): any {
  if (!result || typeof result !== 'object') return result;
  const safeResult = structuredClone(result);
  if (Array.isArray(safeResult.registrations)) {
    for (const registration of safeResult.registrations) delete registration.emailDeliveryToken;
  }
  return safeResult;
}

async function dispatchEmails(result: any, supabaseUrl: string, serviceRoleKey: string) {
  await sendPassEmails(result?.registrations, supabaseUrl, serviceRoleKey, result?.razorpayOrderId);
}

async function persistRefundOutcome(
  db: any,
  order: any,
  paymentId: string,
  failureMessage: string,
  refund: Awaited<ReturnType<typeof refundCapturedPayment>>
) {
  const now = new Date().toISOString();
  const update = refund.success
    ? {
        status: order.status === 'paid' ? 'paid' : 'failed',
        razorpay_payment_id: order.status === 'paid' ? order.razorpay_payment_id : paymentId,
        refund_status: 'succeeded',
        refund_id: refund.refundId || order.refund_id || null,
        refund_payment_id: paymentId,
        refund_error: null,
        last_error: failureMessage,
        updated_at: now
      }
    : {
        status: order.status === 'paid' ? 'paid' : 'attempted',
        razorpay_payment_id: order.status === 'paid' ? order.razorpay_payment_id : paymentId,
        refund_status: 'failed',
        refund_payment_id: paymentId,
        refund_error: refund.error || 'Refund failed.',
        last_error: `${failureMessage} Refund requires manual review.`,
        updated_at: now
      };
  const { error } = await db.from('razorpay_orders').update(update).eq('id', order.id);
  if (error) console.error('Unable to persist Razorpay refund outcome:', error.message);
  return !error;
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405);

  const keyId = clean(Deno.env.get('RAZORPAY_KEY_ID'));
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
  if (!keyId || !keySecret) return respond({ error: 'Razorpay credentials are not configured on the backend.' }, 503);
  if (!resolveRazorpayMode(keyId, Deno.env.get('RAZORPAY_MODE'))) {
    return respond({ error: 'Razorpay credentials are invalid or do not match the configured payment mode.' }, 503);
  }

  try {
    const body = await request.json().catch(() => ({}));
    const orderId = clean(body.razorpay_order_id);
    const paymentId = clean(body.razorpay_payment_id);
    const signature = clean(body.razorpay_signature).toLowerCase();
    if (!orderId || !paymentId || !signature) return respond({ error: 'Razorpay checkout verification data is incomplete.' }, 400);

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const db: any = createClient(supabaseUrl, serviceRoleKey);
    const { data: order, error: orderError } = await db.from('razorpay_orders')
      .select('id, razorpay_order_id, razorpay_payment_id, amount_paise, currency, status, result_payload, refund_status, refund_id')
      .eq('razorpay_order_id', orderId)
      .maybeSingle();
    if (orderError || !order) return respond({ error: 'The payment order could not be found.' }, 404);

    // Authenticate the callback before returning any stored registration or
    // QR data, and before mutating order state.
    const expectedSignature = await createSignature(orderId, paymentId, keySecret);
    if (!signaturesMatch(expectedSignature, signature)) {
      return respond({ error: 'Razorpay signature verification failed.' }, 400);
    }

    const authHeader = { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` };
    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: authHeader
    });
    const payment = await paymentResponse.json().catch(() => ({}));
    const capturedPaymentBelongsToOrder = paymentResponse.ok && payment.order_id === orderId &&
      payment.status === 'captured' && Number.isSafeInteger(Number(payment.amount)) && Number(payment.amount) > 0;
    if (!capturedPaymentBelongsToOrder) {
      if (order.status !== 'paid') {
        await db.from('razorpay_orders').update({
          status: 'attempted',
          last_error: 'Razorpay payment capture was not confirmed.',
          updated_at: new Date().toISOString()
        }).eq('id', order.id).neq('status', 'paid');
      }
      return respond({ error: 'The payment was not confirmed as captured for this order. Please retry verification or contact the fest desk.' }, 409);
    }

    const paymentMatchesStoredAmount = Number(payment.amount) === Number(order.amount_paise) && payment.currency === order.currency;
    if (order.status === 'paid' && order.result_payload) {
      if (order.razorpay_payment_id === paymentId) {
        if (!paymentMatchesStoredAmount) {
          return respond({ error: 'The captured payment does not match the finalized order. Contact the fest desk before retrying payment.' }, 409);
        }
        await dispatchEmails(order.result_payload, supabaseUrl, serviceRoleKey);
        return respond(removeDeliveryTokens(order.result_payload));
      }

      // One order must not issue a second set of passes for another captured
      // payment. Refund the additional capture and preserve the original paid
      // registration result.
      const refund = await refundCapturedPayment(
        paymentId,
        orderId,
        Number(payment.amount),
        authHeader,
        Number(payment.amount_refunded || 0)
      );
      const stored = await persistRefundOutcome(db, order, paymentId, 'An additional captured payment was made for an already paid order.', refund);
      return respond({
        error: refund.success
          ? 'This order was already paid. The additional payment was refunded.'
          : 'This order was already paid. The additional payment needs manual refund review.',
        code: refund.success ? 'ADDITIONAL_PAYMENT_REFUNDED' : 'ADDITIONAL_PAYMENT_REFUND_REVIEW',
        refunded: refund.success,
        refundId: refund.refundId || order.refund_id || undefined,
        retryable: !refund.success && stored
      }, refund.success ? 409 : 500);
    }

    if (order.status === 'failed' && order.refund_status === 'succeeded') {
      return respond({
        error: 'This payment was refunded because registration could not be completed.',
        code: 'PAYMENT_REFUNDED',
        refunded: true,
        refundId: order.refund_id || undefined
      }, 409);
    }

    if (!paymentMatchesStoredAmount) {
      const refund = await refundCapturedPayment(
        paymentId,
        orderId,
        Number(payment.amount),
        authHeader,
        Number(payment.amount_refunded || 0)
      );
      const failureMessage = 'Captured payment amount or currency did not match the stored Razorpay order.';
      const stored = await persistRefundOutcome(db, order, paymentId, failureMessage, refund);
      return respond({
        error: refund.success ? 'The captured payment did not match the order and was refunded.' : 'The captured payment did not match the order and needs manual refund review.',
        code: refund.success ? 'PAYMENT_MISMATCH_REFUNDED' : 'PAYMENT_MISMATCH_REFUND_REVIEW',
        refunded: refund.success,
        retryable: !refund.success && stored
      }, refund.success ? 409 : 500);
    }

    const { data: result, error: finalizeError } = await db.rpc('finalize_razorpay_order_safely', {
      p_razorpay_order_id: orderId,
      p_razorpay_payment_id: paymentId
    });
    if (finalizeError) {
      console.error('Razorpay registration finalization failed:', finalizeError.message);

      // A concurrent, valid callback can finish while this request is waiting.
      const { data: latestOrder } = await db.from('razorpay_orders')
        .select('razorpay_payment_id, status, result_payload')
        .eq('id', order.id)
        .maybeSingle();
      if (latestOrder?.status === 'paid' && latestOrder.razorpay_payment_id === paymentId && latestOrder.result_payload) {
        await dispatchEmails(latestOrder.result_payload, supabaseUrl, serviceRoleKey);
        return respond(removeDeliveryTokens(latestOrder.result_payload));
      }
      const orderForRefund = latestOrder?.status === 'paid'
        ? { ...order, status: 'paid', razorpay_payment_id: latestOrder.razorpay_payment_id }
        : order;
      if (latestOrder?.status === 'paid') {
        const refund = await refundCapturedPayment(paymentId, orderId, Number(payment.amount), authHeader, Number(payment.amount_refunded || 0));
        const stored = await persistRefundOutcome(db, orderForRefund, paymentId, 'An additional captured payment was made for an already paid order.', refund);
        return respond({
          error: refund.success ? 'This order was already paid. The additional payment was refunded.' : 'This order was already paid. The additional payment needs manual refund review.',
          code: refund.success ? 'ADDITIONAL_PAYMENT_REFUNDED' : 'ADDITIONAL_PAYMENT_REFUND_REVIEW',
          refunded: refund.success,
          retryable: !refund.success && stored
        }, refund.success ? 409 : 500);
      }

      const failureMessage = `Payment was captured but registration finalization failed: ${clean(finalizeError.message).slice(0, 700)}`;
      await db.from('razorpay_orders').update({
        status: 'attempted',
        razorpay_payment_id: paymentId,
        refund_status: 'pending',
        refund_error: null,
        last_error: failureMessage,
        updated_at: new Date().toISOString()
      }).eq('id', order.id).neq('status', 'paid');

      const refund = await refundCapturedPayment(
        paymentId,
        orderId,
        Number(payment.amount),
        authHeader,
        Number(payment.amount_refunded || 0)
      );
      const stored = await persistRefundOutcome(db, orderForRefund, paymentId, failureMessage, refund);
      if (refund.success) {
        return respond({
          error: 'Payment was captured, but registration could not be completed. The payment was refunded; please start a new checkout.',
          code: 'REGISTRATION_FAILED_REFUNDED',
          refunded: true,
          refundId: refund.refundId || undefined
        }, 409);
      }
      return respond({
        error: `Payment was captured, but registration failed and the refund needs manual review. Contact the fest desk with payment ID ${paymentId}.`,
        code: 'REGISTRATION_FAILED_REFUND_REVIEW',
        refunded: false,
        retryable: stored
      }, 500);
    }

    await dispatchEmails(result, supabaseUrl, serviceRoleKey);
    return respond(removeDeliveryTokens(result) || { success: true, registrations: [] });
  } catch (error) {
    console.error('Razorpay verification failed:', error instanceof Error ? error.message : 'unknown error');
    return respond({ error: 'Unable to verify the Razorpay payment right now. If Razorpay shows a successful charge, the payment webhook will complete or refund the order.' }, 500);
  }
});
