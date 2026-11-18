# FESTRONIX payment architecture

## Current mode: Razorpay checkout with backend-validated credentials

Paid online registrations use Razorpay Standard Checkout. The backend selects test or live credentials from Supabase Edge Function secrets; the browser never receives the Razorpay Key Secret and never decides the amount or payment status.

The flow is:

1. The registration UI sends the selected event and sanitized participant payload to `razorpay-create-order`.
2. The Edge Function reads the event fee from Supabase, calculates the amount in paise, stores an order intent in `public.razorpay_orders`, and creates the Razorpay order server-side.
3. A signed-in buyer's access token is validated server-side and stored as `buyer_user_id`; guest checkout remains supported. The browser opens Razorpay Checkout with the public Key ID and server-created order ID.
4. One order supports up to 10 passes across multiple individual events. The backend calculates the total from event fees; free passes can be included in a paid cart without increasing the charge. A duo/team event is checked out separately: the signed-in leader and event are verified, the saved and manually entered roster is validated and persisted server-side, and team-size and capacity rules are checked before checkout.
5. `razorpay-verify-payment` validates the HMAC signature before reading or returning any stored pass data, then fetches the payment from Razorpay and verifies the order, amount, currency, and captured state.
6. The service-role-only `public.finalize_razorpay_order_safely` RPC locks all cart events in a consistent order and calls the idempotent finalizer, which creates one registration and QR ticket per pass in a single transaction, updates event counts, and links signed-in purchases to the verified buyer account.
7. A signed `payment.captured` webhook calls the same idempotent finalizer. It recovers if the browser closes or loses connectivity after capture. Both paths dispatch pass email through an atomic delivery claim.
8. Duplicate rolls are checked before checkout and checked again under the event row lock during finalization. If finalization fails after capture, the verifier or webhook refunds the captured amount; refund failures are recorded for finance review and can be retried safely.

### Checkout presentation

The registration form contains the branded payment summary and remains the source of truth for the user flow. The final payment form is opened with Razorpay Standard Checkout, which is a provider-controlled secure overlay created by `checkout.js`; Razorpay does not expose a supported container/mount API for rendering that full form inside an arbitrary React card. The overlay is themed with the FESTRONIX colour and dark backdrop. Pass-email delivery remains asynchronous through the existing Brevo-backed `send-registration-pass` function.

The order table and finalization RPC make retries idempotent. An already-paid order returns its stored result only after the callback signature and Razorpay payment are revalidated. A second captured payment for the same order is refunded and does not issue another pass set.

### Refund visibility

