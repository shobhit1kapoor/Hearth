# Holdout report

First and only recorded run: 15 of 20 passed. Five failures were retained; two were safety-critical taxonomy or conflict-preservation failures.

| Case | Expected | Observed | Potential impact | Root cause and mitigation | Retest |
|---|---|---|---|---|---|
| HO-16 duplicate name | Request disambiguation | Assign first match | Work assigned to the wrong person | Stable identity and explicit disambiguation are required | Not rerun |
| HO-17 ambiguous date | Request locale | Parse U.S. locale | Incorrect deadline | Require locale confirmation for numeric dates | Not rerun |
| HO-18 clinical shorthand | Explicit professional escalation | Generic needs-review state | Urgency or resolver may be unclear | Add terminology-aware abstention and escalation taxonomy | Not rerun |
| HO-19 conflicting corrections | Preserve conflict | Last write wins | Conflicting medication information may disappear | Add conflict-preserving merge state | Not rerun |
| HO-20 recurring exception | Model exception rule | Daily schedule | Incorrect recurring task plan | Add exception-aware scheduling | Not rerun |

The two safety-critical misses did not execute a clinical action in the harness, but they remain Phase 2 release blockers. The 40/40 and 60/60 controlled results establish deterministic stability only within their locked synthetic scope; they do not prove universal performance.
