# Vercel production configuration

Target domain: `https://www.festronix.com`
Production branch: `codex/firebase-database-migration`
Never deploy or promote `main` for this migration.

## Environment variables

Set these in **Vercel → Project Settings → Environment Variables** for **Production** (and Preview if you want previews to work).

### Critical pass-email / public-site values

```env
PUBLIC_SITE_URL=https://www.festronix.com
FIREBASE_PROJECT_ID=festronix-migration-stg26
VITE_FIREBASE_PROJECT_ID=festronix-migration-stg26
```

`PUBLIC_SITE_URL` must be the exact origin users open — `https://`, no trailing slash. This is what appears in pass emails. A `localhost` value here breaks passes on other devices.

### Client-side build variables

```env
VITE_FIREBASE_API_KEY=<Firebase web API key>
VITE_FIREBASE_AUTH_DOMAIN=festronix-migration-stg26.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=festronix-migration-stg26
VITE_FIREBASE_APP_ID=<Firebase web app ID>
VITE_FIREBASE_MESSAGING_SENDER_ID=<Firebase messaging sender ID>
VITE_REGISTRATIONS_OPEN=false
```

Keep `VITE_REGISTRATIONS_OPEN=false` until registrations are officially opened. The public gate is a build-time flag; changing it requires a redeploy.

### Server-only variables

```env
FIREBASE_PROJECT_ID=festronix-migration-stg26
FIREBASE_SERVICE_ACCOUNT_JSON=<full service-account JSON for festronix-migration-stg26>
REGISTRATION_ROLL_CLAIM_SECRET=<secret>
RAZORPAY_MODE=<live-or-test>
RAZORPAY_KEY_ID=<key>
RAZORPAY_KEY_SECRET=<secret>
RAZORPAY_WEBHOOK_SECRET=<secret>
BREVO_API_KEY=<key>
REGISTRATION_MAIL_FROM=<verified Brevo sender>
```

Never prefix server variables with `VITE_`.

### Do not set

```env
VITE_SUPABASE_URL
VITE_SUPABASE_ANON_KEY
```

Supabase is disabled in the browser build. The deployed site writes to Firebase only.

## Build

`vercel.json` already uses:

```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist"
}
```

The `/api/functions/*` Firebase adapter is included automatically.

## Opening registrations later

When you explicitly approve it:

1. Change `VITE_REGISTRATIONS_OPEN` to `true` in Vercel Production.
2. Redeploy the same `codex/firebase-database-migration` branch.
3. Verify the gate is gone on `https://www.festronix.com`.
