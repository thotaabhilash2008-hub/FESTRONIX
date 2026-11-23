import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const rawUrl = import.meta.env.VITE_SUPABASE_URL || '';
const rawKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = (): boolean => {
  return (
    Boolean(rawUrl) &&
    Boolean(rawKey) &&
    !rawUrl.includes('YOUR_PROJECT_ID') &&
    !rawKey.includes('your-anon-key')
  );
};

const supabaseUrl = isSupabaseConfigured() ? rawUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = isSupabaseConfigured() ? rawKey : 'placeholder-anon-key';
const SUPABASE_REQUEST_TIMEOUT_MS = 15000;

const fetchWithTimeout: typeof fetch = async (input, init) => {
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), SUPABASE_REQUEST_TIMEOUT_MS);
  const relayAbort = () => controller.abort();

  if (init?.signal) {
    if (init.signal.aborted) controller.abort();
    else init.signal.addEventListener('abort', relayAbort, { once: true });
  }

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    window.clearTimeout(timeoutId);
    init?.signal?.removeEventListener('abort', relayAbort);
  }
};

if (!isSupabaseConfigured()) {
  console.warn(
    'Festronix: Supabase credentials are not configured or are placeholders in .env. ' +
    'The app is running in offline/localStorage compatibility mode. ' +
    'Set valid VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to connect to your live database.'
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    fetch: fetchWithTimeout
  }
});

