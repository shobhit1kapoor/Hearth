# Security plan

## Phase 1

The current build is a public, synthetic-data prototype. It has no production accounts, secrets, clinical integrations, or durable household database. Client interactions change in-memory demonstration state.

Implemented controls include:

- strict TypeScript and deterministic safety rules;
- no committed credentials or service tokens;
- no real personal or health information;
- task-level disclosure preview;
- simulated cross-household and unauthorized-access denials;
- explicit prompt-injection boundary;
- safe, nonclinical error language;
- visible source and model/configuration versions in receipts and evidence;
- dependency lockfile and reproducible build.

## Phase 2 security architecture

- Unique users with phishing-resistant MFA where feasible.
- Short-lived, secure, same-site sessions and explicit session expiration.
- Household tenant identifier on every object; deny-by-default row and service policies.
- Role and task authorization checked server-side for every read, mutation, export, and adapter action.
- Envelope encryption for sensitive fields; TLS in transit.
- Managed secret storage; no credentials in clients or repositories.
- Immutable, redacted audit events with actor, household, purpose, policy decision, source version, model version, and request correlation.
- Safe backup, recovery, deletion, and key-rotation procedures.
- Software composition analysis, static analysis, dependency update policy, threat-model review, penetration testing, and incident response.

## Required test expansion

Real identity, tenancy, session, storage, and integration security cannot be established in the current static prototype. Before pilot data, test unauthorized access, cross-household access, expired and revoked permission, duplicate identity, log leakage, export, deletion, model and network outage, source tampering, and attempts to bypass professional review against the deployed architecture.
