# Automated accessibility results

Executed 2026-07-29 with Playwright Chromium and axe-core against the final styled build.

| Check | Result |
|---|---|
| Page states audited | Welcome, guided reviewer demo, timed burden study |
| Axe rule violations | 0 |
| Serious or critical violations | 0 |
| Skip link receives first focus | Pass |
| Skip link moves focus to main | Pass |
| Sampled focus indicators | Pass |
| 320px mobile navigation | Pass |
| 320px welcome overflow | Pass |
| 320px burden-study overflow | Pass |

Representative contrast ratios ranged from 4.67:1 for muted text on paper to 13.81:1 for primary ink on paper. The focus amber sample measured 5.29:1 against a 3:1 non-text threshold.

Detailed machine-readable evidence is in `evidence/accessibility/results.json`. Automated testing does not establish full WCAG or Section 508 conformance.
