import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Registration } from '../types/festronix';

export interface RegistrationEmailResult {
  sent: boolean;
  message: string;
}

export async function sendRegistrationPassEmail(registration: Registration): Promise<RegistrationEmailResult> {
  if (!isSupabaseConfigured()) {
    return { sent: false, message: 'Email delivery is unavailable in offline development mode.' };
  }
  if (!registration.emailDeliveryToken) {
    return { sent: false, message: 'The registration was created, but no email delivery token was returned.' };
  }

  const { data, error } = await supabase.functions.invoke('send-registration-pass', {
    body: { deliveryToken: registration.emailDeliveryToken }
  });
  if (error) return { sent: false, message: error.message || 'The pass email could not be sent.' };
  return {
    sent: Boolean((data as { sent?: boolean } | null)?.sent),
    message: String((data as { message?: string } | null)?.message || 'The pass email could not be sent.')
  };
}
