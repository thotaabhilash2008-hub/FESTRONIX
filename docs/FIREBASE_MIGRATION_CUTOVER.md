# Firebase migration cutover — FESTRONIX 2026

## Targets

- Source (left intact): `festronix-migration-stg26`
- Target (new authoritative project): `festronix-26---new-db`
- Migration branch: `codex/firebase-connectclub-migration`
- `main` is never used or deployed for this migration.

## What was migrated

- Firestore `(default)` in `asia-south1`.
- All top-level source collections and their documents.
- Firebase Auth accounts, including staff/coordinator accounts.
- Coordinator login emails and passwords from the provided coordinator credential document. The old project was not modified or deleted.
- No Storage bucket with objects was found in the source project.

## Verification checklist

- Firestore document counts are compared against the source manifest after each sync.
- Auth account count is compared against the source export (43 accounts).
- All 10 coordinator emails from the credential document sign in successfully in the target project.
- Preview deployment reads from `festronix-26---new-db`.
- Production keeps `VITE_COMING_SOON_ONLY=true` so the glitch reopening screen remains live.
- A separate preview deployment keeps `VITE_COMING_SOON_ONLY=false` for full-site testing.

## Runtime configuration

- `PUBLIC_SITE_URL=https://www.festronix.com`
- Firebase is authoritative at runtime; Supabase is disabled.
- Vercel project environment variables are updated in the Vercel dashboard/API only. No service account JSON, tokens, or secrets are committed to this repository.
- `.firebaserc` staging and production aliases point to `festronix-26---new-db`.

## Safety notes

- The old Firebase project remains untouched as a rollback source.
- No destructive deletion, password reset, or account removal was performed in the old project.
- PII was copied only after the project owner authorized the migration.
