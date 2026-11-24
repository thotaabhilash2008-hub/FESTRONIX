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
    .filter(order => order.status === 'paid' && order.refundStatus !== 'succeeded')
    .reduce((total, order) => total + (Number(order.amountPaise) || 0), 0);
}

export function paidOrderTotalForDepartmentPaise(orders: StaffPaymentOrder[], departmentCode: string): number {
  const department = String(departmentCode || '').trim().toUpperCase();
  return orders
    .filter(order => order.status === 'paid' && order.refundStatus !== 'succeeded')
    .filter(order => order.items.some(item => String(item.departmentCode || '').trim().toUpperCase() === department))
    .reduce((total, order) => total + (Number(order.amountPaise) || 0), 0);
}

/** Razorpay-matching revenue for one event, split across items of a multi-event order. */
export function paidOrderTotalForEventPaise(orders: StaffPaymentOrder[], eventId: string): number {
  const targetEventId = String(eventId || '').trim();
  if (!targetEventId) return 0;
  return orders
    .filter(order => order.status === 'paid' && order.refundStatus !== 'succeeded')
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
