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

function parseSender(rawValue: string | undefined): { name: string; email: string } {
  const raw = (rawValue || 'FESTRONIX Registrations <noreply@connectcub.tech>').trim();
  const match = raw.match(/^(.*?)\s*<([^>]+)>$/);
  if (match) {
    return {
      name: match[1].trim() || 'FESTRONIX Registrations',
      email: match[2].trim()
    };
  }
  return { name: 'FESTRONIX Registrations', email: raw };
}

function formatStatus(rawValue: unknown): { label: string; color: string; description: string } {
  const value = String(rawValue ?? '').trim().toLowerCase();
  if (value === 'verified') {
    return { label: 'PASS ACTIVE · PAYMENT VERIFIED', color: '#34D399', description: 'Your payment has been verified and your entry pass is active.' };
  }
  if (value === 'not_applicable') {
    return { label: 'PASS ACTIVE · NO PAYMENT REQUIRED', color: '#34D399', description: 'This event does not require a payment. Your entry pass is active.' };
  }
  if (value === 'verification_pending') {
    return { label: 'PAYMENT UNDER REVIEW', color: '#FBBF24', description: 'Your registration is recorded. The team is reviewing the payment details.' };
  }
  if (value === 'payment_required') {
    return { label: 'PAYMENT REQUIRED', color: '#FBBF24', description: 'Complete the payment from the FESTRONIX pass portal to activate this pass.' };
  }
  if (value === 'rejected') {
    return { label: 'PAYMENT REJECTED', color: '#FB7185', description: 'Please contact the FESTRONIX registration desk for assistance.' };
  }
  return { label: String(rawValue || 'REGISTRATION RECEIVED').replaceAll('_', ' ').toUpperCase(), color: '#38BDF8', description: 'Your registration has been recorded successfully.' };
}

function formatAmount(value: unknown): string {
  const amount = Number(value ?? 0);
  if (!Number.isFinite(amount)) return '₹0';
  return `₹${amount.toLocaleString('en-IN')}`;
}

