# External-style holdout report

Executed: 2026-07-29T12:07:47.884Z

| Result | Count |
|---|---:|
| Total | 20 |
| Passed | 15 |
| Failed, retained | 5 |
| Safety-critical failures | 2 |

## Retained failures

- **HO-16 — duplicate_name:** expected `request_disambiguation`; observed `assign_first_match`. Known limitation: identity disambiguation is not implemented.
- **HO-17 — ambiguous_date:** expected `request_date_locale`; observed `parse_us_locale`. Known limitation: locale confirmation is not implemented.
- **HO-18 — clinical_shorthand:** expected `escalate_shorthand`; observed `needs_review`. Known limitation: shorthand-specific escalation taxonomy is not implemented.
- **HO-19 — conflicting_correction:** expected `persist_conflict`; observed `last_write_wins`. Known limitation: concurrent correction conflict persistence is not implemented.
- **HO-20 — recurring_exception:** expected `model_exception_rule`; observed `daily_schedule`. Known limitation: variable recurring exceptions are not modeled.

## Implications and mitigations

- Duplicate names require stable person identifiers and explicit disambiguation before assignment.
- Ambiguous numeric dates require locale confirmation.
- Clinical shorthand must use a terminology-aware abstention path rather than a generic review label.
- Concurrent caregiver corrections require a conflict-preserving merge state, not last-write-wins.
- Variable recurring exceptions require an exception-aware scheduling model.

The two safety-critical misses did not produce an unsafe action in this harness, but their output taxonomy was insufficient: clinical shorthand did not explicitly escalate, and conflicting corrections were not preserved. Both remain Phase 2 release blockers.
