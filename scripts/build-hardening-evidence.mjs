import { mkdir, readFile, writeFile } from "node:fs/promises";

const holdout = JSON.parse(await readFile("evidence/holdout/results.json", "utf8"));
const validation = JSON.parse(await readFile("evidence/validation-results.json", "utf8"));

const files = {
  "docs/research/interview-source-inventory.md": `# Caregiver interview source inventory

Status as of 29 July 2026: **no consented caregiver interview record was supplied to this repository or the Codex attachment set.**

## Sources checked

| Location | Finding |
|---|---|
| Repository fixtures | One synthetic caregiver voice-note fixture; not research |
| Repository research folder | Methods and placeholders only |
| Supplied build briefs | Requirements, not participant evidence |
| Audio, transcript, survey, note, or coded-data files | None found |

No participant identifier, profile, theme, quote, recommendation, or product change is claimed from real interviews. This is a submission-readiness gate because the Track 1 judging criteria ask how caregivers informed or co-implemented the solution.

## To clear the gate

Supply a consent and use record, a de-identified transcript or structured notes, participant context that cannot reasonably re-identify the person, and permission for competition use. A researcher must then complete the codebook, theme analysis, quote verification, insight-to-design matrix, and design change log below.
`,
  "docs/research/interview-method.md": `# HEARTH caregiver interview method

## Purpose

Test whether HEARTH addresses genuine post-discharge coordination burdens, identify disconfirming evidence, and involve caregivers in deciding which workflows should be built or rejected. This method is ready for use but has **not yet been executed with a supplied participant record**.

## Proposed sample

Recruit 5–8 unpaid adult caregivers with variation in relationship, employment, digital comfort, rural/urban setting, disability access needs, and care complexity. Include at least two people who recently coordinated a hospital-to-home transition. Do not exclude a person because they dislike or avoid AI.

## Consent and data minimization

Use a written consent script covering voluntary participation, recording choice, competition use, withdrawal, quote approval, and the fact that HEARTH is not clinical care. Assign study IDs only after consent. Do not collect names of care recipients, diagnoses, addresses, phone numbers, dates of birth, record numbers, or medication instructions. Store the consent record separately from study notes.

## Session

1. Context interview (15 minutes): what had to happen after a transition, what was difficult, what was missed, and who coordinated it.
2. Artifact walkthrough (10 minutes): participant describes their current paper, portal, text, and memory workflow.
3. Prototype tasks (20 minutes): locate responsibilities, detect uncertainty, delegate with privacy limits, verify completion, and correct an extraction.
4. Timed comparison (optional 20 minutes): run the fixed burden-study task set in counterbalanced manual and assisted conditions.
5. Debrief (10 minutes): trust, language, control, usefulness, harmful or unwanted behavior, and willingness to use.

## Analysis

Two reviewers independently code the first two records, reconcile definitions, then code the remainder. Mark each observation as direct report, observed behavior, interpretation, or proposed design response. Retain contradictory views. A quote is usable only after checking it against the source and the participant’s quote permission.
`,
  "docs/research/anonymized-participants.md": `# Anonymized participant register

**No participants are registered.** No real caregiver materials were supplied.

| Study ID | Consent verified | Context allowed for reporting | Session date | Quote permission | Source location |
|---|---|---|---|---|---|
| — | — | — | — | — | — |

The register must never include names, exact locations, care-recipient identity, contact details, record numbers, or unnecessary clinical details. Participant codes such as CG-01 may be created only after consent is verified.
`,
  "docs/research/interview-codebook.md": `# Caregiver interview codebook

Status: ready for use; no records coded.

| Code | Operational definition | Include | Exclude |
|---|---|---|---|
| FRAGMENTATION | Work split across paper, portals, calls, texts, or memory | Concrete coordination example | General dislike of technology |
| OWNERSHIP_GAP | A responsibility lacks an accepted owner or backup | “I thought someone else…” | A preference with no task |
| UNCERTAINTY | Instruction cannot safely be interpreted | Conflict, missing detail, unknown shorthand | Ordinary question already answered |
| CLOSED_LOOP | Need to know the external outcome, not merely that contact occurred | Acceptance, response, evidence | Message sent with no outcome |
| CAPACITY | Time, skill, equipment, or schedule limits execution | Competing work or care demands | Clinical severity alone |
| PRIVACY_CONTROL | Desired limits on what helpers see or do | Purpose, scope, expiry, revocation | General security concern |
| CORRECTION | Need to correct system extraction or source interpretation | Original must remain auditable | Silent overwrite |
| DISCONFIRMING | Evidence that HEARTH adds burden, mistrust, or risk | Rejection or alternative | Polite approval without detail |

Each coded excerpt must reference a consented source location and be labeled as direct report or analyst interpretation.
`,
  "docs/research/thematic-analysis.md": `# Thematic analysis

## Evidence status

No real interview dataset is available, so no empirical themes, saturation claim, participant count, or subgroup comparison is reported.

## Hypotheses to test

The prototype currently embodies hypotheses drawn from the challenge brief and public caregiving context: fragmented instructions create invisible coordination work; “sent” is not the same as completed; ambiguous high-risk instructions should be blocked; task-specific delegation may reduce exposure; and workload must be checked against actual time, skill, and equipment. These are **design hypotheses**, not interview findings.

## Required completion

After consented records arrive, populate a theme table with supporting and opposing excerpts, participant coverage, confidence, implications, and traceable design decisions. Report negative cases and differences by digital comfort or care context.
`,
  "docs/research/authentic-quotes.md": `# Authentic caregiver quotes

No authentic caregiver quotation is available for publication.

Do not substitute synthetic demo language, public webinar comments, paraphrases, or invented “representative” statements. A quotation may be added only after source verification and explicit quote permission. Until then, submission documents use no quotation attributed to a HEARTH participant.
`,
  "docs/research/insight-design-evidence-matrix.md": `# Insight-to-design evidence matrix

| Proposed insight | Current evidence class | HEARTH response | Real caregiver confirmation | Status |
|---|---|---|---|---|
| Responsibilities are scattered across sources | Challenge-aligned design hypothesis + synthetic case | Compilation review and CCO provenance | None supplied | Unverified |
| A message sent is not an outcome | Workflow safety principle + synthetic tests | Awaiting external response state | None supplied | Unverified |
| Ambiguous instructions should not be guessed | Safety principle + holdout tests | H3 abstention and escalation | None supplied | Unverified |
| Helpers need only task-specific details | Privacy principle + controlled tests | Minimum-necessary disclosure | None supplied | Unverified |
| Capacity includes time, skill, and equipment | Challenge-aligned hypothesis + synthetic scenario | Capacity shield and execution blockers | None supplied | Unverified |

This matrix distinguishes what has been implemented from what has been validated with caregivers.
`,
  "docs/research/design-change-log.md": `# Research-informed design change log

No design change is attributed to a real caregiver because no consented source was supplied.

| Date | Input source | Evidence | Decision | Product location | Verification |
|---|---|---|---|---|---|
| 2026-07-29 | Competition hardening brief | Timed comparison required | Added resettable eight-task burden-study mode | Timed burden study screen | Build and interaction test pending |
| 2026-07-29 | Controlled holdout failures | Duplicate names and ambiguous dates were mishandled | Retained failures; documented Phase 2 identity and locale controls | Holdout report | First run locked |
| 2026-07-29 | Accessibility review plan | Reviewers need keyboard/mobile evidence | Added explicit audit matrix and evidence capture plan | Accessibility evidence | Final checks pending |

Future rows based on caregiver evidence must include a consented source identifier and should record rejected design suggestions as well as accepted ones.
`,
  "docs/research/disconfirming-feedback.md": `# Disconfirming feedback register

No real participant feedback is available. This register is intentionally empty rather than populated with assumptions.

During research, actively ask when HEARTH would be slower, intrusive, confusing, unsafe, or unnecessary; whether paper or a human coordinator is better; what the participant would refuse to share; and what an AI system should never do. Record the decision even when no product change follows.

| Source ID | Disconfirming evidence | Severity | Decision | Rationale | Follow-up |
|---|---|---|---|---|---|
| — | — | — | — | — | — |
`,
  "docs/research/phase2-coimplementation-plan.md": `# Phase 2 caregiver co-implementation plan

## Decision authority

Create a compensated caregiver advisory group of 6–10 members. Members can veto language that implies clinical authority, define acceptable privacy defaults, prioritize the next integration, approve participant-facing study materials, and review interpreted findings before publication.

## Cadence

- Month 1: consent, accessibility preferences, workflow mapping, and risk review.
- Months 2–3: biweekly design reviews and two moderated prototype rounds.
- Months 4–6: pilot steering meetings, burden and safety dashboard review, and go/no-go decisions.

## Compensation and access

Budget $100 per 90-minute session plus reasonable accessibility, translation, connectivity, and respite accommodations. Offer phone, video, and in-person participation. Use plain-language materials and asynchronous review.

## Evidence products

Maintain consent-separated participant registers, quote approvals, coded source locations, decision logs, disconfirming cases, accessibility needs, and a public summary reviewed by members. No partner or caregiver is claimed as committed at Phase 1.
`,
  "evidence/burden-study/protocol.md": `# Timed workflow-burden comparison protocol

Status: instrument implemented; participant results not collected.

## Question

For the same eight coordination tasks, does the HEARTH-assisted condition change observed completion time, interaction count, help requests, corrections, confidence, or perceived effort compared with a manual condition?

## Design

Use a within-participant, counterbalanced comparison. Randomly assign half the participants to manual first and half to HEARTH-assisted first. Use equivalent synthetic case variants. Provide the same task definitions and stop criteria. A facilitator may answer procedural questions but cannot complete work. Record assistance.

## Primary outcome

Total seconds for all eight correctly completed responsibilities. Report medians, ranges, paired differences, task-level times, incomplete sessions, and protocol deviations. Do not report “time saved” without actual paired observations.

## Safety and privacy

Use synthetic data only. Do not enter participant names or real health information. Stop if the participant experiences discomfort or the facilitator believes the workflow could be mistaken for clinical guidance.
`,
  "evidence/burden-study/task-set.md": `# Fixed eight-responsibility task set

1. Locate the active discharge source.
2. Identify the next eight responsibilities.
3. Find conflicting or unclear instructions.
4. Assign safe owners and backups.
5. Check permission and minimum-disclosure boundaries.
6. Verify equipment and skill prerequisites.
7. Record external-response and completion criteria.
8. Produce a review-ready daily mission.

Completion requires an observable output for every step. The browser study mode records per-step time; a study reviewer separately scores correctness against the locked rubric.
`,
  "evidence/burden-study/event-schema.md": `# Burden-study event and export schema

The client exports \`hearth-burden-study/v1\` JSON with condition, anonymous session timestamps, completed tasks, per-task seconds, total seconds, interaction count, help requests, corrections, confidence (1–5), effort (1–5), optional de-identified feedback, and a plain-language interpretation warning.

The export has no prefilled identity and is not transmitted by the prototype. Participant-code linkage, if approved, must be stored separately by the research team.
`,
  "evidence/burden-study/success-measures.md": `# Burden-study success measures

## Primary

Median paired difference in correct total completion time. A directional product target is a 20% median reduction, but the study reports the observed estimate and uncertainty even if the target is missed.

## Secondary

Interactions, help requests, corrections, completion rate, confidence, perceived effort, and task-level bottlenecks. Safety errors, over-disclosure, or unsupported clinical interpretation are guardrails and cannot be traded for speed.

## Interpretation

This protocol is not powered for clinical effectiveness. Small-sample results are formative. Report missing data, order effects, participant context, and disconfirming outcomes.
`,
  "evidence/burden-study/results.md": `# Burden-study results

As of 29 July 2026: **0 participants, 0 paired comparisons, and no measured time saving.**

| Measure | Manual | HEARTH-assisted | Paired difference |
|---|---:|---:|---:|
| Sessions | 0 | 0 | — |
| Median total seconds | Not measured | Not measured | Not measured |
| Median interactions | Not measured | Not measured | Not measured |
| Median help requests | Not measured | Not measured | Not measured |
| Median corrections | Not measured | Not measured | Not measured |
| Confidence | Not measured | Not measured | Not measured |
| Perceived effort | Not measured | Not measured | Not measured |

The interactive instrument is available in reviewer mode. Any future result must be appended from exported session records under an approved protocol.
`,
  "evidence/holdout/methodology.md": `# External-style holdout methodology

The 20 cases and their ground truth were written as a separate external-style suite, hashed, and locked before the first execution. They were not drawn from the original Smart 40 or focused 60 fixtures. They resemble common transition, privacy, outage, and ambiguity patterns, but they are not independently collected clinical records.

Lock version: \`2026-07-29.1\`  
Case SHA-256: \`${holdout.run.casesSha256}\`  
Ground-truth SHA-256: \`${holdout.run.groundTruthSha256}\`

The runner refuses to execute changed files or a second run. Failures remain in \`results.json\`; no failed item was selected, tuned, or rerun.
`,
  "evidence/holdout/report.md": `# External-style holdout report

Executed: ${holdout.run.executedAt}

| Result | Count |
|---|---:|
| Total | ${holdout.summary.total} |
| Passed | ${holdout.summary.passed} |
| Failed, retained | ${holdout.summary.failed} |
| Safety-critical failures | ${holdout.summary.safetyCriticalFailures} |

## Retained failures

${holdout.results.filter((item) => !item.passed).map((item) => `- **${item.id} — ${item.kind}:** expected \`${item.expected}\`; observed \`${item.actual}\`. ${item.behavior}`).join("\n")}

