# FESTRONIX Firebase migration plan

## Status and safety boundary

- Migration branch: `codex/firebase-database-migration`.
- The selected Firebase owner is the account already authenticated with the local Firebase CLI (the original account, not Connect Club).
- Staging project `festronix-migration-stg26` (`FESTRONIX Migration Staging`) was created under that account. Its Standard Firestore `(default)` database is provisioned in `asia-south1` (Mumbai) with deletion protection enabled.
- Billing status: the latest Firebase/Google Cloud console screen shows a linked paid billing account with overdue or invalid payment information. An earlier CLI attempt reported the account as closed; treat billing as unresolved until the Payment overview page shows the account in good standing. A budget only sends alerts and does not resolve an overdue balance or invalid payment profile. A read-only staging check currently confirms that public Firestore reads work and private collections remain denied. Cloud Functions deployment is still blocked by billing.
- Staging web app `FESTRONIX Staging Web` is registered with app ID `1:96928303308:web:c14f5afc295024a95eda69`.
- Deny-by-default Firestore rules and the staged index configuration have been deployed to the staging database. The reviewed migration snapshot and explicit public event projection are present. The web client now disables all Supabase networking; no production website or payment cutover has happened.
- A local transformation produced 266 Firestore documents from the reviewed public export. It preserves typed JSON/boolean/numeric/timestamp values, routes the 57 orphan team records to private `legacyOrphanTeams`, and reports no oversized documents or duplicate Firestore document IDs. The NDJSON and manifest stay under Local AppData, outside Git.
- The initial 268-document snapshot was imported to staging on 2026-11-19. On 2026-11-20, a fresh export of 264 Supabase rows prepared 307 Firestore documents. The staging importer refreshed 84 changed documents, added 4 missing audit records, and removed 6 stale staging records linked to one removed event (including two Razorpay orders in `created` state); a second preflight verified all 307 documents and no stale allowlisted documents remained. The registration migration transformer now derives private `registrationRollClaims` using event-scoped HMAC-SHA-256, registration references, team associations, and a conflict flag; plaintext roll numbers are never written to the derived collection. A stable random HMAC secret is stored locally under `%LOCALAPPDATA%\FestronixMigration\supabase-export\registration-roll-claim.key`, outside Git; it must be provisioned to Firebase Secret Manager before any deployed registration function can use the index. The same-team mirror rule is unit-tested, as are rejected registrations, cross-event scope, and conflicts between individual and team records. The staging rehearsal has two HMAC claim documents and no conflicts. Re-indexing replaced exactly two prior unkeyed claim documents with HMAC claims; the post-write preflight matched all 309 expected documents, with no missing, changed, or stale documents. The final fresh export must be checked again before checkout is implemented. Fifty-seven source team rows reference missing events and are preserved in `legacyOrphanTeams`; only two valid teams are active. The `publicEvents` projection has 43 approved/open events and matches the source ID set. Its allowlist excludes CSE cluster scope, payment instructions, WhatsApp invite links, and participant data. `scripts/sync-firebase-staging-public-events.mjs` is pinned to the reviewed source and staging projects, dry-runs by default, and writes only `publicEvents` after explicit project confirmation. New projection snapshots encode nullable deadlines as ISO-8601 text (empty text for null); the client adapter also tolerates valid Firestore timestamps. The importer validates source hashes/account/location and requires explicit flags to refresh changed data or delete stale allowlisted documents. The export validator records hashes for the exact SQL files it validated.
- Short-lived Google Application Default Credentials are configured for `dhanushmathe@gmail.com` with the staging project as quota project. No credential file or access token is in the repository.
- The only configured Firebase target in this branch remains the migration staging project, not a separately verified production Firebase project. Production cutover is blocked until billing, functions, final data reconciliation, payments, storage, and staff verification are complete.
- Native Firebase callable functions implement staff identity/scope bootstrap, scoped staff reads, staff CRUD, guest registration, teams, Razorpay, pass email, and check-in. The web client now routes to Firebase and hard-disables Supabase; the callable functions have not deployed because the current billing account is not in good standing.
- A Vercel Node API adapter has been added as an alternative runtime for the Firebase backend handlers. It uses server-side environment variables for Firebase Admin credentials and payment/email secrets; it does not require deploying Firebase Cloud Functions. The adapter is built and locally tested, but the Vercel project is not linked or deployed. This alternative still depends on Firebase Auth and Firestore being available, so it cannot bypass a Google Cloud service suspension caused by unresolved billing.
- `.firebaserc` maps the `staging` alias to `festronix-migration-stg26`.
- `.env` contains only the public Supabase URL and anon key. Firebase staging web configuration is stored in the ignored local `.env.local`; no Firebase service credential or Supabase service-role credential is in the workspace.
- The latest verified legacy-source public-schema/data export contains all 17 application tables and 264 rows. Its SHA-256/count manifest is stored under Local AppData, outside Git. The Auth export is also retained locally for migration reconciliation. Storage files have not yet been copied.
- As of the 2026-11-20 staging reconciliation, Firestore contains 309 documents: 266 private migration documents (including two HMAC-derived `registrationRollClaims`) and 43 public event projection documents. Unauthenticated reads are allowed only for published documents in `publicEvents`; reads to 10 participant, payment, team, staff, and derived-claim collections were denied. The latest preflight matched all 309 documents with no missing, changed, or stale allowlisted documents. Auth users are imported. App Engine is now provisioned in `asia-south1` with the Firestore Native database type, but no Functions have deployed and runtime checkout is not ready.
- The temporary Supabase Edge Function bridge for Firebase staff-event reads was removed. Firebase-only migration code lives under `functions/`; migration tooling that reads the legacy Supabase source remains under `scripts/` until the final data reconciliation is complete.
- The app bundle contains no Supabase SDK or Supabase endpoint and `isSupabaseConfigured()` is permanently false. A fail-closed compatibility proxy remains only to keep legacy call sites compiling during their staged deletion. Supabase SDK use is limited to one-time source migration scripts; keep those scripts until final reconciliation, then retire them.
- Latest local verification on 2026-11-20: frontend `npm run build` and Functions `npm run build` pass; Functions event-scope (8 cases) and registration-claim (5 assertions) checks pass; Firebase Firestore REST tests pass 4/4 with the emulator transaction exercised; registration-roll-claim tests pass 6 assertions; `git diff --check` passes. The frontend build still reports large-chunk and ineffective-dynamic-import warnings, which do not fail the build.
- This branch must not be treated as a production cutover until the staging backend is deployable and verified, final source data is reconciled, payment/staff/files/recovery paths pass staging checks, and the project is explicitly promoted from staging.

