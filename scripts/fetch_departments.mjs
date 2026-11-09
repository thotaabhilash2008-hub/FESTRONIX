import { createClient } from '@supabase/supabase-js';
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://fbvztmttixmmqorvqtbb.supabase.co';
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseAnonKey);
(async () => {
  const { data, error } = await supabase.from('departments').select('code, chief_coordinator, contact');
  if (error) {
    console.error('Error fetching departments:', error);
    process.exit(1);
  }
  console.log(JSON.stringify(data, null, 2));
})();