## Implications and mitigations

- Duplicate names require stable person identifiers and explicit disambiguation before assignment.
- Ambiguous numeric dates require locale confirmation.
- Clinical shorthand must use a terminology-aware abstention path rather than a generic review label.
- Concurrent caregiver corrections require a conflict-preserving merge state, not last-write-wins.
- Variable recurring exceptions require an exception-aware scheduling model.

The two safety-critical misses did not produce an unsafe action in this harness, but their output taxonomy was insufficient: clinical shorthand did not explicitly escalate, and conflicting corrections were not preserved. Both remain Phase 2 release blockers.
`,
  "evidence/accessibility/automated-results.md": `# Automated accessibility results

Status: reserved for the final production-build audit. The audit will record tool/runtime, URL or artifact, timestamp, pass/fail counts, and every retained issue. No clean result is claimed before execution.
`,
  "evidence/accessibility/keyboard-focus.md": `# Keyboard and focus test

Test matrix to execute on the production build:

| Check | Method | Result |
|---|---|---|
| Skip link reaches main content | Tab then Enter | Pending |
| Sidebar and mobile navigation | Tab/Shift+Tab/Enter/Escape | Pending |
| Reviewer demo controls | Keyboard only | Pending |
| Burden-study condition, timer, sliders, buttons, textarea | Keyboard only | Pending |
| Visible focus indicator | Inspect every interactive element | Pending |
| Focus order follows visual order | Full-page traversal | Pending |