## Existing production capabilities to preserve

Supabase currently supplies several services, not just relational storage:

| Current capability | Current implementation | Required Firebase replacement |
| --- | --- | --- |
| Relational data and constraints | Postgres tables, foreign keys, unique indexes | Firestore document model plus server-enforced invariants and indexes |
| Staff authentication | Supabase Auth; admin roles and assignments in Postgres | Firebase Auth plus server-verified role and assignment records |
| Guest registration | Public registration without requiring a participant login | Keep registration guest-accessible; never make Firebase Auth mandatory for a public participant |
| Authorization | Postgres RLS, private helper functions, scoped RPCs | Deny-by-default Firestore rules; Firebase callable/HTTP functions verify Firebase identity and load current role scope server-side |
| Payment/order workflow | Supabase Edge Functions and transactional SQL finalizers | Razorpay create/verify/webhook in Firebase Functions; Firestore transactional finalization, idempotency, capacity constraints, and a retryable outbox |
| Realtime updates | Supabase Realtime | Firestore listeners on explicitly scoped, non-sensitive query results |
| File storage | Supabase Storage, including private payment proof objects | Firebase Storage with private objects and Firebase-authenticated, server-enforced scoped access |
| Pass email | Supabase Edge Function and Brevo | Firebase Function plus an idempotent durable outbox and the configured email delivery provider |

