import type { Registration } from '../types/festronix';

/** Actual captured amount wins over the displayed fee (events can be repriced after payment). */
export function registrationRevenueAmount(registration: Registration): number {
  const paidPaise = Number(registration.paidAmountPaise) || 0;
  if (paidPaise > 0) return paidPaise / 100;
  return Number(registration.fee) || 0;
}

function sumRevenueForStatuses(registrations: Registration[], statuses: string[]): number {
  const byOrder = new Map<string, number>();
  for (const registration of registrations) {
    if (!statuses.includes(registration.paymentStatus)) continue;
    const amount = registrationRevenueAmount(registration);
    if (amount <= 0) continue;
    const key = registration.razorpayOrderId || registration.transactionId || `registration:${registration.id}`;
    byOrder.set(key, Math.max(byOrder.get(key) || 0, amount));
  }
  let total = 0;
  for (const amount of byOrder.values()) total += amount;
  return total;
}

/** Revenue from registration rows without double-counting team orders. */
export function sumVerifiedRegistrationRevenue(registrations: Registration[]): number {
  return sumRevenueForStatuses(registrations, ['verified']);
}

/** Pending review value, also counted once per Razorpay order. */
export function sumPendingRegistrationRevenue(registrations: Registration[]): number {
  return sumRevenueForStatuses(registrations, ['verification_pending']);
}

/** Stable key used to deduplicate participant rows belonging to one order. */
export function registrationRevenueKey(registration: Registration): string {
  return registration.razorpayOrderId || registration.transactionId || `registration:${registration.id}`;
}
