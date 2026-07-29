# Safety case

## Claim

Within locked synthetic Phase 1 conditions, HEARTH prevents unsupported high-risk instructions from becoming active and routes unresolved execution risks to the appropriate human.

## Safety invariants

1. AI cannot change medication name, dose, route, frequency, or treatment.
2. A newer source does not silently resolve a conflicting clinical instruction.
3. An AI authority level can never lower a source-assigned safety level.
4. H3 issues require qualified professional review.
5. Unknown, missing, contradictory, outdated, unreadable, or unsupported instructions stop only affected work.
6. External actions default to Prepare and require caregiver approval.
7. Task completion requires outcome evidence.
8. Unauthorized disclosure is blocked before adapter preparation.
9. Embedded instructions in uploads cannot override HEARTH policy.
10. Every consequential action generates an auditable receipt or event.

## Implemented evidence

- `compileMission()` deterministically produces H101, H203, H306, H411, H508, H604, H710, H808, and H702 findings.
- The initial mission has six unresolved high-risk blockers and is `NOT EXECUTABLE`.
- `pharmacistQuestionPrepared` does not resolve H101; professional resolution and human confirmation are separately required.
- Protocol 9-Delta produces an exact H3 abstention.
- Transportation disclosure withholds four sensitive categories.
- Unit tests and 100 controlled validation cases cover these invariants.

## Residual risk

The prototype uses structured fixtures. It does not establish safety for real OCR, speech, clinical text, model outputs, identity, integrations, or real homes. Those require hazard review, usability engineering, monitoring, rollback, professional oversight, and independent evaluation in Phase 2.