## Source Auth and Storage audit

- The application has password-based staff sign-in in `src/services/adminAuthService.ts`, public/profile sign-in and legacy sign-up paths in `src/services/authService.ts`, and privileged staff account creation/invitation/deletion in `supabase/functions/admin-users/index.ts`.
- `admin_roles` and related rows use Supabase Auth UUIDs as foreign keys. Preserve those UUIDs as Firebase Auth UIDs so migrated role and assignment references remain stable. Firebase Auth supports importing explicit UIDs. Supabase documents that Auth passwords are bcrypt hashes held in `auth.users.encrypted_password`; Firebase Auth supports BCRYPT imports. Treat password carry-over as a verified staging outcome only after representative staff accounts successfully sign in.
- A read-only, hidden-URI Auth export tool is at `scripts/export-supabase-auth-migration.ps1`. It runs SELECT-only queries in a read-only Postgres session, captures only user fields needed for identity migration plus non-token identity metadata, inventories MFA factor counts without exporting factor secrets, and writes password hashes under a current-user-only Local AppData directory. The export completed on 2026-11-19: 43 users, 43 email identities, no duplicate email groups, no malformed bcrypt hashes, two accounts without password hashes, and no MFA factors.
- `scripts/prepare-firebase-auth-import.mjs` verifies the Auth export hashes, UID/email uniqueness, bcrypt format, identity links, and E.164 phone numbers before producing a Firebase CLI import file under the protected Local AppData migration directory. It preserves the Supabase UIDs, removes PostgreSQL's line wrapping from Base64 hashes, keeps passwordless accounts hashless, and maps the three currently active Supabase bans to Firebase's disabled flag.
- Firebase Authentication was initialized in the dedicated staging project. Before import, the Firebase CLI confirmed the staging Auth directory was empty. On 2026-11-19, all 43 users were imported into `festronix-migration-stg26` using BCRYPT; a read-back verified all 43 UIDs, emails, email-verification flags, and disabled flags with zero mismatches. Cross-domain checks found all 41 migrated profile IDs, all 15 admin-role user IDs, and all 14 non-null `granted_by` IDs in Firebase Auth. Three banned accounts remain disabled; two accounts have no password hash and need a future reset or approved passwordless sign-in path. No production website or payment runtime was switched.
- Public guest event registration must remain usable without Firebase Auth. Staff identity migration is separate from public participant checkout.
- The inspected legacy storage path is the private `payment-screenshots` bucket. Its objects and access paths still need migration to Firebase Storage; do not remove the source bucket until object counts, hashes, ACLs, and staff access have been reconciled.
- Firebase Auth users/identities and bcrypt hashes were imported into staging with source UIDs preserved. Staging account fields were read-back verified, but representative staff password sign-in and migrated storage access still need end-to-end verification. Public registration continues to require no sign-in.

The SQL sources and migrations define these application data tables: `profiles`, `departments`, `admin_roles`, `admin_event_assignments`, `events`, `registrations`, `registration_members`, `tickets`, `payment_proofs`, `announcements`, `audit_logs`, `certificates`, `sponsors`, `sponsor_profiles`, `teams`, `razorpay_orders`, and `registration_email_deliveries`. Supabase Auth is a separately migrated identity domain; Supabase Storage remains an external service in the current migration plan.

## Proposed Firestore shape

Preserve the existing UUIDs as document IDs where possible so event, registration, order, audit, and assignment references remain traceable. Normalize searchable records as top-level collections; avoid embedding unbounded histories or personal data in public event documents.

