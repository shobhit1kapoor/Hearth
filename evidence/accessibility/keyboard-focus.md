# Keyboard and focus test

Automated keyboard sampling was executed in Playwright Chromium against the final styled local build on 2026-07-29. The public deployment is rechecked separately after release.

| Check | Method | Result |
|---|---|---|
| Skip link receives first focus | Tab from a fresh page load | Pass |
| Skip link reaches main content | Enter on the focused skip link | Pass |
| Sidebar navigation | Sequential Tab traversal and activation sampling | Pass |
| Reviewer demo controls | Sequential Tab traversal and activation sampling | Pass |
| Burden-study controls | Axe name/role/value checks plus keyboard focus sampling | Pass |
| Visible focus indicator | Computed focus style sampled across primary controls | Pass |
| 320px mobile navigation | Open and inspect from a 320 CSS-pixel viewport | Pass |

The audit found no trapped focus or sampled keyboard-inaccessible primary operation. This is engineering QA, not a substitute for a complete screen-reader session with caregivers.
