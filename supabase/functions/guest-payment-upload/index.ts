import { createClient } from 'npm:@supabase/supabase-js@2.118.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' }
});

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405);

  try {
    const form = await request.formData();
    const file = form.get('file');
    const email = String(form.get('email') || '').trim().toLowerCase();
    if (!(file instanceof File)) return respond({ error: 'Payment screenshot is required.' }, 400);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return respond({ error: 'A valid email address is required.' }, 400);
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) return respond({ error: 'Upload a JPEG, PNG, or WebP image.' }, 400);
    if (file.size > 5 * 1024 * 1024) return respond({ error: 'Payment proof must be 5 MB or smaller.' }, 400);

    const db = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    const extension = file.type === 'image/jpeg' ? 'jpg' : file.type.split('/')[1];
    const path = `guest/${crypto.randomUUID()}.${extension}`;
    const { error } = await db.storage.from('payment-screenshots').upload(path, file, {
      contentType: file.type,
      cacheControl: '3600',
      upsert: false
    });
    if (error) return respond({ error: `Unable to upload payment proof: ${error.message}` }, 400);
    return respond({ success: true, path });
  } catch (error) {
    return respond({ error: error instanceof Error ? error.message : 'Unable to upload payment proof.' }, 400);
  }
});
