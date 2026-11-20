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

function humanize(value: unknown): string {
  return String(value ?? '')
    .replace(/[_-]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .trim();
}

function renderTemplate(template: string, values: Record<string, string>): string {
  return template.replace(/\{\{([A-Z0-9_]+)\}\}/g, (_, key: string) => values[key] ?? '');
}

const EXACT_GMAIL_TEMPLATE = String.raw`
<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>Your Festronix Ticket is Confirmed</title>
<!--[if mso]>
<noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript>
<style>table,td,div,p,a,span{font-family:Arial,Helvetica,sans-serif !important;}</style>
<![endif]-->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&family=Archivo:wght@500;600;700;800&family=Oswald:wght@600;700&display=swap" rel="stylesheet">
<style>
  html,body{margin:0 !important;padding:0 !important;width:100% !important;min-width:100% !important;background-color:#080C16;}
  *{-ms-text-size-adjust:100%;-webkit-text-size-adjust:100%;box-sizing:border-box;}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt;border-collapse:collapse;}
  img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none;display:block;}
  a{text-decoration:none;}
  .display{font-family:'Anton',Impact,'Arial Narrow',sans-serif;}
  .display-condensed{font-family:'Bebas Neue','Anton',Impact,'Arial Narrow',sans-serif;}
  .body{font-family:'Archivo','Helvetica Neue',Helvetica,Arial,sans-serif;}

  @media screen and (max-width:620px){
    .container{width:100% !important;max-width:100% !important;}
    .px{padding-left:18px !important;padding-right:18px !important;}
    .ticket{width:100% !important;max-width:350px !important;}
    .t-title{font-size:52px !important;line-height:0.92 !important;}
    .t-sub{font-size:17px !important;}
    .holder-name{font-size:28px !important;line-height:1 !important;}
    .h1{font-size:34px !important;line-height:1.05 !important;}
    .stack{display:block !important;width:100% !important;max-width:100% !important;}
    .stack-gap{padding-bottom:12px !important;padding-right:0 !important;}
    .btn{display:block !important;width:100% !important;}
  }

  @media (prefers-color-scheme:dark){
    .dm-bg{background-color:#080C16 !important;}
  }
</style>
</head>
<body class="body" style="margin:0;padding:0;background-color:#080C16;color:#FFFFFF;">

<!-- Preheader (Inbox preview text) -->
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:#080C16;font-size:1px;line-height:1px;">
  You're in, {{FIRST_NAME}}! Your Festronix pass is confirmed. Entry QR code and event details inside. &#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;
</div>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" bgcolor="#080C16" class="dm-bg" style="background-color:#080C16;">
<tr><td align="center" style="padding:0 0 44px 0;">

<!--[if mso]><table role="presentation" width="600" align="center" cellspacing="0" cellpadding="0" border="0"><tr><td><![endif]-->
<table role="presentation" class="container" width="600" cellspacing="0" cellpadding="0" border="0" style="width:600px;max-width:600px;margin:0 auto;">

  <!-- ============ TOP BAR ============ -->
  <tr>
    <td class="px" style="padding:30px 24px 10px 24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td align="left" valign="middle">
            <span class="display" style="font-family:'Anton',Impact,'Arial Narrow',sans-serif;font-size:24px;letter-spacing:2px;color:#88B2AE;text-transform:uppercase;">
              &#9889; FESTRONIX
            </span>
          </td>
          <td align="right" valign="middle">
            <span style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:11px;font-weight:700;letter-spacing:2px;color:#94A3B8;text-transform:uppercase;">
              ORDER #{{ORDER_ID}}
            </span>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ============ HERO GREETING ============ -->
  <tr>
    <td class="px" align="center" style="padding:22px 24px 20px 24px;">
      <!-- Main headline with bold display font -->
      <div class="display h1" style="font-family:'Anton',Impact,'Arial Narrow',sans-serif;font-size:44px;line-height:1.02;color:#FFFFFF;text-transform:uppercase;letter-spacing:1px;margin:0;">
        YOU'RE IN, <span class="display-condensed" style="font-family:'Bebas Neue','Anton',Impact,sans-serif;color:#88B2AE;letter-spacing:1.5px;">{{FIRST_NAME}}</span>.
      </div>

      <!-- Subtitle -->
      <p class="body" style="margin:14px 0 0 0;font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:15px;line-height:24px;color:#CBD5E1;max-width:480px;">
        Your official pass for <strong style="color:#FFFFFF;">Festronix</strong> is confirmed.<br>
        Keep this email handy &mdash; present the QR code below at the gate for entry.
      </p>
    </td>
  </tr>

  <!-- ============ THE TICKET ============ -->
  <tr>
    <td align="center" style="padding:10px 16px 20px 16px;">

      <table role="presentation" class="ticket" width="360" cellspacing="0" cellpadding="0" border="0" style="width:360px;max-width:360px;">

        <!-- ============ TOP SCALLOPED EDGE (14 PUNCHED CUT-DOTS) ============ -->
        <tr>
          <td height="8" style="height:8px;line-height:8px;font-size:0;padding:0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="height:8px;line-height:8px;">
              <tr>
                <td bgcolor="#243C74" style="background:#243C74;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#243C74" style="background:#243C74;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#243C74" style="background:#243C74;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#243C74" style="background:#243C74;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#243C74" style="background:#243C74;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#243C74" style="background:#243C74;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#243C74" style="background:#243C74;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#243C74" style="background:#243C74;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#243C74" style="background:#243C74;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#243C74" style="background:#243C74;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#243C74" style="background:#243C74;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#243C74" style="background:#243C74;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#243C74" style="background:#243C74;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:-6px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#243C74" style="background:#243C74;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:-6px auto 0 auto;">&nbsp;</div></td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ MAIN PASS BODY (YELLOW CARD) ============ -->
        <tr>
          <td bgcolor="#243C74" style="background-color:#243C74;padding:28px 26px 24px 26px;">

            <!-- Header Row: Festival Title & Subtitle -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td valign="top">
                  <div class="display t-title" style="font-family:'Anton',Impact,'Arial Narrow',sans-serif;font-size:62px;line-height:0.92;color:#FFFFFF;text-transform:uppercase;letter-spacing:1px;margin:0;">
                    FESTRONIX
                  </div>
                  <div class="display t-sub" style="font-family:'Anton',Impact,'Arial Narrow',sans-serif;font-size:19px;line-height:1;color:#BACEBB;text-transform:uppercase;letter-spacing:0.8px;padding-top:5px;">
                    THE POWER OF THE MOMENT
                  </div>
                    <div class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:13px;font-weight:700;letter-spacing:1.2px;color:#BACEBB;text-transform:uppercase;padding-top:12px;">{{EVENT_TITLE}}</div>
                </td>
                <td align="right" valign="top" style="width:85px;">
                  <div style="background-color:#6F9693;color:#080C16;font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:9.5px;font-weight:800;letter-spacing:1.5px;text-transform:uppercase;padding:4px 7px;border-radius:4px;display:inline-block;text-align:center;">
                    {{PASS_LABEL}}
                  </div>
                </td>
              </tr>
            </table>

            <!-- Divider Line -->
            <div style="border-top:1.5px dashed rgba(220,227,232,0.32);height:0;line-height:0;font-size:0;margin:18px 0 16px 0;">&nbsp;</div>

            <!-- Event Details 2-Column Grid -->
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td width="55%" valign="top" style="padding-right:8px;">
                  <div style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.8px;color:#B7CFF0;text-transform:uppercase;">
                    VENUE &amp; CITY
                  </div>
                  <div style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:13.5px;font-weight:700;color:#FFFFFF;text-transform:uppercase;letter-spacing:0.4px;line-height:18px;padding-top:3px;">
                    {{VENUE_NAME}}<br>
                    <span style="color:#DCE3E8;font-weight:600;">{{CITY}}</span>
                  </div>
                </td>
                <td width="45%" valign="top">
                  <div style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.8px;color:#B7CFF0;text-transform:uppercase;">
                    DATE &amp; DOORS
                  </div>
                  <div style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:13.5px;font-weight:700;color:#FFFFFF;text-transform:uppercase;letter-spacing:0.4px;line-height:18px;padding-top:3px;">
                    {{EVENT_DATE}}<br>
                    <span style="color:#DCE3E8;font-weight:600;">DOORS: {{DOORS_TIME}}</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td colspan="2" style="padding-top:14px;">
                  <div style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:10px;font-weight:700;letter-spacing:1.8px;color:#B7CFF0;text-transform:uppercase;">
                    TIER &amp; ENTRANCE
                  </div>
                  <div style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:13.5px;font-weight:700;color:#FFFFFF;text-transform:uppercase;letter-spacing:0.5px;padding-top:3px;">
                    {{TICKET_TYPE}} &nbsp;&bull;&nbsp; <span style="background-color:#6F9693;color:#080C16;padding:2px 7px;border-radius:4px;font-size:11px;font-weight:800;letter-spacing:1px;">GATE {{GATE}}</span> &nbsp;&bull;&nbsp; <span style="color:#B7CFF0;font-weight:700;">x{{QTY}}</span>
                  </div>
                </td>
              </tr>
            </table>

            <!-- ============ PASS HOLDER (BOLD DISPLAY TYPOGRAPHY) ============ -->
            <div style="border-top:1.5px dashed rgba(220,227,232,0.32);margin-top:18px;padding-top:14px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr>
                  <td valign="top">
                    <div style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:10px;font-weight:800;letter-spacing:2px;color:#B7CFF0;text-transform:uppercase;">
                      PASS HOLDER
                    </div>
                    <!-- Bold Display font: Bebas Neue / Anton -->
                    <div class="display-condensed holder-name" style="font-family:'Bebas Neue','Anton',Impact,'Arial Narrow',sans-serif;font-size:34px;line-height:1.02;color:#FFFFFF;letter-spacing:1.5px;text-transform:uppercase;padding-top:3px;">
                      {{FULL_NAME}}
                    </div>
                  </td>
                  <td align="right" valign="bottom" style="padding-bottom:2px;">
                    <span class="display-condensed" style="font-family:'Bebas Neue','Anton',Impact,sans-serif;font-size:16px;letter-spacing:1.2px;color:#DCE3E8;text-transform:uppercase;">
                      OFFICIAL ADMISSION
                    </span>
                  </td>
                </tr>
              </table>
            </div>

          </td>
        </tr>

        <!-- ============ PERFORATION LINE WITH SIDE CUT-OUTS ============ -->
        <tr>
          <td bgcolor="#6F9693" style="background:#6F9693;height:0;line-height:0;font-size:0;padding:0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
              <tr>
                <!-- Left Notch (semi-circle cutout into pure black background) -->
                <td width="10" style="width:10px;overflow:hidden;line-height:0;font-size:0;height:20px;padding:0;">
                  <div style="width:20px;height:20px;border-radius:50%;background:#080C16;margin-left:-10px;">&nbsp;</div>
                </td>
                <!-- Dotted tear-off perforation line -->
                <td style="border-top:3px dotted #080C16;height:0;line-height:0;font-size:0;padding:0;">&nbsp;</td>
                <!-- Right Notch (semi-circle cutout into pure black background) -->
                <td width="10" align="right" style="width:10px;overflow:hidden;line-height:0;font-size:0;height:20px;padding:0;">
                  <div style="width:20px;height:20px;border-radius:50%;background:#080C16;margin-left:0;">&nbsp;</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- ============ QR ENTRY STUB (CRIMSON SECTION) ============ -->
        <tr>
          <td align="center" bgcolor="#2E4E8C" style="background:#2E4E8C;padding:22px 26px 26px 26px;">

            <!-- Stub Tagline -->
            <div class="display-condensed" style="font-family:'Bebas Neue','Anton',Impact,sans-serif;font-size:15px;letter-spacing:2px;color:#E2E8F0;text-transform:uppercase;margin-bottom:14px;">
              GATE ENTRY &bull; SCAN AT TURNSTILE
            </div>

            <!-- White QR Container -->
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center">
              <tr>
                <td bgcolor="#FFFFFF" style="padding:12px;border-radius:10px;">
                  <img src="https://api.qrserver.com/v1/create-qr-code/?size=360x360&margin=0&color=000000&bgcolor=FFFFFF&data={{TICKET_QR_DATA}}"
                       alt="Entry QR code" width="150" height="150" style="width:150px;height:150px;display:block;">
                </td>
              </tr>
            </table>

            <!-- Monospace Ticket Serial ID -->
            <div style="font-family:'Courier New',Courier,monospace;font-size:13.5px;line-height:16px;font-weight:700;color:#FFFFFF;text-transform:uppercase;letter-spacing:3px;padding-top:14px;">
              {{TICKET_ID}}
            </div>

            <!-- Gate instructions -->
            <div class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:11px;line-height:16px;color:#E2E8F0;text-transform:uppercase;letter-spacing:1.5px;padding-top:4px;">
              Scan at the gate &bull; One entry per code &bull; Valid photo ID required
            </div>

          </td>
        </tr>

        <!-- ============ BOTTOM SCALLOPED EDGE (14 PUNCHED CUT-DOTS) ============ -->
        <tr>
          <td height="8" style="height:8px;line-height:8px;font-size:0;padding:0;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="height:8px;line-height:8px;">
              <tr>
                <td bgcolor="#6F9693" style="background:#6F9693;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#6F9693" style="background:#6F9693;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#6F9693" style="background:#6F9693;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#6F9693" style="background:#6F9693;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#6F9693" style="background:#6F9693;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#6F9693" style="background:#6F9693;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#6F9693" style="background:#6F9693;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#6F9693" style="background:#6F9693;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#6F9693" style="background:#6F9693;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#6F9693" style="background:#6F9693;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#6F9693" style="background:#6F9693;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#6F9693" style="background:#6F9693;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#6F9693" style="background:#6F9693;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:2px auto 0 auto;">&nbsp;</div></td>
                <td bgcolor="#6F9693" style="background:#6F9693;height:8px;overflow:hidden;line-height:0;font-size:0;padding:0;"><div style="width:12px;height:12px;border-radius:50%;background:#080C16;margin:2px auto 0 auto;">&nbsp;</div></td>
              </tr>
            </table>
          </td>
        </tr>

      </table>

    </td>
  </tr>

  <!-- ============ CTAs: WALLET & CALENDAR ============ -->
  <tr>
    <td class="px" align="center" style="padding:22px 24px 10px 24px;">
      <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" width="100%" style="max-width:440px;">
        <tr>
          <!-- Add to Wallet -->
          <td class="stack stack-gap" width="50%" align="center" style="padding-right:8px;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{WALLET_URL}}" style="height:48px;v-text-anchor:middle;width:210px;" arcsize="50%" stroke="f" fillcolor="#2E4E8C"><w:anchorlock/><center style="color:#FFFFFF;font-family:Arial;font-size:13px;font-weight:bold;">ADD TO WALLET</center></v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="{{WALLET_URL}}" class="btn body" style="display:block;background-color:#2E4E8C;color:#FFFFFF;font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:12.5px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;text-align:center;padding:15px 16px;border-radius:50px;">
              &#128241; Add to Wallet
            </a>
            <!--<![endif]-->
          </td>
          <!-- Add to Calendar -->
          <td class="stack" width="50%" align="center" style="padding-left:8px;">
            <!--[if mso]>
            <v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="{{CALENDAR_URL}}" style="height:48px;v-text-anchor:middle;width:210px;" arcsize="50%" strokecolor="#88B2AE" fillcolor="#080C16"><w:anchorlock/><center style="color:#88B2AE;font-family:Arial;font-size:13px;font-weight:bold;">ADD TO CALENDAR</center></v:roundrect>
            <![endif]-->
            <!--[if !mso]><!-->
            <a href="{{CALENDAR_URL}}" class="btn body" style="display:block;border:2px solid #88B2AE;color:#88B2AE;font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:12.5px;font-weight:800;letter-spacing:1.8px;text-transform:uppercase;text-align:center;padding:13px 16px;border-radius:50px;">
              &#128197; Add to Calendar
            </a>
            <!--<![endif]-->
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ============ EVENT INFO MATRIX ============ -->
  <tr>
    <td class="px" style="padding:28px 24px 0 24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #263553;">
        <tr>
          <td class="stack stack-gap" width="33%" valign="top" style="padding:20px 10px 0 0;">
            <div style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2px;color:#94A3B8;text-transform:uppercase;">
              &#9200; DOORS OPEN
            </div>
            <div class="display-condensed" style="font-family:'Bebas Neue','Anton',Impact,sans-serif;font-size:22px;letter-spacing:1px;color:#FFFFFF;padding-top:4px;">
              {{DOORS_TIME}}
            </div>
          </td>
          <td class="stack stack-gap" width="33%" valign="top" style="padding:20px 10px 0 0;">
            <div style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2px;color:#94A3B8;text-transform:uppercase;">
              &#128197; DATE
            </div>
            <div class="display-condensed" style="font-family:'Bebas Neue','Anton',Impact,sans-serif;font-size:22px;letter-spacing:1px;color:#FFFFFF;padding-top:4px;">
              {{EVENT_DATE_LONG}}
            </div>
          </td>
          <td class="stack" width="34%" valign="top" style="padding:20px 0 0 0;">
            <div style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:2px;color:#94A3B8;text-transform:uppercase;">
              &#128205; VENUE
            </div>
            <div class="display-condensed" style="font-family:'Bebas Neue','Anton',Impact,sans-serif;font-size:22px;letter-spacing:1px;color:#FFFFFF;padding-top:4px;">
              {{VENUE_NAME}}
            </div>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ============ GOOD TO KNOW / GATE GUIDE ============ -->
  <tr>
    <td class="px" style="padding:32px 24px 0 24px;">
      <div class="display" style="font-family:'Anton',Impact,'Arial Narrow',sans-serif;font-size:20px;letter-spacing:1.5px;color:#88B2AE;text-transform:uppercase;padding-bottom:14px;">
        GOOD TO KNOW
      </div>
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
        <tr>
          <td class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:13.5px;line-height:22px;color:#CBD5E1;padding:0 0 10px 0;">
            <span style="color:#DCE3E8;font-size:14px;">&#9679;</span>&nbsp; <strong style="color:#FFFFFF;">Have your QR ready:</strong> Turn phone brightness to max. Save a screenshot for offline gate scanning.
          </td>
        </tr>
        <tr>
          <td class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:13.5px;line-height:22px;color:#CBD5E1;padding:0 0 10px 0;">
            <span style="color:#DCE3E8;font-size:14px;">&#9679;</span>&nbsp; <strong style="color:#FFFFFF;">Valid photo ID required:</strong> Must match the pass holder name (<span class="display-condensed" style="font-family:'Bebas Neue','Anton',Impact,sans-serif;font-size:17px;color:#88B2AE;letter-spacing:1px;">{{FULL_NAME}}</span>).
          </td>
        </tr>
        <tr>
          <td class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:13.5px;line-height:22px;color:#CBD5E1;padding:0 0 10px 0;">
            <span style="color:#DCE3E8;font-size:14px;">&#9679;</span>&nbsp; <strong style="color:#FFFFFF;">Arrive early:</strong> Doors open at <strong style="color:#FFFFFF;">{{DOORS_TIME}}</strong>. Arrive 30 minutes before doors to clear lines.
          </td>
        </tr>
        <tr>
          <td class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:13.5px;line-height:22px;color:#CBD5E1;">
            <span style="color:#DCE3E8;font-size:14px;">&#9679;</span>&nbsp; <strong style="color:#FFFFFF;">Single-entry pass:</strong> Each unique QR code works once. Please do not share screenshots publicly.
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ============ ORDER SUMMARY RECEIPT ============ -->
  <tr>
    <td class="px" style="padding:32px 24px 0 24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border:1px solid #263553;border-radius:14px;">
        <tr>
          <td style="padding:20px 24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
              <tr>
                <td class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:13px;color:#A8B3C2;padding-bottom:10px;">
                  {{TICKET_TYPE}} &times; {{QTY}}
                </td>
                <td class="body" align="right" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;padding-bottom:10px;">
                  {{SUBTOTAL}}
                </td>
              </tr>
              <tr>
                <td class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:13px;color:#A8B3C2;padding-bottom:14px;">
                  Booking Fee
                </td>
                <td class="body" align="right" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:13px;font-weight:600;color:#FFFFFF;padding-bottom:14px;">
                  {{FEE}}
                </td>
              </tr>
              <tr>
                <td class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:14px;font-weight:700;color:#88B2AE;border-top:1px solid #263553;padding-top:14px;text-transform:uppercase;letter-spacing:1.5px;">
                  Total Paid
                </td>
                <td class="display-condensed" align="right" style="font-family:'Bebas Neue','Anton',Impact,sans-serif;font-size:24px;letter-spacing:1px;color:#88B2AE;border-top:1px solid #263553;padding-top:12px;">
                  {{TOTAL}}
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>


  <!-- ============ PARTNER LOGOS ============ -->
  <tr>
    <td class="px" style="padding:30px 24px 0 24px;">
      <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="border-top:1px solid #263553;">
        <tr>
          <td align="center" style="padding-top:20px;">
            <div class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:10px;font-weight:800;letter-spacing:2.4px;color:#94A3B8;text-transform:uppercase;">
              Proudly powered by our partners
            </div>
            <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:16px auto 0 auto;">
              <tr>
                <td class="stack stack-gap" align="center" style="padding:0 10px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center"><tr>
                    <td bgcolor="#FFFFFF" style="background:#FFFFFF;padding:9px 12px;border-radius:8px;">
                      <img src="{{SANVI_LOGO_URL}}" alt="Sanvi Homes" width="104" height="34" style="width:104px;height:auto;max-height:34px;display:block;object-fit:contain;">
                    </td>
                  </tr></table>
                  <div class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:1.4px;color:#94A3B8;text-transform:uppercase;padding-top:7px;">Sanvi Homes</div>
                </td>
                <td class="stack stack-gap" align="center" style="padding:0 10px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center"><tr>
                    <td bgcolor="#FFFFFF" style="background:#FFFFFF;padding:9px 12px;border-radius:8px;">
                      <img src="{{VENCORPIA_LOGO_URL}}" alt="Vencorpia" width="104" height="34" style="width:104px;height:auto;max-height:34px;display:block;object-fit:contain;">
                    </td>
                  </tr></table>
                  <div class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:1.4px;color:#94A3B8;text-transform:uppercase;padding-top:7px;">Vencorpia</div>
                </td>
                <td class="stack" align="center" style="padding:0 10px;">
                  <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center"><tr>
                    <td bgcolor="#FFFFFF" style="background:#FFFFFF;padding:9px 12px;border-radius:8px;">
                      <img src="{{SAC_VMEG_LOGO_URL}}" alt="SAC VMEG" width="104" height="34" style="width:104px;height:auto;max-height:34px;display:block;object-fit:contain;">
                    </td>
                  </tr></table>
                  <div class="body" style="font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:9px;letter-spacing:1.4px;color:#94A3B8;text-transform:uppercase;padding-top:7px;">SAC VMEG</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- ============ FOOTER ============ -->
  <tr>
    <td class="px" align="center" style="padding:40px 24px 44px 24px;">
      <div class="display" style="font-family:'Anton',Impact,'Arial Narrow',sans-serif;font-size:26px;letter-spacing:2px;color:#DCE3E8;text-transform:uppercase;">
        THE POWER OF THE MOMENT
      </div>
      <p class="body" style="margin:16px 0 0 0;font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:12px;line-height:22px;color:#7E8D9F;">
        Need help? <a href="mailto:{{SUPPORT_EMAIL}}" style="color:#88B2AE;">{{SUPPORT_EMAIL}}</a><br>
        <a href="{{MANAGE_URL}}" style="color:#A8B3C2;text-decoration:underline;">Manage Booking</a> &nbsp;&bull;&nbsp;
        <a href="{{TERMS_URL}}" style="color:#A8B3C2;text-decoration:underline;">Terms</a> &nbsp;&bull;&nbsp;
        <a href="{{UNSUBSCRIBE_URL}}" style="color:#A8B3C2;text-decoration:underline;">Unsubscribe</a>
      </p>
      <p class="body" style="margin:12px 0 0 0;font-family:'Archivo',Helvetica,Arial,sans-serif;font-size:11px;color:#64748B;">
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
    .select('id, registration_id, recipient_email, status, attempts, updated_at')
    .eq('delivery_token', token)
    .maybeSingle();
  if (deliveryError || !delivery) return respond({ error: 'Registration email delivery was not found.' }, 404);
  if (delivery.status === 'sent') return respond({ sent: true, message: 'The pass email was already sent.' });

  const staleSendingBefore = new Date(Date.now() - 15 * 60 * 1000).toISOString();
  const { data: claimed, error: claimError } = await db
    .from('registration_email_deliveries')
    .update({ status: 'sending', attempts: delivery.attempts + 1, updated_at: new Date().toISOString() })
    .eq('id', delivery.id)
    .or(`status.eq.queued,status.eq.failed,and(status.eq.sending,updated_at.lt.${staleSendingBefore})`)
    .select('id')
    .maybeSingle();
  if (claimError) return respond({ error: 'The pass email could not be claimed for delivery.' }, 500);
  if (!claimed) {
    const { data: latest } = await db.from('registration_email_deliveries').select('status').eq('id', delivery.id).maybeSingle();
    if (latest?.status === 'sent') return respond({ sent: true, message: 'The pass email was already sent.' });
    return respond({ sent: false, message: 'The pass email is already being sent. Retry later if it does not arrive.' }, 202);
  }

  const { data: registration, error: registrationError } = await db
    .from('registrations')
    .select('display_id, event_id, event_title, leader_name, leader_email, leader_roll, leader_college, fee, payment_status, transaction_id, razorpay_payment_id, team_name, team_code, format, created_at, tickets(qr_token), registration_members(name)')
    .eq('id', delivery.registration_id)
    .single();
  if (registrationError || !registration) {
    await db.from('registration_email_deliveries').update({ status: 'failed', last_error: 'The registration record was not found.', updated_at: new Date().toISOString() }).eq('id', delivery.id);
    return respond({ error: 'The registration record was not found.' }, 404);
  }

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
    await db.from('registration_email_deliveries').update({ status: 'failed', last_error: 'BREVO_API_KEY is not configured.', updated_at: new Date().toISOString() }).eq('id', delivery.id);
    return respond({ sent: false, error: 'Brevo email delivery is not configured on the backend yet.' }, 503);
  }

  const ticket = Array.isArray(registration.tickets) ? registration.tickets[0] : registration.tickets;
  const qrToken = String(ticket?.qr_token ?? '').trim();
  const siteUrl = (Deno.env.get('PUBLIC_SITE_URL') || Deno.env.get('SITE_URL') || 'https://festronix-fawn.vercel.app').replace(/\/+$/, '');
  const passUrl = `${siteUrl}/passes?registration=${encodeURIComponent(String(registration.display_id))}`;
  const assetUrl = (path: string) => `${siteUrl}/${path.split('/').map(encodeURIComponent).join('/')}`;
  const passStatus = formatStatus(registration.payment_status);

  // Every visible value is derived from the stored registration/event record so
  // the shared template works for any participant, event, team and payment mode.
  const eventDateRaw = displayValue(event?.date_display, displayValue(String(registration.created_at || '').slice(0, 10), 'To be announced'));
  const eventTimeRaw = displayValue(event?.time_display);
  const venueRaw = displayValue(event?.venue, 'Vardhaman College of Engineering');
  const venueSegments = venueRaw.split(',').map(part => part.trim()).filter(Boolean);
  const venueNameRaw = venueSegments[0] || venueRaw;
  const cityRaw = venueSegments.length > 1 ? venueSegments.slice(1).join(', ') : 'Hyderabad';
  const departmentRaw = displayValue(event?.department_code, 'FESTRONIX');
  const categoryRaw = humanize(event?.category || 'Event');
  const formatRaw = humanize(event?.format || registration.format || 'Individual');
  const eventTitleRaw = displayValue(registration.event_title, 'FESTRONIX event');
  const leaderName = displayValue(registration.leader_name, 'FESTRONIX participant');
  const firstName = leaderName.split(/\s+/)[0] || leaderName;
  const feeValue = Number(registration.fee ?? event?.fee ?? 0);
  const fee = formatAmount(Number.isFinite(feeValue) ? feeValue : 0);
  const bookingFee = formatAmount(0);
  const transactionRaw = displayValue(registration.transaction_id, displayValue(registration.razorpay_payment_id, ''));
  const ticketIdRaw = transactionRaw ? `${registration.display_id} · TXN ${transactionRaw}` : String(registration.display_id);
  const members = Array.isArray(registration.registration_members) ? registration.registration_members : [];
  const quantityRaw = String(Math.max(1, members.length + 1));
  const passLabelRaw = ['verified', 'not_applicable'].includes(String(registration.payment_status))
    ? 'LIVE PASS'
    : registration.payment_status === 'verification_pending'
      ? 'PASS UNDER REVIEW'
      : registration.payment_status === 'rejected'
        ? 'PASS ON HOLD'
        : 'PAYMENT REQUIRED';
  const supportEmail = displayValue(Deno.env.get('REGISTRATION_SUPPORT_EMAIL'), 'c.padmini@vardhaman.org');
  const calendarUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(eventTitleRaw)}&details=${encodeURIComponent(`FESTRONIX registration ${registration.display_id}`)}&location=${encodeURIComponent(venueRaw)}&dates=${encodeURIComponent(String(event?.date_display || '').replace(/[^0-9]/g, '').slice(0, 8) || '20261201')}/${encodeURIComponent(String(event?.date_display || '').replace(/[^0-9]/g, '').slice(0, 8) || '20261202')}`;
  const qrText = qrToken ? `QR token: ${qrToken}` : 'QR code: available in the live pass portal';
  const text = `FESTRONIX 2026 DIGITAL PASS\n\nHello ${leaderName},\n\nYour registration has been recorded.\n\nEvent: ${eventTitleRaw}\nRegistration ID: ${registration.display_id}\nParticipant: ${leaderName}\nRoll number: ${registration.leader_roll || 'Not provided'}\nStatus: ${passStatus.label}\nDate: ${eventDateRaw}\nTime: ${eventTimeRaw}\nVenue: ${venueRaw}\nFee: ${fee}\nTransaction ID: ${transactionRaw || 'Not required'}\n${qrText}\n\nOpen your live pass: ${passUrl}\n\nThis is an automated message from FESTRONIX 2026.`;

  const templateValues: Record<string, string> = {
    ORDER_ID: escapeHtml(registration.display_id),
    FIRST_NAME: escapeHtml(firstName),
    FULL_NAME: escapeHtml(leaderName),
    EVENT_TITLE: escapeHtml(eventTitleRaw),
    PASS_LABEL: escapeHtml(passLabelRaw),
    VENUE_NAME: escapeHtml(venueNameRaw),
    CITY: escapeHtml(cityRaw),
    EVENT_DATE: escapeHtml(eventDateRaw),
    EVENT_DATE_LONG: escapeHtml(eventDateRaw),
    DOORS_TIME: escapeHtml(eventTimeRaw),
    QTY: escapeHtml(quantityRaw),
    TICKET_TYPE: escapeHtml(`${categoryRaw} · ${formatRaw}`),
    GATE: escapeHtml(departmentRaw.toUpperCase()),
    TICKET_ID: escapeHtml(ticketIdRaw),
    TICKET_QR_DATA: encodeURIComponent(qrToken || String(registration.display_id)),
    WALLET_URL: escapeHtml(passUrl),
    CALENDAR_URL: escapeHtml(calendarUrl),
    SUBTOTAL: escapeHtml(fee),
    FEE: escapeHtml(bookingFee),
    TOTAL: escapeHtml(fee),
    SANVI_LOGO_URL: escapeHtml(assetUrl('sanvi_homes_logo.png')),
    VENCORPIA_LOGO_URL: escapeHtml(assetUrl('vencorpia_logo.png')),
    SAC_VMEG_LOGO_URL: escapeHtml(assetUrl('sac-vmeg logo.jpeg')),
    SUPPORT_EMAIL: escapeHtml(supportEmail),
    MANAGE_URL: escapeHtml(passUrl),
    TERMS_URL: escapeHtml(`${siteUrl}/terms`),
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