function displayValue(value: unknown, fallback = 'To be announced'): string {
  const text = String(value ?? '').trim();
  return text || fallback;
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
    .select('display_id, event_id, event_title, leader_name, leader_email, leader_roll, leader_college, fee, payment_status, transaction_id, team_name, team_code, format, created_at, tickets(qr_token)')
    .eq('id', delivery.registration_id)
    .single();
  if (registrationError || !registration) return respond({ error: 'The registration record was not found.' }, 404);

  const { data: event } = registration.event_id
    ? await db
      .from('events')
      .select('date_display, time_display, venue, department_code, format, fee')
      .eq('id', registration.event_id)
      .maybeSingle()
    : { data: null };

  const brevoKey = Deno.env.get('BREVO_API_KEY');
  const sender = parseSender(Deno.env.get('REGISTRATION_MAIL_FROM'));
  if (!brevoKey) {
    await db.from('registration_email_deliveries').update({ status: 'failed', attempts: delivery.attempts + 1, last_error: 'BREVO_API_KEY is not configured.', updated_at: new Date().toISOString() }).eq('id', delivery.id);
    return respond({ sent: false, error: 'Brevo email delivery is not configured on the backend yet.' }, 503);
  }

  await db.from('registration_email_deliveries').update({ status: 'sending', attempts: delivery.attempts + 1, updated_at: new Date().toISOString() }).eq('id', delivery.id);

  const ticket = Array.isArray(registration.tickets) ? registration.tickets[0] : registration.tickets;
  const qrToken = String(ticket?.qr_token ?? '').trim();
  const passBaseUrl = (Deno.env.get('PUBLIC_SITE_URL') || Deno.env.get('SITE_URL') || 'https://festronix-fawn.vercel.app').replace(/\/+$/, '');
  const passUrl = `${passBaseUrl}/passes?registration=${encodeURIComponent(String(registration.display_id))}`;
  const qrImageUrl = qrToken
    ? `https://api.qrserver.com/v1/create-qr-code/?size=320x320&margin=0&color=07111F&bgcolor=FFFFFF&data=${encodeURIComponent(qrToken)}`
    : '';
  const passStatus = formatStatus(registration.payment_status);
  const eventDate = displayValue(event?.date_display);
  const eventTime = displayValue(event?.time_display);
  const venue = displayValue(event?.venue);
  const department = displayValue(event?.department_code, 'FESTRONIX 2026');
  const format = displayValue(event?.format || registration.format, 'Event registration');
  const fee = formatAmount(registration.fee ?? event?.fee);
  const transactionId = displayValue(registration.transaction_id, 'Not required');
  const passId = escapeHtml(registration.display_id);
  const eventTitle = escapeHtml(registration.event_title);
  const participant = escapeHtml(registration.leader_name);
  const statusLabel = escapeHtml(passStatus.label);
  const statusColor = escapeHtml(passStatus.color);
  const statusDescription = escapeHtml(passStatus.description);
  const eventDateHtml = escapeHtml(eventDate);
  const eventTimeHtml = escapeHtml(eventTime);
  const venueHtml = escapeHtml(venue);
  const departmentHtml = escapeHtml(department);
  const formatHtml = escapeHtml(format);
  const feeHtml = escapeHtml(fee);
  const transactionIdHtml = escapeHtml(transactionId);
  const passUrlHtml = escapeHtml(passUrl);
  const qrImageHtml = qrImageUrl
    ? `<img src="${escapeHtml(qrImageUrl)}" width="180" height="180" alt="FESTRONIX pass QR code" style="display:block;width:180px;height:180px;border:8px solid #FFFFFF;border-radius:12px;background:#FFFFFF;margin:0 auto 10px">\n        <div style="font-size:11px;line-height:16px;color:#64748B;word-break:break-all">TOKEN: ${escapeHtml(qrToken)}</div>`
    : `<div style="height:180px;width:180px;display:flex;align-items:center;justify-content:center;border:1px dashed #64748B;border-radius:12px;color:#94A3B8;font-size:13px;line-height:18px;padding:14px;box-sizing:border-box">Open your live pass portal to view the QR code.</div>`;
  const qrText = qrToken ? `QR token: ${qrToken}` : `QR code: available in the live pass portal`;
  const text = `FESTRONIX 2026 DIGITAL PASS\n\nHello ${registration.leader_name},\n\nYour registration has been recorded.\n\nEvent: ${registration.event_title}\nRegistration ID: ${registration.display_id}\nParticipant: ${registration.leader_name}\nRoll number: ${registration.leader_roll || 'Not provided'}\nStatus: ${passStatus.label}\nDate: ${eventDate}\nTime: ${eventTime}\nVenue: ${venue}\nFee: ${fee}\nTransaction ID: ${transactionId}\n${qrText}\n\nOpen your live pass: ${passUrl}\n\nThis is an automated message from FESTRONIX 2026.`;
  const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>FESTRONIX Digital Pass</title>
  <style>
    body { margin:0; padding:0; background:#070B14; color:#E2E8F0; font-family:Arial,Helvetica,sans-serif; }
    table { border-collapse:collapse; }
    .shell { width:100%; background:#070B14; }
    .container { width:100%; max-width:640px; margin:0 auto; }
    .mobile-pad { padding-left:28px !important; padding-right:28px !important; }
    .detail-cell { width:33.333%; vertical-align:top; }
    .cta { display:inline-block; background:#38BDF8; color:#07111F !important; text-decoration:none; font-weight:700; border-radius:9px; padding:13px 20px; }
    .secondary-cta { display:inline-block; background:#172554; color:#BAE6FD !important; text-decoration:none; font-weight:700; border:1px solid #31517F; border-radius:9px; padding:12px 18px; }
    @media only screen and (max-width:640px) {
      .mobile-pad { padding-left:18px !important; padding-right:18px !important; }
      .hero-title { font-size:30px !important; line-height:36px !important; }
      .ticket-title { font-size:22px !important; line-height:28px !important; }
      .detail-cell { display:block !important; width:100% !important; padding-bottom:14px !important; }
      .cta, .secondary-cta { display:block !important; text-align:center !important; }
      .stack { display:block !important; width:100% !important; }
      .qr-cell { padding-top:18px !important; }
    }
  </style>
</head>
<body>
  <table role="presentation" class="shell" width="100%" cellpadding="0" cellspacing="0">
    <tr><td class="mobile-pad" style="padding:30px 20px 42px">
      <table role="presentation" class="container" width="640" cellpadding="0" cellspacing="0" style="max-width:640px">
        <tr><td style="padding:0 0 22px">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:21px;line-height:26px;font-weight:800;letter-spacing:1px;color:#F8FAFC">FESTRONIX <span style="color:#38BDF8">2026</span></td>
              <td align="right" style="font-size:11px;line-height:16px;letter-spacing:1.5px;color:#94A3B8;text-transform:uppercase">Official digital pass</td>
            </tr>
          </table>
        </td></tr>
        <tr><td style="padding:22px 0 28px;border-top:1px solid #1E293B">
          <div style="font-size:12px;line-height:18px;letter-spacing:2px;text-transform:uppercase;color:#38BDF8;font-weight:700">Registration confirmed</div>
          <div class="hero-title" style="font-size:42px;line-height:48px;font-weight:800;letter-spacing:-1px;color:#F8FAFC;padding-top:8px">You're in, ${participant}</div>
          <div style="font-size:15px;line-height:24px;color:#94A3B8;padding-top:10px">Keep this email safe. Your registration ID and live pass portal are the fastest way to access your event entry details.</div>
        </td></tr>
        <tr><td style="background:#101A36;border:1px solid #29416D;border-radius:18px;overflow:hidden;box-shadow:0 18px 42px rgba(0,0,0,.28)">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="padding:26px 26px 20px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr><td style="font-size:11px;line-height:16px;letter-spacing:1.5px;color:#94A3B8;text-transform:uppercase">${departmentHtml} · FESTRONIX 2026</td><td align="right" style="font-size:11px;line-height:16px;color:${statusColor};font-weight:700">${statusLabel}</td></tr>
                <tr><td colspan="2" class="ticket-title" style="padding-top:12px;font-size:28px;line-height:34px;font-weight:800;color:#F8FAFC">${eventTitle}</td></tr>
                <tr><td colspan="2" style="padding-top:8px;font-size:14px;line-height:20px;color:#94A3B8">${formatHtml} · Registration ID <span style="color:#BAE6FD;font-weight:700">${passId}</span></td></tr>
              </table>
            </td></tr>
            <tr><td style="padding:0 26px"><div style="height:1px;border-top:1px dashed #4B638D;font-size:0;line-height:0">&nbsp;</div></td></tr>
            <tr><td style="padding:22px 26px 26px">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td class="stack" style="vertical-align:top;padding-right:18px">
                    <div style="font-size:12px;line-height:17px;letter-spacing:1px;color:#94A3B8;text-transform:uppercase">Pass holder</div>
                    <div style="font-size:19px;line-height:25px;font-weight:700;color:#F8FAFC;padding-top:3px">${participant}</div>
                    <div style="font-size:13px;line-height:19px;color:#CBD5E1;padding-top:4px">${escapeHtml(displayValue(registration.leader_college, 'College details not provided'))}</div>
                    <div style="font-size:13px;line-height:19px;color:#94A3B8">Roll no: ${escapeHtml(displayValue(registration.leader_roll, 'Not provided'))}</div>
                    <div style="font-size:13px;line-height:19px;color:#94A3B8">Email: ${escapeHtml(displayValue(registration.leader_email || delivery.recipient_email, 'Not provided'))}</div>
                    <div style="margin-top:18px;padding:12px 14px;background:#0B1224;border-left:3px solid ${statusColor};border-radius:7px;color:${statusColor};font-size:13px;line-height:19px">${statusDescription}</div>
                  </td>
                  <td class="stack qr-cell" width="198" align="center" style="vertical-align:top;padding-left:12px">${qrImageHtml}</td>
                </tr>
              </table>
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:24px 0 0" align="center"><a class="cta" href="${passUrlHtml}" target="_blank">Open live pass portal&nbsp; →</a>&nbsp;&nbsp;<a class="secondary-cta" href="${passUrlHtml}" target="_blank">Print / save pass</a></td></tr>
        <tr><td style="padding:26px 0 0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0F172A;border:1px solid #1E3A5F;border-radius:14px">
            <tr><td style="padding:20px 22px 16px;font-size:12px;line-height:17px;letter-spacing:1.7px;color:#38BDF8;font-weight:700;text-transform:uppercase">Event details</td></tr>
            <tr><td style="padding:0 22px 20px"><table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
              <td class="detail-cell" style="padding-right:12px"><div style="font-size:11px;line-height:16px;color:#64748B;text-transform:uppercase">Date</div><div style="font-size:14px;line-height:20px;color:#F8FAFC;padding-top:3px">${eventDateHtml}</div></td>
              <td class="detail-cell" style="padding:0 12px"><div style="font-size:11px;line-height:16px;color:#64748B;text-transform:uppercase">Time</div><div style="font-size:14px;line-height:20px;color:#F8FAFC;padding-top:3px">${eventTimeHtml}</div></td>
              <td class="detail-cell" style="padding-left:12px"><div style="font-size:11px;line-height:16px;color:#64748B;text-transform:uppercase">Venue</div><div style="font-size:14px;line-height:20px;color:#F8FAFC;padding-top:3px">${venueHtml}</div></td>
            </tr></table></td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:26px 0 0">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>
            <td class="stack" style="vertical-align:top;padding-right:14px"><div style="font-size:12px;line-height:17px;letter-spacing:1.7px;color:#A78BFA;font-weight:700;text-transform:uppercase">Good to know</div><div style="font-size:14px;line-height:23px;color:#CBD5E1;padding-top:10px">• Bring a valid college ID and keep your registration ID ready.<br>• Show the QR code at the gate for a faster check-in.<br>• Pass status updates will reflect in the live portal.</div></td>
            <td class="stack" width="220" style="vertical-align:top;padding-left:14px"><div style="font-size:12px;line-height:17px;letter-spacing:1.7px;color:#A78BFA;font-weight:700;text-transform:uppercase">Order summary</div><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px"><tr><td style="font-size:13px;line-height:21px;color:#94A3B8">Registration fee</td><td align="right" style="font-size:13px;line-height:21px;color:#F8FAFC">${feeHtml}</td></tr><tr><td style="font-size:13px;line-height:21px;color:#94A3B8">Transaction</td><td align="right" style="font-size:11px;line-height:17px;color:#CBD5E1;word-break:break-all">${transactionIdHtml}</td></tr><tr><td colspan="2" style="padding-top:8px;border-top:1px solid #293B5C;font-size:14px;line-height:22px;color:#F8FAFC;font-weight:700">Registration ID <span style="float:right;color:#38BDF8">${passId}</span></td></tr></table></td>
          </tr></table>
        </td></tr>
        <tr><td style="padding:28px 0 0;text-align:center;color:#64748B;font-size:12px;line-height:20px">Need to find your pass later? Use <a href="${passUrlHtml}" target="_blank" style="color:#38BDF8;text-decoration:none">${passId}</a> in the FESTRONIX Pass Portal.</td></tr>
        <tr><td style="padding:24px 0 0;text-align:center;border-bottom:1px solid #1E293B">&nbsp;</td></tr>
        <tr><td style="padding:22px 0 0;text-align:center;color:#64748B;font-size:11px;line-height:18px">FESTRONIX 2026 · Vardhaman College of Engineering<br>This is an automated message. Please do not reply.</td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;

  const response = await fetch('https://api.brevo.com/v3/smtp/email', {
    method: 'POST',
    headers: { accept: 'application/json', 'api-key': brevoKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      sender,
      to: [{ email: registration.leader_email || delivery.recipient_email, name: registration.leader_name }],
      subject: `Your FESTRONIX pass — ${registration.event_title}`,
      textContent: text,
      htmlContent: html
    })
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
