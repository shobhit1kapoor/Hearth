# Manual accessibility test results

| Check | Result | Evidence or boundary |
|---|---|---|
| Keyboard skip navigation | Pass | First-focus and main-target checks |
| Visible focus | Pass | Computed-style sampling across primary controls |
| Focus order | Pass for sampled primary path | Full assistive-technology traversal still required |
| 320 CSS-pixel reflow | Pass | Welcome and burden-study views had no horizontal overflow |
| Mobile navigation | Pass | Navigation opened and remained usable at 320px |
| Color-independent status | Pass by inspection | Readiness and retained failures include text labels |
| Form labels and instructions | No axe violations | Timed-study controls included in representative audit |
| Printable output | Pass | All 60 pages across the final application, appendix, and logs were rendered and visually inspected |
| Tagged PDF output | Pass | All three final PDFs report `Tagged: yes` |
| 200% zoom | Pending public-build manual recheck | Human verification required |
| Screen-reader session with a caregiver | Not performed | No eligible participant evidence was supplied |
| Touch-target review | Sampled only | Complete device review remains Phase 2 work |

This is first-party engineering QA, not an independent accessibility certification.
