# FESTRONIX project context

This file is a compact handoff note for future work. It records the current architecture and the important decisions made during the prototype implementation.

## Platform baseline

- Public site and registration UI: React + Vite + TypeScript.
- Backend: Supabase Postgres, Row Level Security, Realtime, Storage, and Edge Functions.
- Guest registration is intentional: a participant may register without creating or signing into an account.
- Admin and operations portals use backend role/access-boundary checks. Department coordinators must be scoped to their department; event coordinators and gate volunteers must be scoped to assigned events.
- Registration/pass lookup is event-specific and should use server-derived event IDs and registration state. Do not reintroduce client-only registration truth.
- Email pass delivery is asynchronous through the Supabase `send-registration-pass` function and the configured Brevo sender.

## Payment decision recorded on 2026-11-09

Razorpay test mode was added as the default paid-registration path. The older screenshot/UPI/manual-review and QR-scanner code remains in the repository and is exposed only as a manual fallback. Razorpay secrets are server-only Supabase secrets. See `docs/PAYMENTS_ARCHITECTURE.md` for the complete flow, migration, test checklist, and production checklist.

## Safety rules for future changes

- Never put provider secrets in `VITE_*` variables or frontend code.
- Never trust the amount, event fee, payment status, team membership, or role supplied by the browser; re-read trusted values in Postgres/Edge Functions.
- Keep registration creation idempotent around payment retries.
- Preserve the manual-proof path until the replacement provider is reconciled and tested in production.
- When changing a database function that is already deployed, add a new migration instead of editing only an old migration file.
- Run `npm run build`, `npm run lint`, and `git diff --check` before deployment. SQL and Edge Function migrations should be applied/deployed separately and then tested against the production Supabase project.

## Current Razorpay files

- `supabase/migrations/20261109143000_razorpay_test_checkout.sql`
- `supabase/functions/razorpay-create-order/index.ts`
- `supabase/functions/razorpay-verify-payment/index.ts`
- `src/services/razorpayService.ts`
- `src/components/RegistrationModal.tsx`
