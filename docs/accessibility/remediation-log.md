# Accessibility remediation log

| Date | Finding | Change | Verification |
|---|---|---|---|
| 2026-07-29 | Three serious sidebar text contrast failures in the first styled axe run | Replaced low-opacity sidebar text tokens with opaque, higher-contrast values | Final axe run: zero violations |
| 2026-07-29 | Focus evidence needed across the reviewer path | Added and retained visible `:focus-visible` treatment; sampled primary controls | Focus samples visible |
| 2026-07-29 | Reviewer needed a direct bypass to main content | Verified the existing skip link receives first focus and moves focus to `main` | Pass |
| 2026-07-29 | Mobile burden-study layout risk | Added responsive study layout and checked 320px overflow | Pass |
| 2026-07-29 | Submission files needed accessible structure | Generated semantic DOCX files, ran structural checks, exported tagged PDFs, and inspected every rendered page | Zero findings in the three DOCX structural reports; PDFs tagged |

Open remediations: public-build 200% zoom verification, caregiver screen-reader testing, and representative physical-device touch testing.