`razorpay_orders` stays service-role only. The finance console reads refund outcomes through `public.list_razorpay_refund_orders()`, a read-only RPC that returns only orders with a refund attempt and lets the database decide the staff scope: finance reviewers and global admins see every department, other staff only their own. Failed and pending refunds are flagged for manual gateway follow-up; a refund that cannot be created leaves the order at `refund_status = 'failed'` with `refund_error` and the payment ID for the desk.

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
RAZORPAY_MODE=test
RAZORPAY_WEBHOOK_SECRET=...
```

From the repository root, the deployment-safe CLI form is:

```powershell
npx supabase secrets set RAZORPAY_KEY_ID=rzp_test_... RAZORPAY_KEY_SECRET=... RAZORPAY_MODE=test RAZORPAY_WEBHOOK_SECRET=...
```

Alternatively, add these names in Supabase Dashboard → Edge Functions → Secrets. Do not add them to the Vite `.env` file: Vite variables are browser-visible. `RAZORPAY_WEBHOOK_SECRET` must be the exact secret configured on the matching Razorpay webhook endpoint.

Set `RAZORPAY_MODE=test` while testing and `RAZORPAY_MODE=live` only after Razorpay approves the production website. Each function validates that the Key ID is a Razorpay test/live key and rejects a mismatch with the configured mode. If the mode is omitted, the key prefix determines and labels the mode. The public Key ID is returned to the checkout only after the backend has validated the order; the Key Secret stays server-side. The app has no local fake-payment fallback when Supabase is disconnected.

## Files added/changed for this integration

- `supabase/migrations/20261109143000_razorpay_test_checkout.sql` — registration payment fields, order ledger, and secure finalization RPC.
- `supabase/migrations/20261113090000_razorpay_refund_tracking.sql` — auditable, retry-safe duplicate-payment refund state.
- `supabase/migrations/20261113120000_razorpay_refund_review.sql` — staff-scoped read-only RPC so the finance console can see refund outcomes without exposing `razorpay_orders` to the browser.
- `supabase/migrations/20261119100000_razorpay_multipass_hardening.sql` — validated buyer account linkage, refund-payment tracking, and strict finalization idempotency.
- `supabase/migrations/20261119110000_razorpay_checkout_locking.sql` — deterministic event locking for concurrent multi-event carts.
- `supabase/migrations/20261119120000_razorpay_team_roster_sync.sql` — service-only validation and persistence of the final team roster before checkout.
- `supabase/functions/razorpay-create-order/` — trusted amount calculation and Razorpay order creation.
- `supabase/functions/razorpay-verify-payment/` — signature, capture, finalization, safe retry, and failed-finalization refund handling.
- `supabase/functions/razorpay-webhook/` — signed capture recovery when browser verification is interrupted.
- `supabase/functions/_shared/razorpay.ts` — shared refund and pass-email dispatch helpers.
- `src/services/razorpayService.ts` — lazy Checkout script loading, Edge Function calls, and preservation of backend error messages.
- `src/components/RegistrationModal.tsx` — Razorpay-first UI with the manual fallback preserved.
- `src/components/admin/FinanceReviewerDashboard.tsx` — duplicate-payment refund reconciliation section for finance staff.
- `src/types/festronix.ts` and `src/services/storageService.ts` — Razorpay metadata mapping.

## Checkout validation checklist

1. Create Razorpay test keys in the Razorpay Dashboard (Test Mode).
2. Configure Supabase secrets and deploy the order, verify, webhook, and pass-email functions.
3. Apply the migration before testing registrations.
4. In Razorpay Dashboard, register `https://<project-ref>.supabase.co/functions/v1/razorpay-webhook` and subscribe to `payment.captured`; copy the generated webhook secret into Supabase as `RAZORPAY_WEBHOOK_SECRET`.
5. Use Razorpay's test payment details; do not use real card or UPI credentials.
6. Confirm the order is `paid`, registrations are `verified`, QR tickets exist, account linkage works for signed-in buyers, emails send once, and each coordinator sees only the assigned event's registrations.
7. Test mixed free/paid carts, exactly 10 and 11 passes, upcoming/closed/unapproved events, duplicate roll numbers, full capacity and concurrent checkouts, browser interruption after capture, repeated callbacks, partial refund retry, and email delivery retry.
8. For duplicate registration, use an already registered roll number only in Razorpay Test Mode and confirm a refund is recorded; do not create a live duplicate charge.
9. For duo/team events, verify team-code and leader ownership, minimum and maximum size, optional teammate email, duplicate rolls, and full capacity. Confirm each paid team member receives one registration and QR ticket.

## Before production

- Submit the deployed HTTPS website for Razorpay website/app approval and complete the account, KYC, business, bank, and settlement verification steps.
- Set production Supabase to `RAZORPAY_MODE=live` and install the intended merchant account's `rzp_live_` Key ID and Key Secret as Edge Function secrets. The backend rejects missing, malformed, or mode-mismatched credentials before creating an order.
- Deploy the Razorpay order, verify, webhook, and registration-pass Edge Functions; confirm each is active and that no key secret is exposed in browser assets.
- Register `https://fbvztmttixmmqorvqtbb.supabase.co/functions/v1/razorpay-webhook` in the same live Razorpay account for `payment.captured`, then set the exact matching secret as `RAZORPAY_WEBHOOK_SECRET` in Supabase. Confirm the secret with a signed Razorpay delivery; an unsigned request only proves the endpoint is reachable.
- Configure the Razorpay account, capture settings, settlement ownership, refunds, privacy policy, and operational support before accepting real money.
- Keep the manual-proof fallback until payment reconciliation has been proven in production. Use Razorpay Test Mode for end-to-end payment cases; do not use a real charge as a production smoke test.