| Collection | Purpose and access boundary |
| --- | --- |
| `departments/{code}` | Department directory; public fields only |
| `events/{eventId}` | Canonical event, capacity, approval, deletion, department, and cluster fields; all mutations server-authorized |
| `publicEvents/{eventId}` | Explicit public projection of approved/open events; no coordinator-only or internal fields |
| `registrations/{registrationId}` | Registration and payment status; client writes denied; server reads are limited to verified staff scope |
| `registrationMembers/{memberId}` | Per-person team/contact/pass details, queryable by registration/event; private by default |
| `tickets/{ticketId}` | Ticket/pass state and event/registration references; QR validation goes through a trusted endpoint |
| `teams/{teamId}` and `teamMembers/{memberId}` | Team reservation, join-code lookup, roster, and membership lifecycle; private contacts never exposed by public team lookup |
| `adminUsers/{uid}`, `adminRoles/{roleId}`, `eventAssignments/{assignmentId}` | Active staff identity, role, department, cluster, and event scope; never client-writable |
| `paymentOrders/{orderId}` | Private Razorpay intent, amount, capture/refund state, idempotency data, and finalization result; server only |
| `paymentWebhookEvents/{providerEventId}` | Webhook idempotency and audit state; server only |
| `emailDeliveries/{deliveryId}` | Durable email outbox and retry status; server only |
| `paymentProofs/{proofId}` | Metadata for private Storage objects and scoped review status |
| `announcements/{id}`, `certificates/{id}`, `auditLogs/{id}` | Existing content, certificate issue records, and append-only operational audit |
| `sponsors/{id}`, `sponsorProfiles/{id}` | Sponsor/partner records; public projections separated from editable admin data |

This is a proposed schema, not a deployed schema. Indexes and exact field names must be finalized from the current live schema and query patterns before data import.

## Non-negotiable invariants

1. A participant may register without signing in. Registration, pass retrieval, and email identity remain independent of Firebase user accounts.
2. Browser input never determines event price, approval state, capacity, payment capture, QR validity, team ownership, or staff scope.
3. Every staff request verifies the Firebase ID token on the server and loads current active role/assignment data. CSE cluster boundaries and all department/event scopes are checked server-side for every operation.
4. Client Firestore rules default to deny for sensitive collections. Admin SDK and server credentials bypass Firestore rules, so every privileged function performs its own authorization checks. Firestore rules are not filters; queries must be constrained to a scope the rules allow.
5. Razorpay keys and webhook secrets remain in server secret management. Payment capture, order amount/currency, and signature are verified with Razorpay before any pass is issued.
6. Payment finalization is idempotent: one paid order issues exactly one corresponding registration/member/ticket set. Duplicate webhook/browser callbacks cannot duplicate passes or emails.
7. Capacity reservation/finalization, duplicate-roll checks, team-size checks, and event counters are atomic. Concurrency and contention behavior must be load-tested before production traffic is switched.
8. Captured payment with failed registration finalization creates a durable refund/review job. A failed refund remains visible to finance staff and is retryable.
9. QR lookup and check-in never expose participant records to anonymous clients. Check-in is a scoped server operation with replay protection and an audit record.
10. Private payment images and personal contact details remain private; public event data is a separate projection.
11. Migration preserves soft-deleted events and payment/audit history. Hard deletion must not be used as the migration strategy.
12. No production dual-write is enabled unless a transactional outbox/reconciliation mechanism is implemented and monitored.
13. The source snapshot contains 57 orphaned `teams` rows referencing five event UUIDs absent from `events`; 46 have no registration reference and 11 reference registrations absent from the snapshot. `teams.event_id` is plain text without an event foreign key, and the current hard-delete RPC deletes the event without deleting these team rows. Preserve these records in a private archive collection, never in the active team lookup path.

## Phased execution

### Phase 0 — Inventory and target setup

