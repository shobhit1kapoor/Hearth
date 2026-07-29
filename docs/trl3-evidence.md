# TRL-3 evidence

ACL guidance states that Phase 1 entries cannot be only an idea. HEARTH demonstrates critical functions in controlled conditions.

## Critical functions demonstrated

| Function | Working evidence | Test evidence |
|---|---|---|
| Convert fragmented inputs into responsibilities | 10 sources and 26 CCOs in `lib/hearth.ts` | Unit provenance test; Smart 40 ordinary cases |
| Detect conflicting medication instructions | H101 with exact dose excerpts | Unit conflict test; S40-O21, S40-S02, B-M01–10 |
| Abstain from unknown instruction | H808 and Protocol 9-Delta | Unit exact-output test; S40-S01 |
| Enforce permission boundary | Daniel transportation preview | Unit disclosure test; S40-O22, S40-S03, B-C01–10 |
| Detect execution infeasibility | Initial six blockers and capacity deficit | Initial-state unit test; S40-O26 |
| Maintain closed-loop state | Mission board and completion criteria | Unit lifecycle test; B-W01–10 |
| Reach controlled executable state | Guided nine-step demo | Ready-with-controls unit test; S40-O28 |
| Produce auditable evidence | Receipts and generated validation logs | 100 consecutive deterministic cases |

## Reproducibility

Run:

```bash
npm ci
npm test
```

The suite records inputs, locked expectations, actual behavior, pass/fail, explanation, compiler/configuration version, timestamp, human-review requirement, and follow-up correction. It does not select passing cases or rerun failures.

## Interpretation boundary

The evidence establishes deterministic behavior on the provided synthetic fixtures. It does not establish clinical validity, generalization, usability, burden reduction, fairness, accessibility conformance, security certification, or real-world deployment readiness.
