import type { SupabaseClient } from '@supabase/supabase-js';
import { isFirebaseConfigured } from './firebase';

/**
 * Firebase is the sole runtime store. Supabase is kept only as an optional,
 * read-only legacy recovery source for manual incident scripts; the browser
 * application must never connect to it. Any accidental invocation fails
 * locally instead of making a network request.
 */
const rejectSupabaseCall = () => {
  throw new Error('Supabase has been disabled. Configure the Firebase backend and use its service adapter.');
};

const disabledClient = new Proxy(rejectSupabaseCall, {
  get: () => disabledClient,
  apply: rejectSupabaseCall,
});

// `any` keeps transitional guarded call sites type-checking without shipping
// a client capable of issuing HTTP requests.
export const supabase = disabledClient as unknown as SupabaseClient;
export const isSupabaseConfigured = (): boolean => false;

if (!isFirebaseConfigured && import.meta.env.DEV) {
  console.warn('Festronix: Firebase is not configured. Local development data is active; Supabase is disabled.');
}
