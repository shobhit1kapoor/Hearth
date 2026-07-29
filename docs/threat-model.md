# Threat model

## Protected assets

- Care-recipient clinical and identity data.
- Caregiver-private notes and availability.
- Permission grants and supported-decision records.
- Care Commitment Objects, completion evidence, and audit history.
- External messages, adapter credentials, and model inputs.

## Trust boundaries

1. Caregiver browser to HEARTH service.
2. Household identity and authorization service.
3. File/OCR/transcription pipeline.
4. AI/model service.
5. Provider, pharmacy, insurer, family, and community adapters.
6. Audit and analytics pipeline.

## Priority threats and mitigations

| Threat | Consequence | Phase 1 control | Phase 2 requirement |
|---|---|---|---|
| Malicious PDF prompt injection | Safety policy bypass | Uploaded text treated as data; test case retained | Isolated parsing, content labeling, policy engine, adversarial suite |
| Unauthorized family access | Sensitive disclosure | Minimum-necessary preview and denial cases | Server authorization on every object and field |
| Cross-household object reference | Horizontal access | Synthetic denial shown in access log | Tenant-scoped identifiers, row policies, negative tests |
| Expired or revoked permission | Continued sharing | Immediate local revocation state | Central policy evaluation and adapter token invalidation |
| Fake clinical instruction | Harmful activation | H3 abstention and provenance requirement | Source authentication and professional confirmation |
| Source modification | Incorrect care plan | Source version and supersession history | Integrity hashing, signed source metadata, alerts |
| Sensitive logs | Secondary exposure | Synthetic data and no client analytics | Redaction pipeline, allowlisted fields, log access policy |
| Model outage or error | Silent unsafe progression | Deterministic views and failure cases | Degraded mode, circuit breaker, queue, human fallback |
| Adapter replay | Duplicate external action | Simulated action receipts | Idempotency keys and outcome reconciliation |
| Caregiver account takeover | Household control loss | Not implemented | MFA, anomaly detection, recovery safeguards |

## Abuse cases

- A helper requests an entire chart for a transport task.
- An upload commands HEARTH to ignore safety rules.
- A user asks the system to choose a dose from conflicting sources.
- A guessed household identifier is used to fetch another mission.
- A revoked helper reuses an earlier link.
- A model output attempts to lower H3 to H1.

The current proof of concept demonstrates policy intent. It does not provide production security assurance.
