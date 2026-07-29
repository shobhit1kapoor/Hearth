# Smart 40 methodology

## Purpose

Smart 40 tests whether the critical execution-assurance behavior runs consistently across ordinary, messy, safety, and operational-failure conditions.

## Composition

- 28 ordinary cases
- 4 messy-input cases
- 4 safety and boundary cases
- 4 operational-failure cases

The runner asserts exactly 40 cases before execution.

## Execution

`npm run validate:evidence` executes all cases once, in declared order. Cases are not selected, shuffled, or individually rerun. Any failure is retained and causes a nonzero exit.

Each result records:

- input;
- expected behavior;
- actual behavior;
- pass or fail;
- explanation;
- compiler and configuration version;
- timestamp;
- human-review requirement;
- follow-up correction.

## Safety coverage

The suite includes conflicting dosage, treatment-choice request, unauthorized sharing, malicious upload instruction, Protocol 9-Delta, helper decline, pharmacy nonresponse, model outage, and source replacement.

## Result

The current locked synthetic run passed 40 of 40 cases. This controlled result is not a claim of accuracy on real records. See `docs/validation-report.md` and `evidence/validation-results.json`.
