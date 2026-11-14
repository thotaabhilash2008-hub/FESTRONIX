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
function renderTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key: string) => values[key] ?? '');
}

const EXACT_GMAIL_TEMPLATE = String.raw`<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>Your Festronix ticket is confirmed</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<style>table,td,div,p,a{font-family:Arial,Helvetica,sans-serif !important;}</style>
<![endif]-->
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Archivo:wght@500;600;700&display=swap" rel="stylesheet">
<style>
  html,body{margin:0 !important;padding:0 !important;width:100% !important;background:#000000;}
  *{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;}
  img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none;display:block;}
  a{text-decoration:none;}
  .display{font-family:'Anton','Bebas Neue',Impact,'Arial Narrow',sans-serif;}
  .body{font-family:'Archivo','Helvetica Neue',Helvetica,Arial,sans-serif;}

  @media screen and (max-width:620px){
    .container{width:100% !important;}
    .px{padding-left:20px !important;padding-right:20px !important;}
    .ticket{width:100% !important;max-width:340px !important;}
    .t-title{font-size:58px !important;}
    .t-sub{font-size:20px !important;}
    .stack{display:block !important;width:100% !important;}
    .stack-gap{padding-bottom:12px !important;}
    .btn{display:block !important;width:100% !important;}
    .h1{font-size:34px !important;}
  }
  @media (prefers-color-scheme:dark){
    .dm-bg{background:#000000 !important;}
  }
</style>
</head>
<body class="body" style="margin:0;padding:0;background:#000000;">

<!-- Preheader (hidden) -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#000;font-size:1px;line-height:1px;">
  You're in. Your Festronix pass is inside — show the QR code at the gate. &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
</div>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#000000" class="dm-bg" style="background:#000000;">
<tr><td align="center" style="padding:0;">

<!--[if mso]><table role="presentation" width="600" align="center" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
<table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;">

  <!-- ============ TOP BAR ============ -->
  <tr>
    <td class="px" style="padding:32px 32px 8px 32px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td align="left" class="display" style="font-family:'Anton',Impact,'Arial Narrow',sans-serif;font-size:22px;letter-spacing:2px;color:#FFB81C;text-transform:uppercase;">
            FESTRONIX
          </td>
          <td align="right" class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:2px;color:#8a8a8a;text-transform:uppercase;">
            Order #{{ORDER_ID}}
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ============ HEADLINE ============ -->
  <tr>
    <td class="px" align="center" style="padding:28px 32px 8px 32px;">
      <div class="display h1" style="font-family:'Anton',Impact,'Arial Narrow',sans-serif;font-size:42px;line-height:1.02;color:#FFFFFF;text-transform:uppercase;letter-spacing:.5px;">
        You're in, {{FIRST_NAME}}.
      </div>
      <p class="body" style="margin:14px 0 0 0;font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:15px;line-height:24px;color:#b5b5b5;">
        Your pass for <strong style="color:#fff;">Festronix</strong> is confirmed.<br>
        Keep this email handy &mdash; the QR code below is your entry.
      </p>
    </td>
  </tr>

  <!-- ============ TICKET ============ -->
  <tr>
    <td align="center" style="padding:32px 16px 8px 16px;">

      <table role="presentation" class="ticket" width="360" cellspacing="0" cellpadding="0" border="0" style="width:360px;max-width:360px;">

        <!-- top scalloped edge -->
        <tr>
          <td height="8" style="height:8px;line-height:8px;font-size:0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="height:8px;">
              <tr>
                <!-- 14 notches -->
                <td bgcolor="#FFB81C" style="background:#FFB81C;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#FFB81C" style="background:#FFB81C;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#FFB81C" style="background:#FFB81C;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#FFB81C" style="background:#FFB81C;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#FFB81C" style="background:#FFB81C;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#FFB81C" style="background:#FFB81C;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#FFB81C" style="background:#FFB81C;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#FFB81C" style="background:#FFB81C;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#FFB81C" style="background:#FFB81C;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#FFB81C" style="background:#FFB81C;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#FFB81C" style="background:#FFB81C;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#FFB81C" style="background:#FFB81C;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#FFB81C" style="background:#FFB81C;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#FFB81C" style="background:#FFB81C;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:-6px auto 0 auto;">&nbsp;</div></td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- yellow body: title + details -->
        <tr>
          <td bgcolor="#FFB81C"  style="background-color:#FFB81C;background-image:url('data:image/png;base64,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');background-repeat:no-repeat;background-position:center bottom;background-size:100% auto;padding:36px 30px 56px 30px;">

            <div class="display t-title" style="font-family:'Anton',Impact,'Arial Narrow',sans-serif;font-size:64px;line-height:.92;color:#E5311E;text-transform:uppercase;letter-spacing:1px;">
              FESTRONIX
            </div>
            <div class="display t-sub" style="font-family:'Anton',Impact,'Arial Narrow',sans-serif;font-size:21px;line-height:1;color:#E5311E;text-transform:uppercase;letter-spacing:.4px;padding-top:6px;">
              THE POWER OF THE MOMENT
            </div>

            <div class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:14px;line-height:22px;font-weight:600;color:#E5311E;text-transform:uppercase;letter-spacing:.6px;padding-top:34px;">
              {{VENUE_NAME}}, {{CITY}}<br>
              {{EVENT_DATE}}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;{{DOORS_TIME}}
            </div>

            <div class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:14px;line-height:22px;font-weight:600;color:#E5311E;text-transform:uppercase;letter-spacing:.6px;padding-top:22px;">
              Admission x{{QTY}}<br>
              <span style="opacity:.85;">{{TICKET_TYPE}} &middot; Gate {{GATE}}</span>
            </div>

            <div class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:10px;line-height:16px;font-weight:700;color:#E5311E;text-transform:uppercase;letter-spacing:2px;padding-top:22px;">
              Holder &mdash; {{FULL_NAME}}
            </div>
          </td>
        </tr>

        <!-- halftone crowd image (replace URL) -->
        <tr>
          <td bgcolor="#FFB81C" style="background:#FFB81C;">
            <img src="https://your-cdn.com/festronix/crowd-halftone.png" alt="" width="360" style="width:100%;max-width:360px;height:auto;display:block;background:#E5311E;min-height:180px;">
          </td>
        </tr>

        <!-- perforation line with side cut-outs -->
        <tr>
          <td bgcolor="#E5412A" style="background:#E5412A;height:0;line-height:0;font-size:0;position:relative;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td width="10" style="width:10px;overflow:hidden;line-height:0;font-size:0;height:20px;"><div style="width:20px;height:20px;border-radius:50%;background:#000;margin-left:-10px;">&nbsp;</div></td>
                <td style="border-top:3px dotted #000000;height:0;line-height:0;font-size:0;">&nbsp;</td>
                <td width="10" align="right" style="width:10px;overflow:hidden;line-height:0;font-size:0;height:20px;"><div style="width:20px;height:20px;border-radius:50%;background:#000;margin-left:0;">&nbsp;</div></td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- QR stub -->
        <tr>
          <td align="center" bgcolor="#E5412A" style="background:#E5412A;padding:22px 30px 26px 30px;">
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
              <tr>
                <td bgcolor="#FFFFFF" style="background:#FFFFFF;padding:12px;border-radius:10px;">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=0&color=000000&bgcolor=FFFFFF&data={{TICKET_QR_DATA}}"
                       alt="Entry QR code" width="150" height="150" style="width:150px;height:150px;display:block;">
                </td>
              </tr>
            </table>
            <div class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:11px;line-height:16px;font-weight:700;color:#FFFFFF;text-transform:uppercase;letter-spacing:2.5px;padding-top:14px;">
              {{TICKET_ID}}
            </div>
            <div class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:10px;line-height:15px;color:#FFE3A8;text-transform:uppercase;letter-spacing:1.5px;padding-top:2px;">
              Scan at the gate &middot; One entry per code
            </div>
          </td>
        </tr>

        <!-- bottom scalloped edge -->
        <tr>
          <td height="8" style="height:8px;line-height:8px;font-size:0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="height:8px;">
              <tr>
                <td bgcolor="#E5412A" style="background:#E5412A;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#E5412A" style="background:#E5412A;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#E5412A" style="background:#E5412A;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#E5412A" style="background:#E5412A;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#E5412A" style="background:#E5412A;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#E5412A" style="background:#E5412A;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#E5412A" style="background:#E5412A;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#E5412A" style="background:#E5412A;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#E5412A" style="background:#E5412A;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#E5412A" style="background:#E5412A;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#E5412A" style="background:#E5412A;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#E5412A" style="background:#E5412A;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#E5412A" style="background:#E5412A;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#E5412A" style="background:#E5412A;height:8px;overflow:hidden;line-height:0;font-size:0;"><div style="width:12px;height:12px;border-radius:50%;background:#000;margin:2px auto 0 auto;">&nbsp;</div></td>
              </tr>
            </table>
          </td>
        </tr>
      </table>

    </td>
  </tr>

  <!-- ============ CTAs ============ -->
  <tr>
    <td class="px" align="center" style="padding:36px 32px 8px 32px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%">
        <tr>
          <td class="stack stack-gap" width="50%" align="center" style="padding-right:6px;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{WALLET_URL}}" style="height:50px;v-text-anchor:middle;width:250px;" arcsize="50%" stroke="f" fillcolor="#FFB81C"><w:anchorlock/><center style="color:#E5311E;font-family:Arial;font-size:14px;font-weight:bold;">ADD TO WALLET</center></v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="{{WALLET_URL}}" class="btn body" style="display:block;background:#FFB81C;color:#E5311E;font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;padding:17px 12px;border-radius:50px;">Add to Wallet</a>
            <!--<![endif]-->
          </td>
          <td class="stack" width="50%" align="center" style="padding-left:6px;">
            <a href="{{CALENDAR_URL}}" class="btn body" style="display:block;border:2px solid #FFB81C;color:#FFB81C;font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:2px;text-transform:uppercase;text-align:center;padding:15px 12px;border-radius:50px;">Add to Calendar</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ============ EVENT DETAILS GRID ============ -->
  <tr>
    <td class="px" style="padding:36px 32px 0 32px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #2a2a2a;">
        <tr>
          <td class="stack stack-gap" width="33%" valign="top" style="padding:24px 8px 0 0;">
            <div class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2px;color:#777;text-transform:uppercase;">Doors open</div>
            <div class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:#fff;padding-top:6px;">{{DOORS_TIME}}</div>
          </td>
          <td class="stack stack-gap" width="33%" valign="top" style="padding:24px 8px 0 0;">
            <div class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2px;color:#777;text-transform:uppercase;">Date</div>
            <div class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:#fff;padding-top:6px;">{{EVENT_DATE_LONG}}</div>
          </td>
          <td class="stack" width="33%" valign="top" style="padding:24px 0 0 0;">
            <div class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2px;color:#777;text-transform:uppercase;">Venue</div>
            <div class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:16px;font-weight:700;color:#fff;padding-top:6px;">{{VENUE_NAME}}</div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ============ GOOD TO KNOW ============ -->
  <tr>
    <td class="px" style="padding:36px 32px 0 32px;">
      <div class="display" style="font-family:'Anton',Impact,'Arial Narrow',sans-serif;font-size:20px;letter-spacing:1.5px;color:#FFB81C;text-transform:uppercase;padding-bottom:14px;">Good to know</div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr><td class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:14px;line-height:22px;color:#b5b5b5;padding:0 0 10px 0;">
          <span style="color:#E5311E;">&#9679;</span>&nbsp; Have your QR ready &mdash; brightness up, screenshot saved offline.
        </td></tr>
        <tr><td class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:14px;line-height:22px;color:#b5b5b5;padding:0 0 10px 0;">
          <span style="color:#E5311E;">&#9679;</span>&nbsp; Carry a valid photo ID that matches the holder name.
        </td></tr>
        <tr><td class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:14px;line-height:22px;color:#b5b5b5;padding:0 0 10px 0;">
          <span style="color:#E5311E;">&#9679;</span>&nbsp; Arrive early &mdash; gates get busy 30 minutes before doors.
        </td></tr>
        <tr><td class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:14px;line-height:22px;color:#b5b5b5;">
          <span style="color:#E5311E;">&#9679;</span>&nbsp; Each QR code works once. Please don't share it publicly.
        </td></tr>
      </table>
    </td>
  </tr>

  <!-- ============ ORDER SUMMARY ============ -->
  <tr>
    <td class="px" style="padding:36px 32px 0 32px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #2a2a2a;border-radius:14px;">
        <tr>
          <td style="padding:20px 22px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:13px;color:#9a9a9a;padding-bottom:10px;">{{TICKET_TYPE}} &times; {{QTY}}</td>
                <td class="body" align="right" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:13px;color:#fff;padding-bottom:10px;">{{SUBTOTAL}}</td>
              </tr>
              <tr>
                <td class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:13px;color:#9a9a9a;padding-bottom:14px;">Booking fee</td>
                <td class="body" align="right" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:13px;color:#fff;padding-bottom:14px;">{{FEE}}</td>
              </tr>
              <tr>
                <td class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#FFB81C;border-top:1px solid #2a2a2a;padding-top:14px;text-transform:uppercase;letter-spacing:1.5px;">Total paid</td>
                <td class="body" align="right" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:18px;font-weight:700;color:#FFB81C;border-top:1px solid #2a2a2a;padding-top:14px;">{{TOTAL}}</td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ============ FOOTER ============ -->
  <tr>
    <td class="px" align="center" style="padding:44px 32px 48px 32px;">
      <div class="display" style="font-family:'Anton',Impact,'Arial Narrow',sans-serif;font-size:26px;letter-spacing:2px;color:#E5311E;text-transform:uppercase;">The power of the moment</div>
      <p class="body" style="margin:18px 0 0 0;font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:12px;line-height:20px;color:#6f6f6f;">
        Need help? <a href="mailto:{{SUPPORT_EMAIL}}" style="color:#FFB81C;">{{SUPPORT_EMAIL}}</a><br>
        <a href="{{MANAGE_URL}}" style="color:#9a9a9a;text-decoration:underline;">Manage booking</a> &nbsp;&middot;&nbsp;
        <a href="{{TERMS_URL}}" style="color:#9a9a9a;text-decoration:underline;">Terms</a> &nbsp;&middot;&nbsp;
        <a href="{{UNSUBSCRIBE_URL}}" style="color:#9a9a9a;text-decoration:underline;">Unsubscribe</a>
      </p>
      <p class="body" style="margin:14px 0 0 0;font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:11px;color:#4f4f4f;">
        &copy; 2026 Festronix. All rights reserved.
      </p>
    </td>
  </tr>

</table>
<!--[if mso]></td></tr></table><![endif]-->

</td></tr>
</table>
</body>
</html>

`;

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
      .select('date_display, time_display, venue, department_code, category, format, fee')
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
  const leaderName = displayValue(registration.leader_name, 'FESTRONIX participant');
  const firstName = leaderName.split(/\s+/)[0] || leaderName;
  const eventTitleRaw = displayValue(registration.event_title, 'FESTRONIX event');
  const eventDateRaw = displayValue(event?.date_display);
  const eventTimeRaw = displayValue(event?.time_display);
  const venueRaw = displayValue(event?.venue);
  const transactionRaw = displayValue(registration.transaction_id, 'Not required');
  const supportEmail = 'festronix.support@vardhaman.org';
  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitleRaw)}&details=${encodeURIComponent(`FESTRONIX registration ${registration.display_id}`)}&location=${encodeURIComponent(venueRaw)}`;
  const templateValues: Record<string, string> = {
    ORDER_ID: escapeHtml(registration.display_id),
    FIRST_NAME: escapeHtml(firstName),
    FULL_NAME: escapeHtml(leaderName),
    VENUE_NAME: escapeHtml(venueRaw),
    CITY: 'Hyderabad',
    EVENT_DATE: escapeHtml(eventDateRaw),
    EVENT_DATE_LONG: escapeHtml(eventDateRaw),
    DOORS_TIME: escapeHtml(eventTimeRaw),
    QTY: '1',
    TICKET_TYPE: escapeHtml(eventTitleRaw),
    GATE: 'Main Gate',
    TICKET_ID: escapeHtml(`${registration.display_id} · TXN ${transactionRaw}`),
    TICKET_QR_DATA: encodeURIComponent(qrToken || registration.display_id),
    WALLET_URL: escapeHtml(passUrl),
    CALENDAR_URL: escapeHtml(calendarUrl),
    SUBTOTAL: escapeHtml(fee),
    FEE: '₹0',
    TOTAL: escapeHtml(fee),
    SUPPORT_EMAIL: escapeHtml(supportEmail),
    MANAGE_URL: escapeHtml(passUrl),
    TERMS_URL: escapeHtml(passUrl),
    UNSUBSCRIBE_URL: escapeHtml(`mailto:${supportEmail}?subject=FESTRONIX%20email%20preferences`)
  };
  const html = renderTemplate(EXACT_GMAIL_TEMPLATE, templateValues);

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
