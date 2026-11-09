import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

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

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405);

  const keyId = clean(Deno.env.get('RAZORPAY_KEY_ID'));
  const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET') || '';
  if (!keyId || !keySecret) return respond({ error: 'Razorpay test credentials are not configured on the backend.' }, 503);
  if (!keyId.startsWith('rzp_test_')) return respond({ error: 'Only Razorpay test-mode keys are enabled in this environment.' }, 503);

  try {
    const body = await request.json().catch(() => ({}));
    const orderId = clean(body.razorpay_order_id);
    const paymentId = clean(body.razorpay_payment_id);
    const signature = clean(body.razorpay_signature).toLowerCase();
    if (!orderId || !paymentId || !signature) return respond({ error: 'Razorpay checkout verification data is incomplete.' }, 400);

    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const { data: order, error: orderError } = await db.from('razorpay_orders')
      .select('id, razorpay_order_id, amount_paise, currency, status, result_payload')
      .eq('razorpay_order_id', orderId)
      .maybeSingle();
    if (orderError || !order) return respond({ error: 'The payment order could not be found.' }, 404);
    if (order.status === 'paid' && order.result_payload) return respond(order.result_payload);

    const expectedSignature = await createSignature(orderId, paymentId, keySecret);
    if (!signaturesMatch(expectedSignature, signature)) {
      await db.from('razorpay_orders').update({ status: 'attempted', last_error: 'Invalid Razorpay signature.', updated_at: new Date().toISOString() }).eq('id', order.id);
      return respond({ error: 'Razorpay signature verification failed.' }, 400);
    }

    const authHeader = { Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}` };

    // The payment resource already contains the order ID, amount, currency,
    // and capture state. One server-side Razorpay request is enough to verify
    // all of those values; the previous extra order request added avoidable
    // latency to the post-checkout pass handoff.
    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, { headers: authHeader });
    const payment = await paymentResponse.json().catch(() => ({}));
    if (!paymentResponse.ok || payment.order_id !== orderId || Number(payment.amount) !== Number(order.amount_paise) || payment.currency !== order.currency || payment.status !== 'captured') {
      await db.from('razorpay_orders').update({ status: 'attempted', last_error: 'Razorpay payment capture was not confirmed.', updated_at: new Date().toISOString() }).eq('id', order.id);
      return respond({ error: 'The payment was authorized but is not captured yet. Please try again shortly.' }, 409);
    }

    const { data: result, error: finalizeError } = await db.rpc('finalize_razorpay_order', {
      p_razorpay_order_id: orderId,
      p_razorpay_payment_id: paymentId
    });
    if (finalizeError) {
      console.error('Razorpay registration finalization failed:', finalizeError.message);
      return respond({ error: 'Payment was verified, but the registration could not be finalized safely. Please contact the fest desk with your payment ID.' }, 500);
    }
    return respond(result || { success: true, registrations: [] });
  } catch (error) {
    console.error('Razorpay verification failed:', error instanceof Error ? error.message : 'unknown error');
    return respond({ error: 'Unable to verify the Razorpay payment right now.' }, 500);
  }
});
