# HEARTH

HEARTH turns care instructions into a clear, shared plan. It helps a caregiver collect documents or notes, review extracted responsibilities, resolve uncertainty, ask family for specific help, and keep a source trail for every task.

HEARTH does not diagnose, choose between conflicting medical instructions, or change treatment. Anything uncertain or high-risk stays blocked for caregiver or professional review.

## Live reviewer build

[Open the safe synthetic reviewer build](https://hearth-care-five.vercel.app).

Choose **Try the sample case**. Real caregiver data remains disabled on this deployment because its external services are not configured.

## What you can test now

The **sample case** is fully local, synthetic, and resettable. It contains 10 example sources and 26 care responsibilities. Use it to test medication-conflict blocking, task assignment, minimum disclosure, permissions, workload support, translation safety, and the nine-step reviewer tour.

The **real caregiver workspace** is implemented but intentionally unavailable until Supabase and the other approved services are configured. It never silently substitutes browser-only storage for real persistence.

## Start the app

You need Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Open the address printed by Next.js. It is normally `http://localhost:3000`.

Choose:

- **Try the sample case** to test immediately with made-up information.
- **Create my care space** to test the real sign-up and persistent workflow after services are configured.

Do not enter real patient information in a local or reviewer deployment.

## Run all checks

```bash
npm test
npm run lint
npm run typecheck
npm run validate:accessibility
npm audit --omit=dev
```

`npm test` runs lifecycle and permission checks, AI output-contract checks, database/RLS checks, the Smart 40 and focused benchmark, a production build, and server-render checks.

## Configure real caregiver mode

1. Copy `.env.example` to `.env.local`.
2. Create a Supabase project and apply `supabase/migrations/202607300001_hearth_core.sql`.
3. Fill in the Supabase browser and server keys.
4. Add NVIDIA NIM, Upstash, Resend, and Sentry settings.
5. Keep `ALLOW_REAL_PATIENT_DATA=false` until an approved privacy and deployment review says otherwise.
6. Run the persistence acceptance test in [docs/production-acceptance.md](docs/production-acceptance.md).

Configuration details are in [docs/production-setup.md](docs/production-setup.md). Architecture and safety boundaries are in [docs/production-architecture.md](docs/production-architecture.md).

## Current status

- Local synthetic reviewer mode: working.
- Public synthetic reviewer deployment: working at the link above.
- Production build and local automated checks: passing.
- Production dependency audit: zero known production vulnerabilities.
- Live Supabase migration, NVIDIA request, email delivery, rate limiting, and Sentry event: not yet verified because those service credentials are not configured.
- Real persistence acceptance: not yet run.

HEARTH is not a medical device, clinical decision system, or emergency service. All reviewer data is synthetic.
