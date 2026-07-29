# Phase 1 scope

## Implemented

- One end-to-end synthetic post-discharge mission.
- Ten source types and 26 Care Commitment Objects.
- Deterministic compiler findings for conflicting instructions, missing skill, missing equipment, permission boundaries, capacity overload, missing transport, superseded sources, insufficient evidence, and unacknowledged follow-up.
- Four mission states in the domain model, with `NOT EXECUTABLE` and `READY WITH CONTROLS` exercised in the demo.
- Closed-loop responsibility lifecycle and event history.
- Deep medication and appointment workflows.
- Permission Vault, Care Circle, Capacity Shield, Accountability Receipts, and access log.
- Adjustable autonomy from Organize through Delegate, with Prepare as default.
- Controlled adapters that visibly identify themselves as simulations.
- Smart 40, 60-case focused benchmark, unit tests, production build, and rendered shell checks.

## Intentionally not implemented

- Production identity, authentication, household tenancy, storage, encryption, or deletion execution.
- Real PDF/OCR, speech recognition, clinical natural-language models, or medical terminology service.
- Real pharmacy, provider, insurer, health system, community service, email, text, or FHIR connections.
- Clinical decision support, diagnosis, treatment recommendations, or emergency triage.
- Real caregiver-research synthesis, usability testing, or burden-reduction results.
- Regulatory certification or compliance attestation.

The proof of concept tests whether the central execution-assurance logic can work under locked synthetic conditions. Production infrastructure and real-world evaluation belong to later phases.
