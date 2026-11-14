import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { FestEvent, Registration } from '../types/festronix';
import { StorageService } from './storageService';

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

/**
 * Supabase wraps a non-2xx Edge Function response in a FunctionsHttpError and
 * keeps the useful JSON error in `context`. Preserve that message so a guest
 * sees the actionable backend result instead of the generic SDK text.
 */
async function getEdgeFunctionErrorMessage(error: unknown, fallback: string): Promise<string> {
  if (error && typeof error === 'object') {
    const context = (error as { context?: unknown }).context;
    if (context && typeof context === 'object') {
      const response = context as {
        clone?: () => { json?: () => Promise<unknown>; text?: () => Promise<string> };
        json?: () => Promise<unknown>;
        text?: () => Promise<string>;
      };
      const bodySource = typeof response.clone === 'function' ? response.clone() : response;
      if (typeof bodySource.json === 'function') {
        try {
          const body = await bodySource.json();
          if (body && typeof body === 'object' && 'error' in body) {
            const message = String((body as { error?: unknown }).error || '').trim();
            if (message) return message;
          }
        } catch {
          // Some proxies return plain text. Try the response text below.
        }
      }
      if (typeof response.text === 'function') {
        try {
          const text = (await response.text()).trim();
          if (text) return text;
        } catch {
          // Fall through to the typed Error message/fallback.
        }
      }
    }
  }

  const message = error instanceof Error ? error.message.trim() : '';
  if (message && !/^edge function returned a non-2xx status code$/i.test(message)) return message;
  return fallback;
}

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
  return completeRazorpayBatchCheckout([event], items);
}

/**
 * Creates one Razorpay order for a cart that can contain passes from more
 * than one individual event. The order payload is kept on the server and the
 * verification function finalizes every pass atomically after Razorpay
 * confirms the captured payment.
 */
export async function completeRazorpayBatchCheckout(
  events: FestEvent[],
  items: RegistrationInput[]
): Promise<Registration[]> {
  if (!isSupabaseConfigured()) {
    const created = await StorageService.addMultipleRegistrations(
      items.map(item => ({
        ...item,
        paymentStatus: 'verified',
        paymentMethod: 'razorpay',
        transactionId: `TEST-PAY-${Date.now()}`
      }))
    );
    return created;
  }
  if (items.length < 1) throw new Error('At least one registration is required for payment.');
  if (events.length < 1) throw new Error('At least one event is required for payment.');

  const eventById = new Map(events.map(event => [event.id, event]));
  const primaryEvent = events[0];
  const unknownEvent = items.find(item => !eventById.has(item.eventId));
  if (unknownEvent) throw new Error('One or more selected events could not be validated. Please refresh and try again.');

  const { data: orderData, error: orderError } = await supabase.functions.invoke<RazorpayOrderResponse>('razorpay-create-order', {
    body: { eventId: primaryEvent.id, items }
  });
  if (orderError) throw new Error(await getEdgeFunctionErrorMessage(orderError, 'Unable to start Razorpay checkout.'));
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
      description: events.length === 1 ? primaryEvent.title : `${items.length} FESTRONIX event passes`,
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
          if (error) throw new Error(await getEdgeFunctionErrorMessage(error, 'Unable to verify the Razorpay payment.'));
          if (!data?.success) throw new Error(data?.error || 'Razorpay payment verification failed.');
          const registrations = Array.isArray(data.registrations)
            ? data.registrations.map(payload => registrationFromRazorpayPayload(
              payload,
              eventById.get(String(payload.eventId || '')) || primaryEvent
            ))
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
