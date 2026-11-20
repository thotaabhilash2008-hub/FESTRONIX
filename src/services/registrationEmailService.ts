import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { firebaseApp, isFirebaseConfigured } from '../lib/firebase';
import { Registration } from '../types/festronix';
import { callFirebaseHttp } from './firebaseFunctionClient';

export interface RegistrationEmailResult {
  sent: boolean;
  message: string;
}

export async function sendRegistrationPassEmail(registration: Registration): Promise<RegistrationEmailResult> {
  if (!isFirebaseConfigured && !isSupabaseConfigured()) {
    return { sent: false, message: 'Email delivery is unavailable in offline development mode.' };
  }
  if (!registration.emailDeliveryToken) {
    return isFirebaseConfigured
      ? { sent: true, message: 'The Firebase payment service sends pass emails automatically.' }
      : { sent: false, message: 'The registration was created, but no email delivery token was returned.' };
  }

  if (isFirebaseConfigured && firebaseApp?.options.projectId) {
    const result = await callFirebaseHttp<{ sent?: boolean; message?: string; error?: string }>(
      'sendRegistrationPassEmail', { deliveryToken: registration.emailDeliveryToken },
    );
    return { sent: Boolean(result.sent), message: String(result.message || result.error || 'The pass email could not be sent.') };
  }

  const { data, error } = await supabase.functions.invoke('send-registration-pass', {
    body: { deliveryToken: registration.emailDeliveryToken }
  });
  if (error) return { sent: false, message: error.message || 'The pass email could not be sent.' };
  const response = data as { sent?: boolean; message?: string; error?: string } | null;
  return {
    sent: Boolean(response?.sent),
    message: String(response?.message || response?.error || 'The pass email could not be sent.')
  };
}
