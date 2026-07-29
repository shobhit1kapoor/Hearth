# Holdout methodology

The 20 external-style cases and separate ground truth were written, hashed, and locked before the first execution. They were not copied from the Smart 40 or focused 60 fixtures. The cases cover ambiguity, permissions, injection, outages, correction conflicts, source replacement, and unsupported requests; they are synthetic external-style cases, not independently collected clinical records.

Lock version: `2026-07-29.1`  
Case SHA-256: `d6c64f2a997682c8aa206bafb4d4e3f07a703b47f2133d8dfe667ec79600faeb`  
Ground-truth SHA-256: `b4954d2511a88d066c5312bdfc190c095f337bfe9d60dd2e40d6c7b038db3fd6`

The runner refuses changed inputs and a second recorded run. The first and only recorded result is preserved in `evidence/holdout/results.json`; failed items were not tuned and rerun under the holdout label.