- Firestore (rather than Realtime Database) and a dedicated staging project are selected: `festronix-migration-stg26`.
- The Firestore location is selected as `asia-south1` (Mumbai). This is immutable after database creation.
- Enable the Cloud Firestore API and provision the `(default)` database in `asia-south1` with deletion protection. **Completed**; deny-by-default Firestore rules and indexes are deployed.
- The project owner reports the Firebase plan upgrade. The Firebase project currently configured in this branch remains `festronix-migration-stg26`; verify the billing plan in Firebase Console before enabling production traffic.
- Record source schema, constraints, indexes, functions/RPCs, RLS rules, auth-user count, storage buckets/objects, and row counts from a read-only production snapshot.
- Never place service-role keys, service-account keys, or Razorpay secrets in source control or `VITE_*` variables.

### Phase 1 — Firebase security and server skeleton

- Use the staging-pinned Firebase client only in isolated migration checks; do not route the website to staging data while registration and payment remain on Supabase.
- Keep Firebase Storage rules private until object paths and access controls are implemented and verified.
- Move staff role checks, public guest registration/team operations, Razorpay create/verify/webhook, check-in, and email outbox processing into Firebase Functions. Never expose Admin SDK credentials or payment secrets to the browser.
- Keep Supabase as the sole production writer while the new backend is exercised in an isolated staging project.

### Phase 2 — Export, transform, and staging snapshot

- Take a timestamped, read-only Supabase export/backup before any copy.
- Export all 17 application tables and Supabase Auth user metadata; preserve deleted rows and all payment/refund/email states. Storage object bytes remain in the source Supabase bucket.
- The public export is present locally and structurally verified. The 57 unmatched team reservations were routed to the private `legacyOrphanTeams` archive; they are not exposed as active teams.
- The transform is at `scripts/prepare-firestore-migration.mjs`; its output is private local migration data, not a tracked artifact. The staging-only importer at `scripts/import-firestore-staging.mjs` verified its source hashes, destination project/location, authorized Google account, empty initial destination, and read-back parity.
- Staging snapshot import and reconciliation completed for the 2026-11-20 export: 309 documents total, including 266 private documents (two derived `registrationRollClaims`) and 43 public event projection documents. Fifty-seven orphan team rows remain in the private archive; two valid teams are active. The derived claims contain no plaintext rolls; the current rehearsal has zero flagged conflicts. The HMAC claim secret is local-only until its Firebase Secret Manager version is created and verified. This remains a migration rehearsal snapshot, not the final cutover copy; later source changes require a fresh export and delta/cutover plan.
- Transform to stable Firestore document IDs and server-only/private fields. Emit a migration manifest with source counts, destination counts, invalid rows, duplicate identifiers, missing references, and content hashes.
- Make dry-run the default. An apply run requires explicit target project and an immutable backup/export manifest; it must be restartable and idempotent.
- Do not migrate secret material or accept a service-account JSON file from the user in chat.

### Phase 3 — Staging parity and adversarial verification

- Verify document counts, IDs, relationships, totals, soft-delete state, order/refund states, team roster contacts, QR-ticket mappings, and email delivery records.
- Verify password migration strategy for staff accounts. Firebase supports importing BCRYPT-hashed users; any unsupported/missing hashes require a planned password reset, not plaintext extraction.
- Exercise event creation/edit/approval/deletion, department and CSE cluster isolation, event-coordinator assignment, guest individual/multi-pass/team checkout, duplicate roll, capacity contention, payment retries, signed webhooks, refunds, QR retrieval/check-in, email retries, and private proof access.
- Run automated Firestore rules tests and load/concurrency tests against staging; verify alerts and logs contain no secrets or unnecessary participant data.

### Phase 4 — Controlled cutover and rollback

- Freeze Supabase writes for the final delta export or use a verified change-log/outbox to catch up changes.
- Compare source and destination manifests and require zero unexplained count/hash/reference mismatches before changing runtime configuration.
- Cut over a small, reversible read-only surface first. Keep all payment writes on exactly one backend during transition.
- Switch payment create/verify/webhook as one coordinated deployment only after transaction, refund, reconciliation, and replay checks pass.
- Keep Supabase snapshots and the rollback release available through an agreed observation window. Do not delete or disable the source project during that window.

