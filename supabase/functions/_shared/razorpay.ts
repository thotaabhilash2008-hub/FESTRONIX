export type RefundResult = {
  success: boolean;
  refundId?: string;
  error?: string;
  alreadyRefunded?: boolean;
};

const clean = (value: unknown) => String(value ?? '').trim();

export type RazorpayMode = 'test' | 'live';

export function resolveRazorpayMode(keyId: string, configuredMode: string | null | undefined): RazorpayMode | null {
  const normalizedMode = clean(configuredMode).toLowerCase();
  if (normalizedMode && normalizedMode !== 'test' && normalizedMode !== 'live') return null;

  const keyMode: RazorpayMode | null = keyId.startsWith('rzp_live_')
    ? 'live'
    : keyId.startsWith('rzp_test_')
      ? 'test'
      : null;
  if (!keyMode || (normalizedMode && normalizedMode !== keyMode)) return null;
  return keyMode;
}

export async function refundCapturedPayment(
  paymentId: string,
  orderId: string,
  amountPaise: number,
  authHeader: Record<string, string>,
  amountAlreadyRefundedPaise = 0
): Promise<RefundResult> {
  if (!Number.isSafeInteger(amountPaise) || amountPaise <= 0) {
    return { success: false, error: 'The captured payment amount is invalid for a refund.' };
  }
  const alreadyRefunded = Math.max(0, Number(amountAlreadyRefundedPaise) || 0);
  const remainingRefundPaise = Math.max(0, amountPaise - alreadyRefunded);
  if (remainingRefundPaise === 0) return { success: true, alreadyRefunded: true };

  let response: Response;
  try {
    response = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}/refunds`, {
      method: 'POST',
      headers: { ...authHeader, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: remainingRefundPaise,
        receipt: `FEST-${orderId}`.slice(0, 40),
        notes: { reason: 'registration_finalization_failed', razorpay_order_id: orderId }
      })
    });
  } catch {
    return { success: false, error: 'Razorpay refund request could not reach the payment gateway.' };
  }

  const body = await response.json().catch(() => ({}));
  if (response.ok && body.id) return { success: true, refundId: clean(body.id) };

  // A concurrent verifier or webhook may have completed the refund first.
  try {
    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: authHeader
    });
    const payment = await paymentResponse.json().catch(() => ({}));
    if (paymentResponse.ok && Number(payment.amount_refunded || 0) >= amountPaise) {
      return { success: true, alreadyRefunded: true };
    }
  } catch {
    // Keep the original refund error for the admin refund-review screen.
  }

  return {
    success: false,
    error: clean(body?.error?.description || body?.error?.reason || 'Razorpay refund could not be created.')
  };
}

export async function sendPassEmails(
  registrations: unknown,
  supabaseUrl: string,
  serviceRoleKey: string,
  razorpayOrderId?: string
): Promise<void> {
  const tokens = Array.isArray(registrations) ? registrations
    .map(item => item && typeof item === 'object' ? clean((item as Record<string, unknown>).emailDeliveryToken) : '')
    .filter(token => /^[a-f0-9]{64}$/i.test(token)) : [];

  // Team checkout results contain the leader registration. Teammate passes
  // are created by a database trigger, so load their delivery tokens by order.
  if (razorpayOrderId) {
    try {
      const response = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/rest/v1/rpc/razorpay_order_email_delivery_tokens`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ p_razorpay_order_id: razorpayOrderId })
      });
      const result = await response.json().catch(() => null);
      if (response.ok && Array.isArray(result)) {
        tokens.push(...result.filter((token): token is string => typeof token === 'string' && /^[a-f0-9]{64}$/i.test(token)));
      } else {
        console.error('Unable to load all pass email deliveries for the paid order:', response.status);
      }
    } catch (error) {
      console.error('Unable to load all pass email deliveries for the paid order:', error instanceof Error ? error.message : 'unknown error');
    }
  }

  const uniqueTokens = [...new Set(tokens)];
  if (uniqueTokens.length === 0) return;

  await Promise.all(uniqueTokens.map(async deliveryToken => {
    try {
      const response = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/functions/v1/send-registration-pass`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${serviceRoleKey}`,
          apikey: serviceRoleKey,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ deliveryToken })
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || result?.sent === false) console.error('Pass email dispatch did not complete:', response.status);
    } catch (error) {
      console.error('Pass email dispatch failed:', error instanceof Error ? error.message : 'unknown error');
    }
  }));
}
