# Production setup

## Environment variables

Copy `.env.example` to `.env.local`. Never commit `.env.local`.

### Application controls

- `NEXT_PUBLIC_APP_URL`: exact deployed origin.
- `PUBLIC_DEMO_MODE`: keeps the synthetic reviewer entry available.
- `ALLOW_REAL_PATIENT_DATA`: default `false`; requires a separate approved privacy decision.
- `ENABLE_REAL_AI`: enables NVIDIA only when a key is present.
- `ENABLE_EXTERNAL_EMAIL`: enables Resend only when a key is present.

### Supabase

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` — server only.

Apply `supabase/migrations/202607300001_hearth_core.sql`. It creates the complete data model, indexes, private storage buckets, role helpers, RLS policies, user-profile trigger, and atomic onboarding function.

### NVIDIA NIM

- `NVIDIA_API_KEY` — server only.
- `NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1`
- `NVIDIA_MODEL=moonshotai/kimi-k2.6`

The provider uses bounded retries, a timeout, strict JSON parsing, and Zod validation. Failure leaves work in a safe waiting state.

### Upstash, Resend, and Sentry

- `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`
- `RESEND_API_KEY`, `EMAIL_FROM`
- `NEXT_PUBLIC_SENTRY_DSN`, `SENTRY_AUTH_TOKEN`

Invitations contain no diagnosis, medication, document, or task detail. Sentry processing removes request bodies, user identity, and breadcrumbs before transmission.

### Security

- `DATA_ENCRYPTION_SECRET`: at least 32 characters.
- `CRON_SECRET`: at least 24 characters.

Generate secrets with a cryptographically secure password manager. Do not paste them into source files, tickets, screenshots, or chat.

## Database and storage

The migration creates:

- profiles, care spaces, members, recipients;
- source documents, pages, analysis runs;
- care commitments, sources, events, escalations, receipts;
- permissions and permission history;
- notification preferences, notifications, quiet hours;
- translations and capacity snapshots;
- audit events, exports, deletions;
- demo and validation records.

Private buckets:

- `care-documents`
- `caregiver-notes`
- `generated-exports`

Documents are limited to PDF, JPG, PNG, or plain text and 10 MB. Duplicate hashes are detected. Public storage URLs are not used.

## Notifications and translation

Routine notifications respect per-category choices and quiet hours. Safety-critical and professional-review messages bypass quiet-hour delay.

Translations store original and translated text together. Medication names, doses, numbers, units, dates, and identifiers are protected terms. Any preservation failure requires human verification.

## Export and deletion

Authenticated export returns a real JSON download of the care space’s allowed data. Deletion requires explicit confirmation, removes private storage through the server, soft-deletes active domain data, revokes members, and keeps only a minimal non-clinical deletion record.

## Vercel deployment

1. Import the GitHub repository into Vercel.
2. Add all required environment variables separately for Preview and Production.
3. Set `NEXT_PUBLIC_APP_URL` to the deployed origin.
4. Deploy using the checked-in `vercel.json`.
5. Add the Vercel callback URL to Supabase Auth.
6. Run [production acceptance](production-acceptance.md) against the deployed URL.

Do not enable real patient data simply because deployment succeeds. Deployment and privacy approval are separate controls.
