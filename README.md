# HEARTH

**Home Execution Assurance, Resilience, and Trust Hub**

HEARTH is a caregiver-first care-execution and coordination proof of concept for Track 1 of the U.S. Administration for Community Living Caregiver AI Prize Challenge. It addresses the first 30 days after an older adult with dementia and multiple chronic conditions returns home from a hospital or rehabilitation facility.

This repository is a Technology Readiness Level 3 controlled prototype. It is not a clinical tool, medical device, production health record, or real provider integration.

## What works

- A resettable synthetic post-discharge case with 10 sources and 26 Care Commitment Objects.
- A deterministic Reality Check that begins at `NOT EXECUTABLE` and reaches `READY WITH CONTROLS` only after permitted resolutions.
- Exact provenance, confidence, safety authority, consent, completion evidence, backup, escalation, and event history on every responsibility.
- Explicit medication-conflict blocking and professional escalation.
- Purpose-specific transportation disclosure that withholds diagnosis, medication, insurance, and caregiver-private data.
- Explainable caregiver-capacity calculation and permission-aware redistribution.
- Closed-loop lifecycle views where drafts and sent messages do not equal completion.
- Accountability Receipts, access history, revocation, export, and deletion-request controls.
- Smart 40 and a 60-case focused benchmark with reproducible JSON and readable reports.
- Responsive, keyboard-operable, printable screens for the complete reviewer journey.

## What is simulated

Pharmacy, provider, appointment, family-helper, community-resource, FHIR-like, export, and deletion outcomes are controlled Phase 1 simulations. They are visibly labeled in the interface. There are no real health-system connections.

## Run locally

Requirements: Node.js 22.13 or newer.

```bash
npm ci
npm run dev
```

Open the local address printed by the development server.

## Verify

```bash
npm test
```

The command runs unit safety checks, the consecutive Smart 40, the 60-case focused benchmark, a production build, and server-render checks. Generated evidence is written to:

- `evidence/validation-results.json`
- `docs/validation-report.md`

## Reviewer demo

Open **Guided reviewer demo** in the application and select **Reset demo**. Follow the nine controlled actions. The mission changes from `NOT EXECUTABLE` to `READY WITH CONTROLS`; clinical uncertainty remains assigned to qualified professionals and task-specific access remains in force.

The detailed script is in [docs/demo-script.md](docs/demo-script.md). The evidence map is in [docs/submission-evidence-index.md](docs/submission-evidence-index.md).

## Evidence honesty

- All people, organizations, records, outcomes, and timestamps in the product are synthetic.
- No caregiver interview material was available in this workspace; research documents are marked awaiting evidence and contain no invented participants or quotations.
- Deterministic fixture results do not establish clinical effectiveness or real-world accuracy.
- Net workflow time saved is not reported because timed caregiver testing has not occurred.
- HEARTH makes no claim of HIPAA certification, FDA status, federal endorsement, reimbursement, or partner commitment.

## Documentation

The `docs/` directory covers product scope, domain model, safety, privacy, security, accessibility, threat modeling, model governance, validation, roadmaps, judging traceability, research placeholders, and known limitations.

Official challenge requirements reviewed:

- [ACL Caregiver AI Challenge](https://acl.gov/caregiver-ai-challenge)
- [Track 1 Phase 1 judging criteria](https://acl.gov/caregiver-ai-judging-track1)
- [Phase 1 application outline](https://acl.gov/caregiver-ai-application-outline)
- [Technology readiness guide](https://acl.gov/caregiver-ai-tech-readiness-guide)
- [Definitions, FAQs, and resources](https://acl.gov/caregiver-ai-definitions-faq)

HEARTH does not use ACL, HHS, or other government seals and does not imply federal endorsement.
