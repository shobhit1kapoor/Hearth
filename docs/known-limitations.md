# Known limitations

## Production connection status

The public Vercel deployment is demo-only. It does not expose account creation, sign-in, uploads, or private caregiver workflows. The repository retains those implementations for future controlled testing; Supabase, NVIDIA, Upstash, and Sentry have been configured and their synthetic acceptance checks passed. External email is intentionally disabled.

Real patient data is disabled on the public deployment. Automatic family email and public account access are outside the current launch scope. Before any private caregiver launch, the broader production-acceptance checklist still requires evidence for synthetic PDF persistence, export, deletion, outage behavior, and external-service observability.

## Evidence and research

- Caregiver interview materials were unavailable; no real user findings or quotes are represented.
- The synthetic benchmark was authored alongside the deterministic implementation and has not been independently labeled.
- No two-reviewer adjudication has occurred.
- No timed burden-reduction study has occurred.
- No subgroup, fairness, or real-world error analysis has occurred.

## Product and AI

- Reviewer-mode inputs are seeded synthetic fixtures. The unexposed private caregiver implementation supports PDF, image, and text uploads with live model extraction. It does not provide FHIR ingestion or transcription.
- Reviewer-mode state is intentionally resettable. Private caregiver state persists in Supabase.
- Controlled compiler findings are deterministic and case-specific; live model output remains subject to strict schemas, abstention controls, and human review.
- H4 urgent redirection is a documented boundary, not a production emergency pathway.
- The prototype is not for clinical use and cannot establish whether emergency care is or is not needed.

## Integrations and operations

- Pharmacy, provider, appointment, and community-resource acknowledgements remain simulated. Family invitation delivery, persistence, export requests, and deletion requests have real adapters, but the full operational checklist is not yet complete.
- There is no delivery guarantee, retry queue, reconciliation service, or external acknowledgement.
- There is no real low-bandwidth text or email channel.

## Privacy and security

- Production authentication, row-level authorization, household isolation, private storage, persistence, and audit records are implemented. Immediate database-level revocation is covered by the live two-account check.
- Independent penetration testing, backup-restore testing, incident-response exercises, formal key rotation, and secure-deletion verification remain outstanding.
- No HIPAA, Section 508, WCAG, FDA, or other certification is claimed.

## Accessibility

- Semantic and responsive controls were implemented, but independent screen-reader, keyboard, zoom, contrast, cognitive, and disability-led testing remains required.

## Partnerships and sustainability

- No partner relationship, letter of support, reimbursement pathway, price, federal adoption, or long-term financing commitment is claimed.
