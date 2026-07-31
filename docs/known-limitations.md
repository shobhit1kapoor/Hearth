# Known limitations

## Production connection status

The real caregiver architecture is implemented, but Supabase, NVIDIA, Upstash, Resend, and Sentry are not configured. The migration has not been applied to a live database, and the end-to-end persistence acceptance suite has not been run. Real caregiver mode therefore shows a clear configuration blocker and does not accept patient data.

The public Vercel reviewer case remains synthetic. It demonstrates the workflow but does not prove live AI quality, email delivery, cross-account RLS behavior, or production deletion.

## Evidence and research

- Caregiver interview materials were unavailable; no real user findings or quotes are represented.
- The synthetic benchmark was authored alongside the deterministic implementation and has not been independently labeled.
- No two-reviewer adjudication has occurred.
- No timed burden-reduction study has occurred.
- No subgroup, fairness, or real-world error analysis has occurred.

## Product and AI

- Inputs are seeded structured fixtures; there is no real upload, OCR, transcription, FHIR parsing, or live model extraction.
- Corrections and demo state are in memory and reset on refresh.
- Compiler findings are deterministic and case-specific, not general clinical reasoning.
- H4 urgent redirection is a documented boundary, not a production emergency pathway.
- The prototype is not for clinical use and cannot establish whether emergency care is or is not needed.

## Integrations and operations

- Pharmacy, provider, appointment, helper, community-resource, export, and deletion actions are simulations.
- There is no delivery guarantee, retry queue, reconciliation service, or external acknowledgement.
- There is no real low-bandwidth text or email channel.

## Privacy and security

- There is no production authentication, authorization, household isolation, persistence, encryption, audit store, secure deletion, backup, or incident response.
- Revocation is represented in local interface state only.
- No HIPAA, Section 508, WCAG, FDA, or other certification is claimed.

## Accessibility

- Semantic and responsive controls were implemented, but independent screen-reader, keyboard, zoom, contrast, cognitive, and disability-led testing remains required.

## Partnerships and sustainability

- No partner relationship, letter of support, reimbursement pathway, price, federal adoption, or long-term financing commitment is claimed.