Any trapped focus, invisible focus, or keyboard-inaccessible operation is a release blocker.
`,
  "evidence/accessibility/contrast-matrix.md": `# Contrast matrix

The final audit measures text and control colors against WCAG 2.2 AA thresholds: 4.5:1 for normal text, 3:1 for large text and non-text interface components. Token pairs to test include ink/paper, muted/paper, pine/white, white/pine, red/red-soft, amber/paper, focus ring/paper, and disabled control states. Results will be inserted after production CSS is measured.
`,
  "evidence/accessibility/manual-checks.md": `# Manual accessibility checks

Required final checks: 200% zoom without loss of content or function; 320 CSS-pixel reflow; mobile navigation; reduced motion; screen-reader names for icon buttons; headings and landmarks; form labels and instructions; error/state communication without color alone; table semantics; print output; and no hover-only information.

Human screen-reader testing with a caregiver is not complete and must not be implied by automated results.
`,
  "docs/partners/outreach-list.md": `# Priority partner outreach list

No organization has been contacted or committed through this build. The candidates below are public, high-likelihood starting points; inclusion is not an endorsement or relationship claim.

| Candidate | Why it may fit | Proposed first ask | Public source |
|---|---|---|---|
| Illinois Department on Aging / Caregiver Resource Centers | Statewide caregiver support and local centers | Feedback on recruitment and referral workflow | https://ilaging.illinois.gov/programs/caregiver/crc.html |
| City of Chicago Senior Services Area Agency on Aging | City aging-network role | Chicago caregiver discovery and pilot feasibility | https://ilaging.illinois.gov/forprofessionals/areaagenciesonaging.html |
| Rush Caring for Caregivers | Caregiver support in Illinois | Research-method and co-design feedback | https://ilaging.illinois.gov/programs/caregiver/caregiver-links.html |
| AgeOptions | Suburban Cook County aging network | Community pilot and service-navigation feedback | https://www.ageoptions.org/ |
| Alzheimer’s Association Illinois Chapter | Dementia caregiver education and support | Accessibility and caregiver-control review | https://www.alz.org/illinois |
| A local health-system transition-of-care team | Discharge coordination and clinical governance | Sandbox workflow review and integration questions | To be selected |
| A Medicare GUIDE participant or dementia-care program | Caregiver support and care coordination | Fit assessment after governance review | To be selected |

