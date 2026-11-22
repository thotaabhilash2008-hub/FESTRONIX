import { firebaseApp, isFirebaseConfigured } from '../lib/firebase';
import { Registration } from '../types/festronix';
import { callFirebaseHttp } from './firebaseFunctionClient';

export interface RegistrationEmailResult {
  sent: boolean;
  message: string;
}

export async function sendRegistrationPassEmail(registration: Registration): Promise<RegistrationEmailResult> {
  if (!isFirebaseConfigured || !firebaseApp?.options.projectId) {
    return { sent: false, message: 'Firebase email delivery is not configured for this website.' };
  }
  if (!registration.leaderEmail?.trim()) {
    return { sent: false, message: 'No attendee email was provided; the pass remains available on the website.' };
  }
  // Paid pass emails are dispatched by the backend only after Razorpay capture
  // verification. Never let a client-side call send one early or twice.
  if (registration.paymentMethod === 'razorpay' || registration.paymentStatus === 'verification_pending') {
    return { sent: false, message: 'Paid pass emails are sent after Razorpay confirmation.' };
  }

  try {
    const operation = registration.emailDeliveryToken
      ? 'sendRegistrationPassEmail'
      : 'resendRegistrationPassEmail';
    const body = registration.emailDeliveryToken
      ? { deliveryToken: registration.emailDeliveryToken }
      : { registrationId: registration.id, email: registration.leaderEmail };
    const result = await callFirebaseHttp<{ sent?: boolean; message?: string; error?: string }>(operation, body);
    return { sent: Boolean(result.sent), message: String(result.message || result.error || 'The pass email could not be sent.') };
  } catch (error) {
    return {
      sent: false,
      message: error instanceof Error ? error.message : 'The pass email could not be sent.',
    };
  }
}

export async function resendRegistrationPassEmail(registrationId: string, email: string): Promise<RegistrationEmailResult> {
  if (!isFirebaseConfigured || !firebaseApp?.options.projectId) {
    return { sent: false, message: 'Firebase email delivery is not configured for this website.' };
  }
  try {
    const result = await callFirebaseHttp<{ sent?: boolean; message?: string; error?: string }>(
      'resendRegistrationPassEmail', { registrationId, email },
    );
    return { sent: Boolean(result.sent), message: String(result.message || result.error || 'The pass email could not be sent.') };
  } catch (error) {
    return {
      sent: false,
      message: error instanceof Error ? error.message : 'The pass email could not be sent.',
    };
  }
}
