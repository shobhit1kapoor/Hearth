# Manual accessibility checks

| Check | Evidence | Result |
|---|---|---|
| 320 CSS-pixel reflow | Automated welcome and burden-study overflow checks | Pass |
| Mobile navigation | Opened and confirmed visible at 320 CSS pixels | Pass |
| Skip navigation | First-focus and main-target checks | Pass |
| Visible keyboard focus | Computed-style sampling | Pass |
| Accessible names, labels, headings, and landmarks | Axe audit across three representative states | No violations detected |
| Error/state communication without color alone | Text labels accompany readiness and retained-failure colors | Pass by inspection |
| Reduced motion | No essential animation or motion-only information | Pass by inspection |
| Submission print output | Every page of the final application, appendix, and logs was rendered and visually inspected | Pass |
| 200% zoom | Required public-build manual recheck | Pending |
| Human screen-reader session with a caregiver | No eligible participant evidence was supplied | Not performed |

Human screen-reader testing with a caregiver is not complete and must not be implied by automated results.