Do not send protected, proprietary, or participant information in first outreach.
`,
  "docs/partners/partner-engagement-log.md": `# Partner engagement log

As of 29 July 2026, no outreach was sent and no call, meeting, pilot, letter of intent, data access, or integration commitment exists.

| Date | Organization | Contact role | Action | Response | Evidence | Next step |
|---|---|---|---|---|---|---|
| — | — | — | Candidate list prepared only | — | None | Founder approval and outreach |

This log prevents a candidate, warm lead, or drafted letter from being misrepresented as a partnership.
`,
  "docs/partners/loi-template.md": `# Nonbinding partner letter-of-intent template

**Draft—no partner has signed or approved this language.**

[Organization] is interested in exploring a time-limited, synthetic-data-first evaluation of HEARTH, a caregiver coordination proof of concept. The proposed exploration would define caregiver co-design, accessibility, governance, workflow fit, data minimization, safety escalation, and evaluation measures before any real record or external action is enabled.

This letter is nonbinding. It does not authorize data sharing, clinical use, procurement, endorsement, exclusivity, or public use of either party’s name. Any pilot requires separate approvals, security and privacy review, participant consent, accessibility planning, and a written protocol.

Proposed contribution: [caregiver recruitment / workflow expertise / sandbox integration / evaluation advice].  
Proposed period: [dates].  
Authorized representatives: [names and titles].  
`,
  "docs/partners/partner-readiness-checklist.md": `# Partner readiness checklist

