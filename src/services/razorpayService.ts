import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { FestEvent, Registration } from '../types/festronix';

type RegistrationInput = Omit<Registration, 'id' | 'qrToken' | 'checkedIn'>;

interface RazorpayOrderResponse {
  success?: boolean;
  keyId?: string;
  orderId?: string;
  amount?: number;
  currency?: string;
  eventTitle?: string;
  error?: string;
}

interface RazorpayCheckoutResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  notes?: Record<string, string>;
  method?: 'card' | 'netbanking' | 'wallet' | 'upi' | 'emi';
  theme?: { color?: string; backdrop_color?: string };
  modal?: {
    ondismiss?: () => void;
    backdropclose?: boolean;
    escape?: boolean;
    confirm_close?: boolean;
  };
  handler: (response: RazorpayCheckoutResponse) => void | Promise<void>;
}

interface RazorpayInstance {
  open: () => void;
  on?: (event: 'payment.failed', handler: (response: { error?: { description?: string } }) => void) => void;
}

type RazorpayConstructor = new (options: RazorpayCheckoutOptions) => RazorpayInstance;

let razorpayScriptPromise: Promise<void> | null = null;

function loadRazorpayScript(): Promise<void> {
  if (typeof window === 'undefined') return Promise.reject(new Error('Razorpay checkout is only available in a browser.'));
  const browserWindow = window as Window & { Razorpay?: RazorpayConstructor };
  if (browserWindow.Razorpay) return Promise.resolve();
  if (razorpayScriptPromise) return razorpayScriptPromise;

  razorpayScriptPromise = new Promise<void>((resolve, reject) => {
    const existing = document.querySelector<HTMLScriptElement>('script[data-razorpay-checkout]');
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Razorpay Checkout could not be loaded.')), { once: true });
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.dataset.razorpayCheckout = 'true';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Razorpay Checkout could not be loaded.'));
    document.head.appendChild(script);
  }).catch(error => {
    razorpayScriptPromise = null;
    throw error;
  });

  return razorpayScriptPromise;
}

function registrationFromRazorpayPayload(payload: any, event: FestEvent): Registration {
  return {
    id: String(payload.id || ''),
    eventId: String(payload.eventId || event.id),
    eventTitle: String(payload.eventTitle || event.title),
    departmentCode: event.departmentCode,
    teamName: payload.teamName || undefined,
    teamCode: payload.teamCode || undefined,
    leaderName: String(payload.leaderName || ''),
    leaderEmail: String(payload.leaderEmail || ''),
    leaderPhone: String(payload.leaderPhone || ''),
    leaderCollege: String(payload.leaderCollege || ''),
    leaderRoll: String(payload.leaderRoll || ''),
    teammates: Array.isArray(payload.teammates) ? payload.teammates : [],
    format: payload.format || event.format,
    fee: Number(payload.fee ?? event.fee) || 0,
    source: 'online',
    registrationDate: payload.registrationDate || new Date().toISOString(),
    paymentStatus: payload.paymentStatus || 'verified',
    paymentMethod: payload.paymentMethod || 'razorpay',
    transactionId: payload.transactionId || undefined,
    razorpayOrderId: payload.razorpayOrderId || undefined,
    razorpayPaymentId: payload.razorpayPaymentId || undefined,
    emailDeliveryToken: payload.emailDeliveryToken || undefined,
    qrToken: String(payload.qrToken || ''),
    checkedIn: Boolean(payload.checkedIn)
  };
}

/**
 * Creates and verifies a Razorpay test-mode order. The browser only receives
 * the public Key ID; order creation, amount validation, signature verification,
 * and registration writes happen inside Supabase Edge Functions.
 */
export async function completeRazorpayCheckout(
  event: FestEvent,
  items: RegistrationInput[]
): Promise<Registration[]> {
  if (!isSupabaseConfigured()) throw new Error('Razorpay checkout requires the live Supabase backend.');
  if (items.length < 1) throw new Error('At least one registration is required for payment.');

  const { data: orderData, error: orderError } = await supabase.functions.invoke<RazorpayOrderResponse>('razorpay-create-order', {
    body: { eventId: event.id, items }
  });
  if (orderError) throw new Error(orderError.message || 'Unable to start Razorpay checkout.');
  if (!orderData?.success || !orderData.keyId || !orderData.orderId || !orderData.amount) {
    throw new Error(orderData?.error || 'Razorpay did not return a valid test order.');
  }

  await loadRazorpayScript();
  const browserWindow = window as Window & { Razorpay?: RazorpayConstructor };
  if (!browserWindow.Razorpay) throw new Error('Razorpay Checkout is unavailable. Please try again.');
  const Razorpay = browserWindow.Razorpay;
  const firstItem = items[0];

  return new Promise<Registration[]>((resolve, reject) => {
    let settled = false;
    const fail = (error: unknown) => {
      if (settled) return;
      settled = true;
      reject(error instanceof Error ? error : new Error('Razorpay payment was not completed.'));
    };
    const complete = (registrations: Registration[]) => {
      if (settled) return;
      settled = true;
      resolve(registrations);
    };

    const checkout = new Razorpay({
      key: orderData.keyId!,
      amount: orderData.amount!,
      currency: orderData.currency || 'INR',
      name: 'FESTRONIX 2026',
      description: event.title,
      order_id: orderData.orderId!,
      prefill: {
        name: firstItem.leaderName,
        email: firstItem.leaderEmail,
        contact: firstItem.leaderPhone
      },
      method: 'upi',
      notes: { mode: 'test' },
      theme: {
        color: '#38BDF8',
        backdrop_color: '#080C16'
      },
      modal: {
        backdropclose: false,
        escape: true,
        confirm_close: true,
        ondismiss: () => fail(new Error('Razorpay checkout was cancelled.'))
      },
      handler: async response => {
        try {
          const { data, error } = await supabase.functions.invoke<{ success?: boolean; error?: string; registrations?: any[] }>('razorpay-verify-payment', {
            body: response
          });
          if (error) throw new Error(error.message || 'Unable to verify the Razorpay payment.');
          if (!data?.success) throw new Error(data?.error || 'Razorpay payment verification failed.');
          const registrations = Array.isArray(data.registrations)
            ? data.registrations.map(payload => registrationFromRazorpayPayload(payload, event))
            : [];
          if (registrations.length !== items.length) throw new Error('Payment was verified, but the server did not return every registration pass.');
          complete(registrations);
        } catch (error) {
          fail(error);
        }
      }
    });

    checkout.on?.('payment.failed', (response: { error?: { description?: string } }) => {
      fail(new Error(response?.error?.description || 'Razorpay could not complete the test payment.'));
    });

    try {
      checkout.open();
    } catch (error) {
      fail(error);
    }
  });
}