## Readiness blockers found in this checkout

- **Billing blocks Firebase Functions.** The latest console screen reports overdue or invalid payment information; an earlier CLI response said closed. Resolve the payment/billing profile in Google Cloud Billing > Payment overview and verify the account is in good standing before retrying Functions deployment. The read-only public Firestore staging check currently passes. A local Vercel API adapter is available as a Functions runtime alternative, but it has not been deployed and Firebase Auth/Firestore still depend on the Google project staying active.
- **App Engine is ready.** The approved App Engine Admin API was enabled and the app is provisioned in `asia-south1` with `CLOUD_FIRESTORE`; its state reads `SERVING`. This region choice cannot be changed later.
- **Runtime now fails closed to Firebase.** `src/lib/supabase.ts` exports a disabled proxy, and `isSupabaseConfigured()` always returns false. A production build also fails if the configured Firebase project is absent or does not match the staging ID. A bundle scan found no Supabase endpoint or SDK strings. Legacy Supabase branches are unreachable; migration scripts still use the source database for final reconciliation and must be retired afterward.
- **Staging only.** `.env.local` configures `festronix-migration-stg26`. Do not deploy this build to the public production site yet: backend Functions are not deployed, the final delta export has not been reconciled, and the current staging pin is not a production configuration.
- **Payment and mail secrets.** Functions require `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `REGISTRATION_ROLL_CLAIM_SECRET`, and `BREVO_API_KEY`. Install these in Firebase Secret Manager after billing is active; never put them in `VITE_*` variables or Git. Payment Functions cannot be tested until secrets are configured.
- **Files.** Supabase Storage objects have not been copied to Firebase Storage, and Firebase Storage rules deny all access. Payment screenshots are disabled in Firebase mode; historical private proof objects still need count/hash/access reconciliation before the source bucket can be retired.
- **Auth and QR recovery.** The 43 imported staff identities were read-back verified, but two passwordless accounts need an intentional reset/sign-in path and representative staff password sign-in still needs testing. Public registration remains guest-only. Team invite membership is now locked after checkout to prevent unpaid members without a valid ticket/QR.
- **Data and operations.** The 309-document staging snapshot matches its manifest, but source changes since that snapshot need a fresh export/delta reconciliation. Payment idempotency, capacity contention, webhook replay, refunds, outbox retry, staff portals, and production check-in have not passed end-to-end staging verification.
- `scripts/export-supabase-migration.ps1` remains a source-migration utility. It prompts for the Postgres URI as hidden input and writes data only under `%LOCALAPPDATA%\FestronixMigration\supabase-export`; no credential or production data is tracked in the repository. Retire source export and one-time Supabase sync scripts after final reconciliation.

## Official Firebase references

- [Firestore transactions and batched writes](https://firebase.google.com/docs/firestore/manage-data/transactions)
- [Firestore locations](https://firebase.google.com/docs/firestore/locations)
- [Firestore security rule conditions and server SDK behavior](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Firebase Authentication user import, including BCRYPT](https://firebase.google.com/docs/auth/admin/import-users)
- [Firebase CLI Auth import/export formats](https://firebase.google.com/docs/cli/auth)
- [Supabase password storage and bcrypt](https://supabase.com/docs/guides/auth/password-security)
- [Supabase Auth user data and managed schema](https://supabase.com/docs/guides/auth/managing-user-data)
- [Supabase Storage access control](https://supabase.com/docs/guides/storage/security/access-control)
- [Web App Check setup and staged enforcement](https://firebase.google.com/docs/app-check/web/recaptcha-provider)
- [Firebase billing plans and Cloud Functions availability](https://firebase.google.com/docs/projects/billing/firebase-pricing-plans)