- [ ] Executive sponsor and operational owner identified
- [ ] Caregiver advisory role and compensation approved
- [ ] Synthetic-data-first scope accepted
- [ ] Privacy, security, accessibility, clinical-safety, and legal review owners named
- [ ] Identity, consent, revocation, retention, export, and deletion rules defined
- [ ] Escalation contacts and response windows approved
- [ ] EHR/portal, pharmacy, scheduling, messaging, and resource-directory integration boundaries documented
- [ ] Evaluation protocol, adverse-event process, and stop criteria approved
- [ ] Staff training and caregiver support plan approved
- [ ] Public communications and name/logo permissions documented
`,
  "docs/partners/integration-questions.md": `# Partner integration questions

1. Which source systems are authoritative for discharge instructions, medicines, appointments, and care-team messages?
2. How are document version, amendment, staleness, and revocation represented?
3. Which actions may be prepared, and which require caregiver or licensed-professional approval?
4. How are household members identified and linked without relying on duplicate names?
5. Can purpose, field scope, expiry, revocation, and caregiver-private notes be enforced?
6. What acknowledgement and outcome events prove that an external workflow closed?
7. What outages, rate limits, accessibility constraints, and support hours apply?
8. What audit, export, deletion, incident, and data-residency requirements apply?
9. Who owns clinical terminology, high-risk conflict, and escalation review?
10. Which FHIR, portal, messaging, scheduling, or directory sandbox is available?
`,
  "docs/partners/unresolved-partner-dependencies.md": `# Unresolved partner dependencies

The following are not available in Phase 1: a committed caregiver recruitment channel; clinical governance; production identity and consent; real-data authority; EHR, pharmacy, appointment, messaging, home-health, or resource-directory integration; response-time commitments; security review; accessibility accommodations; incident response; data retention and deletion policy; reimbursement path; and signed pilot scope.

The reviewer demo labels every external outcome as a simulation. These dependencies are Phase 2 gates, not hidden implementation claims.
`,
  "docs/sustainability/assumptions.md": `# Affordability assumptions

The model is directional planning, not a quote or validated business forecast.

- Six-month pilot with 100 enrolled caregiver households and 75 monthly active households.
- Synthetic/sandbox integration first; no EHR production interface fee included.
- One implementation lead at 0.75 FTE, one engineer at 0.75 FTE, research/accessibility support at 0.30 FTE, and clinical/privacy advisory support at 0.15 FTE.
- Loaded personnel cost includes compensation, payroll burden, and contractor overhead.
- Cloud usage assumes text/document workloads, audit storage, monitoring, and support; no advertising or personal-data monetization.
- Partner staff time, participant respite, translation, and accessibility accommodations are explicitly budgeted.
`,
  "docs/sustainability/cost-model.md": `# HEARTH six-month pilot cost model

