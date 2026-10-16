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
  }
});

