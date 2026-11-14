# FESTRONIX payment architecture

## Current mode: Razorpay test checkout

As of 2026-11-09, paid online registrations use Razorpay Checkout in test mode by default. The browser never receives the Razorpay Key Secret and never decides the amount or payment status.

The flow is:

1. The registration UI sends the selected event and sanitized participant payload to `razorpay-create-order`.
2. The Edge Function reads the event fee from Supabase, calculates the amount in paise, stores an order intent in `public.razorpay_orders`, and creates the Razorpay order server-side.
3. The browser opens Razorpay Checkout with the public test Key ID and the server-created order ID.
4. Razorpay returns `razorpay_order_id`, `razorpay_payment_id`, and `razorpay_signature`.
5. `razorpay-verify-payment` validates the HMAC SHA-256 signature, fetches the order and payment from Razorpay, confirms the trusted amount/currency/order relationship, and requires a paid/captured state.
6. The service-role-only `public.finalize_razorpay_order` RPC creates the registration records atomically, marks the passes `verified`, attaches the Razorpay IDs, and returns the generated passes.
7. Before checkout, `razorpay-create-order` checks every leader and teammate roll number against active registrations for that event. A duplicate receives HTTP 409 and no Razorpay order is created.
8. If a duplicate is introduced by a rare race after capture, `razorpay-verify-payment` automatically requests a full Razorpay refund, records the refund result in `public.razorpay_orders`, and returns a clear duplicate-registration message. Repeated callbacks remain idempotent.

### Checkout presentation

The registration form contains the branded payment summary and remains the source of truth for the user flow. The final payment form is opened with Razorpay Standard Checkout, which is a provider-controlled secure overlay created by `checkout.js`; Razorpay does not expose a supported container/mount API for rendering that full form inside an arbitrary React card. The overlay is themed with the FESTRONIX colour and dark backdrop. Pass-email delivery remains asynchronous through the existing Brevo-backed `send-registration-pass` function.

The order table and finalization RPC make retries idempotent. If the checkout callback is delivered twice, an already-paid order returns its stored result instead of creating duplicate registrations.

## Preserved fallback

The previous UPI/manual-proof implementation has not been deleted, but it is intentionally not exposed in the current Razorpay-first registration UI. It remains available for controlled fallback/recovery work and continues to use:

- the existing UPI QR presentation;
- UTR/transaction ID capture;
- `guest-payment-upload` and the private payment-screenshot bucket;
- manual review and payment approval portals;
- the existing QR pass and gate check-in/scanner implementation.

Manual-proof registrations remain `verification_pending`. Razorpay registrations are `verified` only after the server-side verification checks succeed.

## Supabase secrets

Set these as Supabase Edge Function secrets; do not put either value in `.env`, `VITE_*`, source control, or the browser:

```text
RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

From the repository root, the deployment-safe CLI form is:

```powershell
npx supabase secrets set RAZORPAY_KEY_ID=rzp_test_... RAZORPAY_KEY_SECRET=...
```

Alternatively, add the same two names in Supabase Dashboard → Edge Functions → Secrets. Do not add them to the Vite `.env` file: Vite variables are browser-visible.

The create-order function intentionally rejects a non-test Key ID. This prevents an accidental live-key charge while the prototype is being tested. The public Key ID is returned to the checkout only after the backend has validated the order; the Key Secret stays server-side.

## Files added/changed for this integration

- `supabase/migrations/20261109143000_razorpay_test_checkout.sql` — registration payment fields, order ledger, and secure finalization RPC.
- `supabase/migrations/20261113090000_razorpay_refund_tracking.sql` — auditable, retry-safe duplicate-payment refund state.
- `supabase/functions/razorpay-create-order/` — trusted amount calculation and Razorpay order creation.
- `supabase/functions/razorpay-verify-payment/` — signature, order, capture, and finalization checks.
- `src/services/razorpayService.ts` — lazy Checkout script loading, Edge Function calls, and preservation of backend error messages.
- `src/components/RegistrationModal.tsx` — Razorpay-first UI with the manual fallback preserved.
- `src/types/festronix.ts` and `src/services/storageService.ts` — Razorpay metadata mapping.

## Test-mode checklist

1. Create Razorpay test keys in the Razorpay Dashboard (Test Mode).
2. Configure the two Supabase secrets above and deploy both functions.
3. Apply the migration before testing registrations.
4. Use Razorpay's test payment details; do not use real card or UPI credentials.
5. Confirm the order is `paid`, the registration is `verified`, a QR token is available, and the admin/coordinator views show the event-specific registration.
6. Test cancel, failed payment, refresh/retry, duplicate roll number, full event, and team-member join scenarios.
7. For a duplicate-payment test, use an already registered roll number only in Razorpay Test Mode and confirm the pre-checkout HTTP 409 path; do not create a live duplicate charge.

## Before production

- Replace test credentials with live credentials only after a separate production review.
- Remove or deliberately change the test-key guard in both functions.
- Configure Razorpay webhooks and persist webhook events for reconciliation; the synchronous verification above remains the immediate user-facing confirmation path.
- Configure the Razorpay account, capture settings, settlement ownership, refunds, privacy policy, and operational support before accepting real money.
- Keep the manual-proof fallback until payment reconciliation has been proven in production.