| Cost category | Six-month cost | Basis |
|---|---:|---|
| Product engineering | $54,000 | 0.75 FTE loaded |
| Implementation and partner operations | $45,000 | 0.75 FTE loaded |
| Caregiver research, compensation, accessibility, translation | $18,000 | Sessions, accommodations, analysis |
| Clinical, privacy, security, and evaluation advisors | $12,000 | Part-time review |
| Cloud, monitoring, document processing, and support tools | $6,000 | 100 enrolled households |
| Contingency | $10,000 | Integration and accommodation variance |
| **Total** | **$145,000** | Six months |

At 100 enrolled households, the gross pilot cost is **$1,450 per enrolled household** or **$1,933 per assumed monthly active household**. Those figures include one-time setup and research.

## Directional scale view

At 1,000 active households for 12 months, a planning envelope of $380,000 equals $380 per active household-year. At 10,000 active households, a $1.7 million envelope equals $170 per active household-year. These are assumptions to test, not contracted prices.

## Affordability safeguards

Offer a free caregiver tier for core mission review and export; seek partner sponsorship for integrations and support; avoid usage designs that penalize high-need households; publish retention and pricing terms; and measure burden and access outcomes by subgroup before expansion.
`,
  "docs/sustainability/sustainability-strategy.md": `# Sustainability and non-extractive strategy

HEARTH’s proposed buyer is a health plan, provider, aging-network organization, employer benefit, or public program that benefits from safer transitions and lower coordination friction. The caregiver should not be required to purchase safety-critical coordination features.

Revenue would come from implementation, support, and organization-level subscriptions—not advertising, sale of personal data, or commissions that bias referrals. Core export, correction, permission control, and deletion-request functions remain available without a paid upgrade.

Phase 2 must test willingness to pay, implementation cost, partner staff burden, and whether value reaches caregivers with low income, limited English, disability access needs, or limited connectivity. A business model that improves organizational metrics but adds caregiver labor should not proceed.
`,
  "docs/reviewer-demo-guide.md": `# HEARTH reviewer demo guide

## What the reviewer is seeing

HEARTH is a TRL-3 browser proof of concept using one entirely synthetic household. It compiles 10 synthetic source artifacts into 26 care commitment objects, surfaces execution blockers, preserves uncertainty and provenance, applies purpose-specific privacy controls, and tracks work until an outcome is recorded.

## Three-to-five-minute path

1. Select **Reset Reviewer Demo**.
2. Open **Guided reviewer demo**.
3. Correct the uncertain voice-note extraction.
4. Prepare a pharmacist question.
5. Record the simulated professional resolution.
6. Assign transportation with minimum disclosure.
7. Verify equipment and qualified wound-care support.
8. Redistribute caregiver workload and record provider acknowledgement.
9. Escalate the unknown instruction and inspect the resulting receipts/evidence.

## Optional evidence path

Open **Timed burden study** to see the unpopulated, resettable comparison instrument. Open **Evidence & validation** for Smart 40, focused 60, and external-style holdout results. Open **Trust & privacy** for audit, export, deletion-request, correction, and access boundaries.

## Boundaries

Provider, pharmacy, appointment, home-health, helper, and community-resource responses are simulations. No clinical decision, diagnosis, medication instruction, message, appointment, purchase, or record change occurs. Real caregiver interviews, partner commitments, clinical effectiveness, and measured burden reduction are not claimed.
`,
};

for (const [path, content] of Object.entries(files)) {
  await mkdir(path.slice(0, path.lastIndexOf("/")), { recursive: true });
  await writeFile(path, content.trimEnd() + "\n");
}

const summary = {
  generatedAt: new Date().toISOString(),
  files: Object.keys(files).length,
  validation: validation.summary,
  holdout: holdout.summary,
  caregiverInterviewRecords: 0,
  burdenParticipants: 0,
  committedPartners: 0,
};
await writeFile("evidence/hardening-summary.json", JSON.stringify(summary, null, 2));
console.log(`Generated ${summary.files} hardening evidence documents.`);
