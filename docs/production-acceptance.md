# Production acceptance

HEARTH is not production-ready until every item below has evidence from a configured deployment.

Automated live check: set `HEARTH_ACCEPTANCE_URL` to the deployed origin, then run `$env:RUN_PRODUCTION_ACCEPTANCE='true'; npm run validate:production` from PowerShell. It creates two temporary synthetic accounts, verifies the unknown-protocol refusal, invitation acceptance, minimum disclosure, permission revocation, and membership revocation, then deletes its test data. It accepts the app's explicit manual-invitation fallback when Resend cannot deliver. Set `HEARTH_REQUIRE_INVITE_EMAIL=true` when a verified sending domain is available and email delivery must pass.

## Required checks

1. Create account A, complete onboarding, and create a care space.
2. Reload and sign in again. Confirm the care space and recipient return from Supabase.
3. Upload a synthetic PDF. Confirm the private object, document row, analysis row, extracted commitments, and source links persist.
4. Correct, reject, confirm, assign, accept, start, complete, and verify appropriate tasks. Reload after each major step and confirm the event history remains.
5. Create account B. Confirm it cannot read account A’s care space before invitation.
6. Invite account B with one task category. Confirm it sees only the permitted logistics.
7. Revoke account B. Confirm access fails immediately after reload and through direct API requests.
8. Upload two conflicting synthetic medication instructions. Confirm neither is chosen and professional review is required.
9. Disable NVIDIA temporarily. Confirm upload analysis fails safely without invented commitments or false completion.
10. Test quiet hours. Confirm routine messages delay and safety/professional-review messages remain visible.
11. Translate a synthetic medication instruction. Confirm original and translation are both stored and protected terms are unchanged.
12. Request export and open the downloaded file.
13. Confirm deletion, then verify private objects and active records are gone and the minimal deletion record has no care content.
14. Confirm Upstash limits repeated abuse, Resend delivers a generic invitation from a verified domain, and Sentry records a scrubbed test error. Until the domain is verified, confirm the UI clearly gives the caregiver the manual sign-in step without exposing care details.
15. Run `npm test`, `npm run lint`, `npm run typecheck`, `npm run build`, and the accessibility audit against the deployment.

Record the deployment URL, commit SHA, migration version, date, tester, evidence, and result. Any failed isolation, permission, medication-conflict, deletion, or false-completion check is release-blocking.
