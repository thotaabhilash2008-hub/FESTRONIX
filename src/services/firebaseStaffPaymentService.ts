import { firebaseApp } from '../lib/firebase';
import { callFirebaseCallable } from './firebaseFunctionClient';

export interface StaffPaymentOrderItem {
  eventId: string;
  eventTitle: string;
  departmentCode: string;
  registrationId: string;
  displayId: string;
  fee: number;
}

export interface StaffPaymentOrder {
  id: string;
  orderId: string;
  paymentId?: string;
  isManualAdjustment?: boolean;
  amountPaise: number;
  status: string;
  refundStatus: string;
  eventId: string;
  eventTitle: string;
  items: StaffPaymentOrderItem[];
  registrationIds: string[];
  createdAt: string;
  updatedAt: string;
}

interface ListPaymentOrdersResponse {
  orders: StaffPaymentOrder[];
}

export interface DailyPaymentCollection {
  date: string;
  label: string;
  amountRupees: number;
  orders: number;
}

export const FirebaseStaffPaymentService = {
  async list(): Promise<StaffPaymentOrder[]> {
    if (!firebaseApp) throw new Error('Firebase is not configured for this environment.');
    const response = await callFirebaseCallable<ListPaymentOrdersResponse>('listStaffPaymentOrders', {});
    return Array.isArray(response.orders) ? response.orders : [];
  },
};

/** Razorpay-matching revenue: successful, non-refunded captured orders only. */
export function paidOrderTotalPaise(orders: StaffPaymentOrder[]): number {
  return orders
    .filter(order => order.status === 'paid' && order.refundStatus !== 'succeeded' && !order.isManualAdjustment)
    .reduce((total, order) => total + (Number(order.amountPaise) || 0), 0);
}

function istDayKey(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);
  const part = (type: string) => parts.find(item => item.type === type)?.value || '';
  return `${part('year')}-${part('month')}-${part('day')}`;
}

/** Day-wise Razorpay collections in IST, using paid non-refunded orders only. */
export function dailyPaidOrderCollections(orders: StaffPaymentOrder[]): DailyPaymentCollection[] {
  const byDay = new Map<string, { amountPaise: number; orders: number }>();

  orders
    .filter(order => order.status === 'paid' && order.refundStatus !== 'succeeded' && !order.isManualAdjustment)
    .forEach(order => {
      const key = istDayKey(order.createdAt);
      const amount = Number(order.amountPaise) || 0;
      if (!key || amount <= 0) return;
      const current = byDay.get(key) || { amountPaise: 0, orders: 0 };
      byDay.set(key, { amountPaise: current.amountPaise + amount, orders: current.orders + 1 });
    });

  const activeKeys = [...byDay.keys()].sort();
  if (activeKeys.length === 0) return [];

  const firstDay = Date.parse(`${activeKeys[0]}T00:00:00Z`);
  const lastDay = Date.parse(`${activeKeys[activeKeys.length - 1]}T00:00:00Z`);
  const span = Math.round((lastDay - firstDay) / 86_400_000) + 1;
  const keys: string[] = [];

  // Fill quiet days so gaps are visible, but avoid a giant axis for old test data.
  if (span > 0 && span <= 45) {
    const cursor = new Date(firstDay);
    for (let index = 0; index < span; index += 1) {
      keys.push(cursor.toISOString().slice(0, 10));
      cursor.setUTCDate(cursor.getUTCDate() + 1);
    }
  } else {
    keys.push(...activeKeys);
  }

  return keys.map(key => {
    const entry = byDay.get(key);
    return {
      date: key,
      label: new Date(`${key}T12:00:00Z`).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        timeZone: 'UTC',
      }),
      amountRupees: Math.round((entry?.amountPaise || 0) / 100),
      orders: entry?.orders || 0,
    };
  });
}

export function paidOrderTotalForDepartmentPaise(orders: StaffPaymentOrder[], departmentCode: string): number {
  const department = String(departmentCode || '').trim().toUpperCase();
  return orders
    .filter(order => order.status === 'paid' && order.refundStatus !== 'succeeded' && !order.isManualAdjustment)
    .filter(order => order.items.some(item => String(item.departmentCode || '').trim().toUpperCase() === department))
    .reduce((total, order) => total + (Number(order.amountPaise) || 0), 0);
}

/** Razorpay-matching revenue for one event, split across items of a multi-event order. */
export function paidOrderTotalForEventPaise(orders: StaffPaymentOrder[], eventId: string): number {
  const targetEventId = String(eventId || '').trim();
  if (!targetEventId) return 0;
  return orders
    .filter(order => order.status === 'paid' && order.refundStatus !== 'succeeded' && !order.isManualAdjustment)
    .reduce((total, order) => {
      const matchedItems = order.items.filter(item => String(item.eventId || '').trim() === targetEventId);
      if (matchedItems.length === 0) {
        return String(order.eventId || '').trim() === targetEventId
          ? total + (Number(order.amountPaise) || 0)
          : total;
      }
      const allFees = order.items.reduce((sum, item) => sum + Math.max(0, Number(item.fee) || 0), 0);
      const matchedFees = matchedItems.reduce((sum, item) => sum + Math.max(0, Number(item.fee) || 0), 0);
      const share = allFees > 0 ? matchedFees / allFees : 1;
      return total + Math.round((Number(order.amountPaise) || 0) * share);
    }, 0);
}
