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

function escapeHtml(value: unknown): string {
  return String(value ?? '').replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char] || char));
}

Deno.serve(async request => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return respond({ error: 'Method not allowed.' }, 405);

  const token = String((await request.json().catch(() => ({}))).deliveryToken || '').trim();
  if (!/^[a-f0-9]{64}$/i.test(token)) return respond({ error: 'Invalid delivery token.' }, 400);

  const db = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const { data: delivery, error: deliveryError } = await db
    .from('registration_email_deliveries')
    .select('id, registration_id, recipient_email, status, attempts')
    .eq('delivery_token', token)
    .maybeSingle();
  if (deliveryError || !delivery) return respond({ error: 'Registration email delivery was not found.' }, 404);
  if (delivery.status === 'sent') return respond({ sent: true, message: 'The pass email was already sent.' });

  const { data: registration, error: registrationError } = await db
    .from('registrations')
    .select('display_id, event_title, leader_name, leader_email, leader_roll, leader_college, fee, payment_status, transaction_id, team_name, team_code, created_at')
    .eq('id', delivery.registration_id)
    .single();
  if (registrationError || !registration) return respond({ error: 'The registration record was not found.' }, 404);

  const resendKey = Deno.env.get('RESEND_API_KEY');
  const from = Deno.env.get('REGISTRATION_MAIL_FROM') || 'FESTRONIX Registrations <onboarding@resend.dev>';
  if (!resendKey) {
    await db.from('registration_email_deliveries').update({ status: 'failed', attempts: delivery.attempts + 1, last_error: 'RESEND_API_KEY is not configured.', updated_at: new Date().toISOString() }).eq('id', delivery.id);
    return respond({ sent: false, error: 'Email provider is not configured on the backend yet.' }, 503);
  }

  await db.from('registration_email_deliveries').update({ status: 'sending', attempts: delivery.attempts + 1, updated_at: new Date().toISOString() }).eq('id', delivery.id);
  const passId = escapeHtml(registration.display_id);
  const eventTitle = escapeHtml(registration.event_title);
  const participant = escapeHtml(registration.leader_name);
  const status = escapeHtml(registration.payment_status === 'not_applicable' ? 'PASS ACTIVE — NO PAYMENT REQUIRED' : `PAYMENT ${String(registration.payment_status).toUpperCase().replace('_', ' ')}`);
  const text = `FESTRONIX 2026 registration confirmed\n\nParticipant: ${registration.leader_name}\nEvent: ${registration.event_title}\nRegistration ID: ${registration.display_id}\nPass status: ${status}\nQR token: Available in the FESTRONIX Passes portal after verification.`;
  const html = `<div style="font-family:Arial,sans-serif;color:#142042;max-width:640px;margin:auto"><h1 style="color:#283b78">FESTRONIX 2026 Registration Pass</h1><p>Hello ${participant}, your registration has been recorded successfully.</p><table cellpadding="8" style="border-collapse:collapse;width:100%"><tr><td><b>Event</b></td><td>${eventTitle}</td></tr><tr><td><b>Registration ID</b></td><td>${passId}</td></tr><tr><td><b>Participant</b></td><td>${participant}</td></tr><tr><td><b>Roll number</b></td><td>${escapeHtml(registration.leader_roll)}</td></tr><tr><td><b>Status</b></td><td>${status}</td></tr></table><p>Your digital pass and QR token are available in the FESTRONIX Passes portal. Keep this registration ID for lookup.</p><p style="color:#64748b">This is an automated message. Please do not reply.</p></div>`;

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [registration.leader_email || delivery.recipient_email], subject: `Your FESTRONIX pass — ${registration.event_title}`, text, html })
  });
  if (!response.ok) {
    const detail = await response.text();
    await db.from('registration_email_deliveries').update({ status: 'failed', last_error: detail.slice(0, 500), updated_at: new Date().toISOString() }).eq('id', delivery.id);
    let providerMessage = 'The email provider rejected the pass email.';
    try {
      const parsed = JSON.parse(detail);
      if (typeof parsed?.message === 'string' && parsed.message.trim()) providerMessage = parsed.message.trim();
    } catch {
      // Keep the safe fallback when the provider does not return JSON.
    }
    return respond({ sent: false, error: providerMessage }, 200);
  }

  await db.from('registration_email_deliveries').update({ status: 'sent', sent_at: new Date().toISOString(), last_error: null, updated_at: new Date().toISOString() }).eq('id', delivery.id);
  return respond({ sent: true, message: 'The registration pass was emailed successfully.' });
});
