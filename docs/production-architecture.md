# Production architecture

## Request path

The Next.js application serves the interface and all server APIs. The browser never receives NVIDIA, Supabase service-role, Resend, Upstash, or Sentry management credentials.

1. A user signs in through Supabase Auth.
2. Server routes verify the Supabase session and active care-space membership.
3. Supabase Postgres stores households, documents, commitments, sources, permissions, events, notifications, and audit records.
4. Private Supabase Storage buckets hold source documents, caregiver notes, and generated exports.
5. The upload route validates file type and size, hashes the file, extracts local PDF text, and renders image-only pages when needed.
6. NVIDIA NIM receives bounded text or page images from the server. Kimi K2.6 output must pass a strict Zod schema before any commitment is stored.
7. Upstash limits costly or abuse-sensitive endpoints. Resend sends generic invitation messages without care details. Sentry receives scrubbed error metadata.

## Safety boundary

AI may extract, compare, explain, translate, and draft. It may not authorize treatment, resolve a medication conflict, grant access, mark an external task complete, or send a message without the required user action.

Every extracted commitment has an evidence kind, risk level, source excerpt, confidence, human-review flag, and completion-evidence rule. High-risk, uncertain, inferred, or conflicting work starts in `needs_review`.

The persistent lifecycle is:

`identified → needs_review → assigned → awaiting_acceptance → accepted → in_progress → awaiting_external_response / blocked / escalated → completed → verified`

Cancelled and superseded states remain in history. Completion and verification require evidence.

## Data isolation

The first SQL migration enables Row Level Security for every domain table. Policies use authenticated user identity, active household membership, role, category permission, revocation, and expiration. Storage paths begin with the care-space UUID and use the same membership checks.

The service-role key is limited to server-only deletion and administrative cleanup paths. Normal reads and writes use the signed-in user session so RLS remains authoritative.

## Public reviewer mode

The sample case is a separate, synthetic experience. It works without Supabase or NVIDIA and visibly labels all people, records, providers, and outcomes as examples. It does not enable real patient uploads or claim a live AI result.

## Legacy prototype files

The older D1/Drizzle and Vinext configuration remains only for the optional `build:sites` compatibility path. The real application runtime is Next.js on Vercel with Supabase; the authoritative database definition is the SQL migration under `supabase/migrations`.
