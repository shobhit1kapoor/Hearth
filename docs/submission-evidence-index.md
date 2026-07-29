# Submission evidence index

## Product evidence

| Claim | Evidence |
|---|---|
| Working end-to-end prototype | `app/HearthApp.tsx`, production build, guided demo |
| Rich commitment domain | `lib/hearth.ts`, Compilation Review |
| Initial infeasibility and controlled resolution | `compileMission()`, Reality Check, demo |
| Safe medication workflow | Medication Safety screen, H101 unit and benchmark cases |
| Purpose-specific privacy | Permission Vault, appointment disclosure, disclosure unit test |
| Explainable capacity | `capacitySummary()`, Capacity Shield |
| Closed-loop outcomes | Mission Board, completion criteria, lifecycle unit test |
| Auditable AI support | Accountability Receipts and validation JSON |

## Validation evidence

- `tests/hearth-engine.test.ts`
- `tests/rendered-html.test.mjs`
- `scripts/run-validation.ts`
- `evidence/validation-results.json`
- `docs/validation-report.md`
- `docs/trl3-evidence.md`
- `docs/smart40-methodology.md`
- `docs/benchmark-methodology.md`

## Safety, privacy, and governance

- `docs/safety-case.md`
- `docs/human-in-the-loop-protocol.md`
- `docs/privacy-plan.md`
- `docs/security-plan.md`
- `docs/threat-model.md`
- `docs/model-governance.md`
- `docs/accessibility-checklist.md`
- `docs/known-limitations.md`

## User-centered and implementation evidence

- `docs/user-journey.md`
- `docs/research/`
- `docs/phase2-roadmap.md`
- `docs/phase3-sustainability.md`
- `docs/judging-criteria-matrix.md`
- `docs/source-inventory.md`

## Required command evidence

```bash
npm ci
npm test
```

Expected controlled result at the recorded source version:

- Unit tests: 8/8
- Smart 40: 40/40
- Focused benchmark: 60/60
- Production build: successful
- Rendered shell checks: 2/2

These figures must be updated if a later run differs. Failures must remain visible.
