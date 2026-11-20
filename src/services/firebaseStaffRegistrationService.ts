import type { Registration } from '../types/festronix';
import { firebaseApp } from '../lib/firebase';
import { callFirebaseCallable } from './firebaseFunctionClient';

async function call<TResponse>(name: string, data: Record<string, unknown>): Promise<TResponse> {
  if (!firebaseApp) throw new Error('Firebase is not configured for this environment.');
  try {
    return await callFirebaseCallable<TResponse>(name, data);
  } catch (error) {
    const code = error && typeof error === 'object' && 'code' in error ? String(error.code) : '';
    const message = error instanceof Error ? error.message : 'The Firebase registration operation failed.';
    if (code.includes('unauthenticated')) throw new Error('Your staff session has expired. Sign in again.');
    if (code.includes('permission-denied')) throw new Error('Your staff role cannot access these registrations.');
    if (code.includes('resource-exhausted') || code.includes('failed-precondition') || code.includes('invalid-argument')) {
      throw new Error(message);
    }
    throw new Error('Firebase could not complete the registration operation. Please retry.');
  }
}

export const FirebaseStaffRegistrationService = {
  async createSpot(registration: Omit<Registration, 'id' | 'qrToken' | 'checkedIn'>): Promise<Registration> {
    const result = await call<{ registration: Registration }>('createStaffSpotRegistration', { registration });
    if (!result.registration?.id || !result.registration.qrToken) {
      throw new Error('Firebase did not return a valid spot pass. Check the pass list before retrying.');
    }
    return result.registration;
  },

  async list(eventIds?: string[]): Promise<Registration[]> {
    const result = await call<{ registrations: Registration[] }>('listStaffRegistrations', eventIds ? { eventIds } : {});
    return Array.isArray(result.registrations) ? result.registrations : [];
  },

  async reviewPayment(
    registrationId: string,
    status: 'verified' | 'rejected',
    rejectionReason?: string,
  ): Promise<{ success: boolean; verifiedBy?: string; verifiedAt?: string }> {
    return call('reviewStaffRegistrationPayment', { registrationId, status, rejectionReason });
  },

  async refundOrders(): Promise<Array<Record<string, unknown>>> {
    const result = await call<{ orders: Array<Record<string, unknown>> }>('listStaffRazorpayRefundOrders', {});
    return Array.isArray(result.orders) ? result.orders : [];
  },

  async checkIn(query: string, staffName: string) {
    return call<{
      success: boolean;
      status: 'VALID' | 'ALREADY_CHECKED_IN' | 'NOT_FOUND' | 'PAYMENT_PENDING';
      registration?: Registration;
      message: string;
    }>('checkInStaffRegistration', { query, staffName });
  },

  async toggleCheckIn(query: string, staffName: string): Promise<{ success: boolean; checkedIn: boolean }> {
    return call('toggleStaffCheckIn', { query, staffName });
  },
};
