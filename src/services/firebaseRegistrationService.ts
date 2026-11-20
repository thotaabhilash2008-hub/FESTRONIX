import type { Registration } from '../types/festronix';
import { firebaseApp } from '../lib/firebase';
import { callFirebaseCallable } from './firebaseFunctionClient';

function createRequestId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') return crypto.randomUUID();
  if (typeof crypto === 'undefined' || typeof crypto.getRandomValues !== 'function') {
    throw new Error('Secure registration IDs are unavailable in this browser. Open the site over HTTPS and retry.');
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, value => value.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export const FirebaseRegistrationService = {
  async createFreeRegistrations(batch: Array<Omit<Registration, 'id' | 'qrToken' | 'checkedIn'>>): Promise<Registration[]> {
    if (!firebaseApp) throw new Error('Firebase registration services are not configured.');
    if (!batch.length) return [];
    if (batch.length > 10) throw new Error('You can create at most 10 passes in one order.');
    if (batch.some(item => Number(item.fee) !== 0)) throw new Error('Paid registrations must go through Razorpay checkout.');

    const result = await callFirebaseCallable<{ success: boolean; registrations?: Array<Record<string, unknown>> }>('createFreeRegistrations', {
      requestId: createRequestId(),
      eventId: batch[0].eventId,
      items: batch.map(item => ({
        eventId: item.eventId,
        buyerRoll: item.buyerRoll || item.leaderRoll,
        leaderName: item.leaderName,
        leaderEmail: item.leaderEmail,
        leaderPhone: item.leaderPhone,
        leaderCollege: item.leaderCollege,
        leaderRoll: item.leaderRoll,
        format: item.format,
        teammates: item.teammates || [],
        teamName: item.teamName,
        teamCode: item.teamCode,
      })),
    });

    const payloads = Array.isArray(result.registrations) ? result.registrations : [];
    if (!result.success || payloads.length === 0) throw new Error('Firebase did not return the created passes. Check My Passes before retrying.');
    return payloads.map((payload, index) => {
      const source = batch[Math.min(index, batch.length - 1)];
      return {
        ...source,
        id: String(payload.id || ''),
        userId: undefined,
        eventId: String(payload.eventId || source.eventId),
        eventTitle: String(payload.eventTitle || source.eventTitle),
        departmentCode: String(payload.departmentCode || source.departmentCode || ''),
        leaderName: String(payload.leaderName || source.leaderName),
        leaderEmail: String(payload.leaderEmail || source.leaderEmail),
        leaderPhone: String(payload.leaderPhone || source.leaderPhone),
        leaderCollege: String(payload.leaderCollege || source.leaderCollege),
        leaderRoll: String(payload.leaderRoll || source.leaderRoll),
        teamName: typeof payload.teamName === 'string' ? payload.teamName : source.teamName,
        teamCode: typeof payload.teamCode === 'string' ? payload.teamCode : source.teamCode,
        format: (payload.format || source.format) as Registration['format'],
        fee: Number(payload.fee) || 0,
        source: 'online',
        paymentStatus: 'not_applicable',
        paymentMethod: 'none',
        transactionId: undefined,
        razorpayOrderId: undefined,
        razorpayPaymentId: undefined,
        emailDeliveryToken: typeof payload.emailDeliveryToken === 'string' ? payload.emailDeliveryToken : undefined,
        qrToken: String(payload.qrToken || ''),
        checkedIn: false,
        registrationDate: String(payload.registrationDate || new Date().toISOString()),
        teammates: Array.isArray(payload.teammates) ? payload.teammates as Registration['teammates'] : source.teammates,
      };
    });
  },
};
