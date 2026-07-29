"use client";

import {
  Accessibility,
  Archive,
  ArrowRight,
  BookOpenCheck,
  Box,
  CalendarClock,
  Check,
  ChevronRight,
  CircleAlert,
  Clock3,
  FileCheck2,
  FileText,
  HeartHandshake,
  History,
  Home,
  Inbox,
  KeyRound,
  ListChecks,
  Menu,
  MessageSquareText,
  PackageCheck,
  Pill,
  Printer,
  ReceiptText,
  RefreshCcw,
  Scale,
  ShieldCheck,
  Sparkles,
  UserRoundCheck,
  Users,
  X,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  accountabilityReceipts,
  capacitySummary,
  careCircle,
  commitments,
  compileMission,
  initialResolution,
  minimumNecessaryDisclosure,
  permissionRules,
  sources,
  type Commitment,
  type DemoResolution,
  type Finding,
  type MissionStatus,
} from "@/lib/hearth";

type Screen =
  | "welcome"
  | "consent"
  | "inbox"
  | "compile"
  | "reality"
  | "today"
  | "board"
  | "medications"
  | "appointments"
  | "circle"
  | "capacity"
  | "receipts"
  | "trust"
  | "evidence"
  | "demo";

const navItems: {
  id: Screen;
  label: string;
  icon: typeof Home;
  group: "Mission" | "Safeguards" | "Proof";
}[] = [
  { id: "welcome", label: "Welcome & scope", icon: Home, group: "Mission" },
  { id: "today", label: "Today’s mission", icon: Clock3, group: "Mission" },
  { id: "reality", label: "Reality check", icon: ShieldCheck, group: "Mission" },
  { id: "board", label: "Mission board", icon: ListChecks, group: "Mission" },
  { id: "inbox", label: "Care inbox", icon: Inbox, group: "Mission" },
  { id: "compile", label: "Compilation review", icon: FileCheck2, group: "Mission" },
  { id: "medications", label: "Medication safety", icon: Pill, group: "Safeguards" },
  { id: "appointments", label: "Appointments", icon: CalendarClock, group: "Safeguards" },
  { id: "circle", label: "Family care circle", icon: Users, group: "Safeguards" },
  { id: "capacity", label: "Capacity shield", icon: Scale, group: "Safeguards" },
  { id: "consent", label: "Permission vault", icon: KeyRound, group: "Safeguards" },
  { id: "receipts", label: "Accountability receipts", icon: ReceiptText, group: "Proof" },
  { id: "trust", label: "Trust & privacy", icon: Archive, group: "Proof" },
  { id: "evidence", label: "Evidence & validation", icon: BookOpenCheck, group: "Proof" },
  { id: "demo", label: "Guided reviewer demo", icon: Sparkles, group: "Proof" },
];

const demoSteps: {
  key: keyof DemoResolution;
  title: string;
  detail: string;
  receipt: string;
}[] = [
  {
    key: "extractionCorrected",
    title: "Correct the uncertain voice-note extraction",
    detail: "Maya records that “blue pill” is not identifiable and must not become a care instruction.",
    receipt: "Correction history preserved",
  },
  {
    key: "pharmacistQuestionPrepared",
    title: "Prepare a pharmacist question",
    detail: "HEARTH drafts a source-grounded question with both insulin excerpts; Maya reviews before sending.",
    receipt: "AR-1045 · Draft prepared",
  },
  {
    key: "medicationResolved",
    title: "Record the simulated pharmacist resolution",
    detail: "A controlled response identifies the active source. Maya explicitly confirms activation.",
    receipt: "AR-1046 · Human confirmation recorded",
  },
  {
    key: "transportAssigned",
    title: "Assign transportation with minimum disclosure",
    detail: "Daniel receives only date, time, location, walker support, and contact instructions.",
    receipt: "AR-1047 · Diagnosis withheld",
  },
  {
    key: "equipmentArranged",
    title: "Verify a working scale",
    detail: "A community-resource simulation confirms a stable digital scale is available before morning.",
    receipt: "AR-1048 · Equipment outcome verified",
  },
  {
    key: "woundTrainingArranged",
    title: "Arrange qualified wound-care support",
    detail: "Home health confirms the first dressing change and a caregiver teach-back session.",
    receipt: "AR-1049 · Professional owner recorded",
  },
  {
    key: "eveningLoadRedistributed",
    title: "Redistribute the evening workload",
    detail: "Pickup, transport, home safety, and visit-packet work move to permitted helpers.",
    receipt: "AR-1050 · Capacity recalculated",
  },
  {
    key: "providerAcknowledged",
    title: "Track provider acknowledgement",
    detail: "Maya approves the prepared reply and a controlled cardiology response is recorded.",
    receipt: "AR-1051 · External outcome attached",
  },
  {
    key: "unclearInstructionEscalated",
    title: "Escalate the unknown instruction",
    detail: "HEARTH abstains and keeps the item open with the prescriber as the only resolver.",
    receipt: "AR-1052 · Abstention recorded",
  },
];

function statusClass(status: MissionStatus) {
  if (status === "READY") return "status-ready";
  if (status === "READY WITH CONTROLS") return "status-controlled";
  if (status === "HOLD") return "status-hold";
  return "status-blocked";
}

function StatusMark({ status }: { status: MissionStatus }) {
  return (
    <span className={`status-pill ${statusClass(status)}`}>
      <span aria-hidden="true">{status === "NOT EXECUTABLE" ? "×" : "✓"}</span>
      {status}
    </span>
  );
}

function ScreenHeader({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="screen-header">
      <div>
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="screen-description">{description}</p>
      </div>
      {children && <div className="screen-actions">{children}</div>}
    </header>
  );
}

function Metric({
  value,
  label,
  detail,
  tone = "neutral",
}: {
  value: string;
  label: string;
  detail?: string;
  tone?: "neutral" | "good" | "warn" | "danger";
}) {
  return (
    <article className={`metric metric-${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
      {detail && <small>{detail}</small>}
    </article>
  );
}

function FindingCard({
  finding,
  compact = false,
}: {
  finding: Finding;
  compact?: boolean;
}) {
  return (
    <article className={`finding-card severity-${finding.severity.toLowerCase()} ${finding.resolved ? "is-resolved" : ""}`}>
      <div className="finding-code">
        <span>{finding.code}</span>
        <span>{finding.resolved ? "Control satisfied" : finding.severity}</span>
      </div>
      <h3>{finding.title}</h3>
      <p>{finding.explanation}</p>
      {!compact && (
        <>
          <dl className="finding-details">
            <div>
              <dt>Evidence</dt>
              <dd>{finding.evidence.join(" · ")}</dd>
            </div>
            <div>
              <dt>Required action</dt>
              <dd>{finding.requiredAction}</dd>
            </div>
            <div>
              <dt>Resolver</dt>
              <dd>{finding.resolver}</dd>
            </div>
          </dl>
          <p className="continue-note">
            <Check size={15} aria-hidden="true" />
            Unaffected responsibilities may continue.
          </p>
        </>
      )}
    </article>
  );
}

function SourceBadge({ sourceId }: { sourceId: string }) {
  return (
    <span className="source-badge">
      <FileText size={13} aria-hidden="true" />
      {sourceId}
    </span>
  );
}

function CommitmentDetail({ item }: { item: Commitment }) {
  return (
    <div className="commitment-detail">
      <dl className="object-grid">
        <div>
          <dt>Owner</dt>
          <dd>{item.owner}</dd>
        </div>
        <div>
          <dt>Safe window</dt>
          <dd>{item.dueWindow}</dd>
        </div>
        <div>
          <dt>Authority</dt>
          <dd>{item.safetyLevel} · {item.approvalRequired ? "Approval required" : "Organize only"}</dd>
        </div>
        <div>
          <dt>Confidence</dt>
          <dd>{item.confidence} · {item.verification}</dd>
        </div>
        <div>
          <dt>Privacy</dt>
          <dd>{item.privacy} · {item.consentRule}</dd>
        </div>
        <div>
          <dt>Completion evidence</dt>
          <dd>{item.evidence}</dd>
        </div>
      </dl>
      <div className="provenance-quote">
        <span>{item.sourceLocation}</span>
        <blockquote>“{item.excerpt}”</blockquote>
      </div>
      <div className="detail-footer">
        <span>Backup: {item.backup}</span>
        <span>Escalates to: {item.escalation}</span>
      </div>
    </div>
  );
}

function CommitmentRow({
  item,
  stateOverride,
}: {
  item: Commitment;
  stateOverride?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const state = stateOverride ?? item.state;
  return (
    <article className="commitment-row">
      <button
        className="commitment-summary"
        aria-expanded={expanded}
        onClick={() => setExpanded((value) => !value)}
      >
        <span className={`risk-dot risk-${item.risk.toLowerCase()}`} aria-label={`${item.risk} risk`} />
        <span className="commitment-copy">
          <strong>{item.responsibility}</strong>
          <span>
            {item.id} · {item.owner} · {item.dueWindow}
          </span>
        </span>
        <SourceBadge sourceId={item.sourceId} />
        <span className="state-badge">{state}</span>
        <ChevronRight className={expanded ? "rotated" : ""} size={18} aria-hidden="true" />
      </button>
      {expanded && <CommitmentDetail item={item} />}
    </article>
  );
}

function SimulationNotice() {
  return (
    <div className="simulation-notice" role="note">
      <Box size={18} aria-hidden="true" />
      <div>
        <strong>Controlled Phase 1 simulation</strong>
        <span>Not connected to a real provider, pharmacy, insurer, or health record.</span>
      </div>
    </div>
  );
}

function WelcomeScreen({
  onOpen,
  status,
}: {
  onOpen: () => void;
  status: MissionStatus;
}) {
  return (
    <>
      <section className="welcome-hero">
        <div className="welcome-copy">
          <p className="eyebrow">Home Execution Assurance, Resilience, and Trust Hub</p>
          <h1>Make the care plan possible—not merely organized.</h1>
          <p>
            HEARTH turns fragmented post-discharge information into source-grounded responsibilities with owners,
            permissions, safety controls, completion evidence, and human escalation.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={onOpen}>
              Open Eleanor’s synthetic mission <ArrowRight size={17} aria-hidden="true" />
            </button>
            <StatusMark status={status} />
          </div>
          <SimulationNotice />
        </div>
        <aside className="case-card" aria-label="Demonstration case summary">
          <div className="case-monogram" aria-hidden="true">EB</div>
          <div>
            <p className="eyebrow">30-day transition mission</p>
            <h2>Eleanor Brooks</h2>
            <p>78 · moderate dementia · diabetes · heart failure · mobility limitations</p>
          </div>
          <div className="case-grid">
            <div><span>Primary caregiver</span><strong>Maya · daughter</strong></div>
            <div><span>Available capacity</span><strong>20 hours / week</strong></div>
            <div><span>Compiled objects</span><strong>26 responsibilities</strong></div>
            <div><span>Current blockers</span><strong>6 high-risk gaps</strong></div>
          </div>
        </aside>
      </section>
      <section className="boundary-section">
        <div>
          <p className="eyebrow">A careful boundary</p>
          <h2>What HEARTH does—and refuses to do</h2>
        </div>
        <div className="boundary-grid">
          <article>
            <Check aria-hidden="true" />
            <h3>Structures and checks</h3>
            <p>Finds responsibilities, keeps exact provenance, tests feasibility, and prepares low-risk actions.</p>
          </article>
          <article>
            <UserRoundCheck aria-hidden="true" />
            <h3>Preserves human authority</h3>
            <p>Care recipients control access. Caregivers review corrections. Professionals resolve clinical conflicts.</p>
          </article>
          <article className="boundary-no">
            <X aria-hidden="true" />
            <h3>Does not diagnose or prescribe</h3>
            <p>HEARTH never changes treatment, invents unknown instructions, or treats a drafted message as completion.</p>
          </article>
        </div>
      </section>
    </>
  );
}

function TodayScreen({
  goTo,
  resolution,
}: {
  goTo: (screen: Screen) => void;
  resolution: DemoResolution;
}) {
  const nextAction = resolution.medicationResolved
    ? commitments[2]
    : commitments[0];
  return (
    <>
      <ScreenHeader
        eyebrow="Monday · day 2 at home"
        title="One safe next action"
        description="HEARTH groups the rest so Maya can focus without losing the full audit trail."
      >
        <button className="secondary-button" onClick={() => window.print()}>
          <Printer size={16} aria-hidden="true" /> Print today
        </button>
      </ScreenHeader>
      <section className="primary-action-card">
        <div className="action-sequence">
          <span>01</span>
          <div aria-hidden="true" />
          <span>02</span>
          <div aria-hidden="true" />
          <span>03</span>
        </div>
        <div className="action-main">
          <span className="urgent-label"><CircleAlert size={15} /> Must be resolved before tonight</span>
          <h2>{nextAction.responsibility}</h2>
          <p>
            {resolution.medicationResolved
              ? "The medication conflict is controlled. The next blocking dependency is the unavailable scale."
              : "Two sources disagree. No dose is active in HEARTH until a pharmacist or prescriber resolves the conflict and Maya confirms it."}
          </p>
          <div className="action-meta">
            <span><Clock3 size={15} /> {nextAction.dueWindow}</span>
            <span><UserRoundCheck size={15} /> {nextAction.owner}</span>
            <SourceBadge sourceId={nextAction.sourceId} />
          </div>
          <button className="primary-button" onClick={() => goTo(resolution.medicationResolved ? "reality" : "medications")}>
            {resolution.medicationResolved ? "Review remaining blockers" : "Open safe medication workflow"}
            <ArrowRight size={17} />
          </button>
        </div>
        <aside className="why-card">
          <span>Why this comes first</span>
          <strong>{resolution.medicationResolved ? "Equipment blocks a verified instruction." : "A clinical conflict blocks three downstream responsibilities."}</strong>
          <p>Unrelated low-risk work may continue. HEARTH does not freeze the entire mission.</p>
        </aside>
      </section>
      <section className="section-block">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Grouped for lower interruption</p>
            <h2>After the primary action</h2>
          </div>
          <span className="quiet-note">Nonurgent updates held until 4:30 PM</span>
        </div>
        <div className="compact-task-grid">
          {commitments.slice(4, 8).map((item) => (
            <article key={item.id}>
              <div><SourceBadge sourceId={item.sourceId} /><span className="state-badge">{item.state}</span></div>
              <h3>{item.responsibility}</h3>
              <p>{item.dueWindow} · {item.owner}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}

function InboxScreen({ goTo }: { goTo: (screen: Screen) => void }) {
  return (
    <>
      <ScreenHeader
        eyebrow="Care inbox"
        title="Every instruction keeps its source"
        description="Documents, notes, permissions, availability, and simulated health-record data are reviewed as untrusted inputs."
      >
        <button className="secondary-button">
          <Inbox size={16} /> Add a synthetic source
        </button>
      </ScreenHeader>
      <SimulationNotice />
      <section className="source-list">
        {sources.map((source) => (
          <article key={source.id} className="source-card">
            <div className="source-icon"><FileText aria-hidden="true" /></div>
            <div className="source-main">
              <div className="source-title-row">
                <div>
                  <span>{source.type}</span>
                  <h3>{source.title}</h3>
                </div>
                <div className="source-flags">
                  {source.outdated && <span className="flag flag-outdated">Superseded</span>}
                  <span className={`flag ${source.reviewed ? "flag-reviewed" : "flag-review"}`}>
                    {source.reviewed ? "Reviewed" : "Review needed"}
                  </span>
                </div>
              </div>
              <p>{source.date} · {source.origin}</p>
              <div className="source-footer">
                <span>{source.extractedCount} extracted responsibilities</span>
                <span>Synthetic demonstration data</span>
                <button onClick={() => goTo("compile")}>Review extraction <ChevronRight size={14} /></button>
              </div>
            </div>
          </article>
        ))}
      </section>
      <div className="prompt-defense">
        <ShieldCheck aria-hidden="true" />
        <div>
          <strong>Uploaded content cannot change HEARTH’s safety policy.</strong>
          <p>Instructions inside files are treated as data. Embedded requests to reveal data, bypass review, or activate treatment are rejected and logged.</p>
        </div>
      </div>
    </>
  );
}

function CompilationScreen({
  resolution,
  setResolution,
}: {
  resolution: DemoResolution;
  setResolution: React.Dispatch<React.SetStateAction<DemoResolution>>;
}) {
  const [filter, setFilter] = useState("All");
  const visible = commitments.filter((item) => {
    if (filter === "All") return true;
    if (filter === "Review") return item.state === "Needs review" || item.confidence === "Low";
    if (filter === "Blocked") return item.state === "Blocked" || item.state === "Escalated";
    return item.risk === filter;
  });
  return (
    <>
      <ScreenHeader
        eyebrow="Care responsibility compiler"
        title="26 Care Commitment Objects"
        description="These are auditable responsibilities—not checklist items. Expand any row to inspect source, authority, completion evidence, backup, and escalation."
      />
      <div className="compiler-summary">
        <Metric value="26" label="responsibilities" detail="from 10 synthetic sources" />
        <Metric value="100%" label="provenance coverage" detail="source and excerpt retained" tone="good" />
        <Metric value="3" label="human reviews" detail="cannot activate automatically" tone="warn" />
        <Metric value="1" label="correction recorded" detail={resolution.extractionCorrected ? "caregiver correction saved" : "awaiting caregiver review"} tone="neutral" />
      </div>
      <div className="filter-bar" aria-label="Filter commitments">
        {["All", "Review", "Blocked", "Critical", "High"].map((item) => (
          <button
            key={item}
            className={filter === item ? "active" : ""}
            onClick={() => setFilter(item)}
            aria-pressed={filter === item}
          >
            {item}
          </button>
        ))}
      </div>
      {!resolution.extractionCorrected && (
        <div className="correction-callout">
          <MessageSquareText aria-hidden="true" />
          <div>
            <strong>Caregiver review requested · CCO-008</strong>
            <p>“Blue pill if needed” is too uncertain to activate. Confirm that the medicine cannot be identified from the note.</p>
          </div>
          <button
            className="secondary-button"
            onClick={() => setResolution((value) => ({ ...value, extractionCorrected: true }))}
          >
            Record correction
          </button>
        </div>
      )}
      {resolution.extractionCorrected && (
        <div className="success-callout">
          <Check aria-hidden="true" />
          <div>
            <strong>Correction saved without erasing the original</strong>
            <p>Maya marked the phrase unidentifiable. The original transcript and change history remain available.</p>
          </div>
        </div>
      )}
      <section className="commitment-list">
        {visible.map((item) => <CommitmentRow key={item.id} item={item} />)}
      </section>
    </>
  );
}

function RealityScreen({
  mission,
  runNextStep,
}: {
  mission: ReturnType<typeof compileMission>;
  runNextStep: () => void;
}) {
  const open = mission.findings.filter((finding) => !finding.resolved);
  const controls = mission.findings.filter((finding) => finding.resolved);
  return (
    <>
      <ScreenHeader
        eyebrow="HEARTH reality check"
        title="Can this entire plan be executed?"
        description="The answer is derived from ownership, permissions, time, equipment, skill, source quality, and closed-loop outcomes."
      >
        <button className="primary-button" onClick={runNextStep}>
          Resolve next safe step <ArrowRight size={17} />
        </button>
      </ScreenHeader>
      <section className={`reality-banner ${statusClass(mission.status)}`}>
        <div className="reality-icon">{mission.status === "NOT EXECUTABLE" ? "×" : "✓"}</div>
        <div>
          <span>Current mission state</span>
          <h2>{mission.status}</h2>
          <p>
            {mission.status === "NOT EXECUTABLE"
              ? `${mission.blockerCount} high-risk conditions prevent safe execution. Lower-risk, unaffected responsibilities may continue.`
              : "The plan is executable only while the visible professional reviews, task-specific permissions, and human approvals remain in place."}
          </p>
        </div>
        <div className="reality-score">
          <strong>{mission.findings.filter((item) => item.resolved).length}/{mission.findings.length}</strong>
          <span>controls satisfied</span>
        </div>
      </section>
      {open.length > 0 && (
        <section className="section-block">
          <div className="section-title-row">
            <div><p className="eyebrow">Action required</p><h2>Open compiler findings</h2></div>
            <span className="count-badge">{open.length} open</span>
          </div>
          <div className="finding-grid">
            {open.map((finding) => <FindingCard key={finding.code} finding={finding} />)}
          </div>
        </section>
      )}
      <section className="section-block">
        <div className="section-title-row">
          <div><p className="eyebrow">Still visible</p><h2>Satisfied safeguards and retained controls</h2></div>
          <span className="count-badge">{controls.length} active</span>
        </div>
        <div className="finding-grid finding-grid-compact">
          {controls.map((finding) => <FindingCard key={finding.code} finding={finding} compact />)}
        </div>
      </section>
    </>
  );
}

function BoardScreen({ resolution }: { resolution: DemoResolution }) {
  const [stateFilter, setStateFilter] = useState("Active");
  const adjusted = commitments.map((item) => {
    if (item.id === "CCO-001" && resolution.medicationResolved) return { ...item, state: "Verified" as const };
    if (item.id === "CCO-005" && resolution.transportAssigned) return { ...item, state: "Accepted" as const };
    if (item.id === "CCO-003" && resolution.equipmentArranged) return { ...item, state: "Verified" as const };
    if (item.id === "CCO-004" && resolution.woundTrainingArranged) return { ...item, state: "Assigned" as const };
    if (item.id === "CCO-007" && resolution.providerAcknowledged) return { ...item, state: "Completed" as const };
    return item;
  });
  const visible = adjusted.filter((item) => {
    if (stateFilter === "All") return true;
    if (stateFilter === "Blocked") return ["Blocked", "Escalated", "Needs review"].includes(item.state);
    if (stateFilter === "Waiting") return item.state.includes("Awaiting");
    if (stateFilter === "Complete") return ["Completed", "Verified", "Superseded"].includes(item.state);
    return !["Completed", "Verified", "Cancelled", "Superseded"].includes(item.state);
  });
  return (
    <>
      <ScreenHeader
        eyebrow="Closed-loop mission board"
        title="Open until an outcome is known"
        description="A draft, request, or sent message never closes a responsibility. Every state change adds a history event."
      />
      <div className="state-rail">
        {["Identified", "Assigned", "Accepted", "In progress", "Waiting", "Completed", "Verified"].map((state, index) => (
          <div key={state}>
            <span>{String(index + 1).padStart(2, "0")}</span>
            <small>{state}</small>
          </div>
        ))}
      </div>
      <div className="filter-bar">
        {["Active", "Blocked", "Waiting", "Complete", "All"].map((item) => (
          <button key={item} onClick={() => setStateFilter(item)} className={stateFilter === item ? "active" : ""}>
            {item}
          </button>
        ))}
      </div>
      <section className="commitment-list">
        {visible.map((item) => <CommitmentRow key={item.id} item={item} />)}
      </section>
    </>
  );
}

function MedicationScreen({
  resolution,
  setResolution,
}: {
  resolution: DemoResolution;
  setResolution: React.Dispatch<React.SetStateAction<DemoResolution>>;
}) {
  return (
    <>
      <ScreenHeader
        eyebrow="Medication reconciliation · H3 professional review"
        title="HEARTH found a dose conflict and stopped"
        description="Both versions remain visible. HEARTH neither selects a dose nor recommends starting, stopping, or changing treatment."
      />
      <section className="med-comparison">
        <article className="med-source current-source">
          <div><span>Newer source</span><SourceBadge sourceId="SRC-02" /></div>
          <h2>Insulin glargine</h2>
          <strong>18 units · nightly</strong>
          <p>Hospital medication list · July 26 · medication table row 3</p>
          <span className="flag flag-review">Not active while conflict remains</span>
        </article>
        <div className="conflict-mark" aria-label="Conflicting instructions">
          <CircleAlert aria-hidden="true" />
          <span>conflicts with</span>
        </div>
        <article className="med-source older-source">
          <div><span>Older source</span><SourceBadge sourceId="SRC-03" /></div>
          <h2>Insulin glargine</h2>
          <strong>24 units · nightly</strong>
          <p>Prior home list · May 4 · retained for audit</p>
          <span className="flag flag-outdated">Superseded · cannot activate</span>
        </article>
      </section>
      <div className="safety-stop">
        <CircleAlert aria-hidden="true" />
        <div>
          <span>HEARTH SAFETY STOP · H101</span>
          <strong>The active dose is unknown.</strong>
          <p>A pharmacist or prescriber must reconcile the exact sources. Maya must explicitly confirm the response before the instruction becomes active.</p>
        </div>
      </div>
      <section className="workflow-panel">
        <div className="workflow-step complete">
          <span><Check /></span><div><strong>Conflict detected</strong><p>Exact excerpts and dates preserved.</p></div>
        </div>
        <div className={`workflow-step ${resolution.pharmacistQuestionPrepared ? "complete" : "current"}`}>
          <span>{resolution.pharmacistQuestionPrepared ? <Check /> : "2"}</span>
          <div>
            <strong>Prepare a structured pharmacist question</strong>
            <p>“Which insulin glargine instruction is active: 18 units from July 26 or 24 units from May 4?”</p>
            {!resolution.pharmacistQuestionPrepared && (
              <button className="primary-button" onClick={() => setResolution((value) => ({ ...value, pharmacistQuestionPrepared: true }))}>
                Prepare for Maya’s approval
              </button>
            )}
          </div>
        </div>
        <div className={`workflow-step ${resolution.medicationResolved ? "complete" : resolution.pharmacistQuestionPrepared ? "current" : ""}`}>
          <span>{resolution.medicationResolved ? <Check /> : "3"}</span>
          <div>
            <strong>Record controlled professional response</strong>
            <p>A response is not a real integration. The Phase 1 adapter records the resolver, source, timestamp, and Maya’s confirmation.</p>
            {resolution.pharmacistQuestionPrepared && !resolution.medicationResolved && (
              <button className="secondary-button" onClick={() => setResolution((value) => ({ ...value, medicationResolved: true }))}>
                Simulate response + Maya confirmation
              </button>
            )}
          </div>
        </div>
        <div className={`workflow-step ${resolution.medicationResolved ? "current" : ""}`}>
          <span>4</span><div><strong>Track refill outcome</strong><p>CCO-002 stays open until the pharmacy confirms a fill or a blocking result.</p></div>
        </div>
      </section>
      <SimulationNotice />
    </>
  );
}

function AppointmentsScreen({ resolution, setResolution }: {
  resolution: DemoResolution;
  setResolution: React.Dispatch<React.SetStateAction<DemoResolution>>;
}) {
  const disclosure = minimumNecessaryDisclosure("Daniel transportation");
  return (
    <>
      <ScreenHeader
        eyebrow="Appointment and follow-up workflow"
        title="Cardiology · August 1 at 10:00 AM"
        description="The appointment is not ready until transportation is accepted, mobility support is known, visit materials are prepared, and the provider outcome is tracked."
      />
      <section className="appointment-layout">
        <div className="appointment-timeline">
          {[
            ["Requirement extracted", "Within 7 days · SRC-05", true],
            ["Availability checked", "Maya at work; Daniel available", true],
            ["Transportation accepted", resolution.transportAssigned ? "Daniel accepted · 9:10 AM pickup" : "No owner has accepted", resolution.transportAssigned],
            ["Visit packet prepared", "Medication conflict still controls final list", resolution.medicationResolved],
            ["Post-visit outcome", "Remains open until instructions are recorded", false],
          ].map(([title, detail, done]) => (
            <div key={String(title)} className={done ? "done" : ""}>
              <span>{done ? <Check /> : <Clock3 />}</span>
              <div><strong>{title}</strong><p>{detail}</p></div>
            </div>
          ))}
        </div>
        <aside className="disclosure-card">
          <p className="eyebrow">Preview for Daniel</p>
          <h2>Minimum necessary task request</h2>
          <dl>
            <div><dt>Date & time</dt><dd>Aug 1 · pickup 9:10 AM</dd></div>
            <div><dt>Location</dt><dd>Lakeshore Cardiology, north entrance</dd></div>
            <div><dt>Support</dt><dd>Foldable walker; allow extra entry time</dd></div>
          </dl>
          <div className="withheld-box">
            <strong>Intentionally withheld</strong>
            <p>{disclosure.withheld.join(" · ")}</p>
          </div>
          <button
            className="primary-button"
            disabled={resolution.transportAssigned}
            onClick={() => setResolution((value) => ({ ...value, transportAssigned: true }))}
          >
            {resolution.transportAssigned ? "Accepted by Daniel" : "Simulate Daniel accepting"}
          </button>
        </aside>
      </section>
      <section className="visit-questions">
        <div>
          <p className="eyebrow">Prepared—not sent</p>
          <h2>Questions for the visit</h2>
        </div>
        <ol>
          <li>Which daily weight changes should use the configured call pathway in the discharge instructions?</li>
          <li>Who should reconcile the insulin instructions before tonight?</li>
          <li>How should the family record home readings for the next follow-up?</li>
        </ol>
      </section>
    </>
  );
}

function CircleScreen({ resolution, setResolution }: {
  resolution: DemoResolution;
  setResolution: React.Dispatch<React.SetStateAction<DemoResolution>>;
}) {
  return (
    <>
      <ScreenHeader
        eyebrow="Family care circle"
        title="Help without exposing the whole care record"
        description="Every invitation is purpose-specific, time-limited where appropriate, and immediately revocable."
      />
      <section className="circle-grid">
        {careCircle.map((person, index) => (
          <article key={person.name} className="person-card">
            <div className="person-avatar">{person.name.split(" ").map((part) => part[0]).join("").slice(0, 2)}</div>
            <div>
              <h3>{person.name}</h3>
              <p>{person.role}</p>
              <span>{person.access}</span>
            </div>
            <span className={`flag ${index === 4 ? "flag-review" : "flag-reviewed"}`}>{person.status}</span>
          </article>
        ))}
      </section>
      <section className="delegation-panel">
        <div>
          <p className="eyebrow">Recommended redistribution</p>
          <h2>Return 5.2 hours to Maya this week</h2>
          <p>This is an operational capacity estimate—not a burnout diagnosis.</p>
        </div>
        <div className="delegation-list">
          <div><span>Transportation + pickup</span><strong>Daniel · 3h 20m</strong><small>Task-specific access</small></div>
          <div><span>Scale acquisition</span><strong>Community resource · 45m</strong><small>No clinical details needed</small></div>
          <div><span>Home safety + supply checks</span><strong>Robert · 1h 05m</strong><small>Existing household access</small></div>
        </div>
        <button
          className="primary-button"
          disabled={resolution.eveningLoadRedistributed}
          onClick={() => setResolution((value) => ({ ...value, eveningLoadRedistributed: true }))}
        >
          {resolution.eveningLoadRedistributed ? "Redistribution recorded" : "Approve this redistribution"}
        </button>
      </section>
    </>
  );
}

function CapacityScreen({ resolution, setResolution }: {
  resolution: DemoResolution;
  setResolution: React.Dispatch<React.SetStateAction<DemoResolution>>;
}) {
  const capacity = capacitySummary(resolution);
  const ratio = Math.min((capacity.required / 28) * 100, 100);
  return (
    <>
      <ScreenHeader
        eyebrow="Caregiver capacity shield"
        title="Can Maya realistically execute this week?"
        description="The estimate includes travel, waiting, calls, forms, task complexity, training, physical demand, and backup availability."
      />
      <section className="capacity-hero">
        <div className="capacity-number">
          <span>{capacity.state}</span>
          <strong>{Math.abs(capacity.margin).toFixed(1)} hours</strong>
          <p>{capacity.margin < 0 ? "more work than available" : "of controlled margin after redistribution"}</p>
        </div>
        <div className="capacity-chart" role="img" aria-label={`${capacity.required} hours required compared with ${capacity.available} available`}>
          <div className="capacity-scale">
            <span>0h</span><span>7h</span><span>14h</span><span>21h</span><span>28h</span>
          </div>
          <div className="bar-line">
            <span style={{ width: `${ratio}%` }}>{capacity.required}h required</span>
          </div>
          <div className="available-marker" style={{ left: `${(capacity.available / 28) * 100}%` }}>
            <span>{capacity.available}h available</span>
          </div>
        </div>
      </section>
      <div className="burden-grid">
        <article><span>Appointments + travel</span><strong>7h 15m</strong><div style={{ width: "86%" }} /></article>
        <article><span>Medication coordination</span><strong>4h 10m</strong><div style={{ width: "62%" }} /></article>
        <article><span>Calls, forms, waiting</span><strong>3h 45m</strong><div style={{ width: "56%" }} /></article>
        <article><span>Evening direct care</span><strong>6h 20m</strong><div style={{ width: "78%" }} /></article>
        <article><span>Training + setup</span><strong>2h 20m</strong><div style={{ width: "38%" }} /></article>
      </div>
      <section className="recommendation-table">
        <div className="table-header"><span>Responsibility</span><span>Best pathway</span><span>Reason</span></div>
        <div><span>Transportation</span><strong>Delegate to Daniel</strong><span>Permitted and available</span></div>
        <div><span>Refill request</span><strong>AI prepare + Maya approve</strong><span>Administrative; external action controlled</span></div>
        <div><span>Wound care</span><strong>Professional support</strong><span>Training gap; H3 review</span></div>
        <div><span>Weight equipment</span><strong>Community resource</strong><span>Equipment gap, no clinical data needed</span></div>
      </section>
      {!resolution.eveningLoadRedistributed && (
        <button className="primary-button wide-action" onClick={() => setResolution((value) => ({ ...value, eveningLoadRedistributed: true }))}>
          Apply permitted redistribution <ArrowRight size={17} />
        </button>
      )}
    </>
  );
}

function ConsentScreen() {
  const [revoked, setRevoked] = useState(false);
  const [mode, setMode] = useState("Prepare");
  return (
    <>
      <ScreenHeader
        eyebrow="Permission & choice vault"
        title="Eleanor controls purpose, person, and time"
        description="Consent is not a checkbox. Each use is role-specific, revocable, understandable, and logged."
      />
      <section className="choice-banner">
        <div className="case-monogram">EB</div>
        <div><strong>Eleanor participated with supported decision-making.</strong><p>Moderate dementia does not automatically remove her authority or preferences.</p></div>
        <span className="flag flag-reviewed">Reviewed Jul 27</span>
      </section>
      <section className="permission-table">
        <div className="table-header"><span>Purpose</span><span>Who</span><span>May see</span><span>Withheld</span><span>Expires</span></div>
        {permissionRules.map((rule) => (
          <div key={rule.purpose}>
            <strong>{rule.purpose}</strong><span>{rule.role}</span><span>{rule.allowed}</span><span>{rule.withheld}</span><span>{rule.expiry}</span>
          </div>
        ))}
      </section>
      <section className="autonomy-panel">
        <div>
          <p className="eyebrow">Adjustable AI authority</p>
          <h2>External action default: Prepare</h2>
          <p>HEARTH drafts low-risk administrative actions. Maya approves before anything leaves the household.</p>
        </div>
        <div className="segmented-control" role="group" aria-label="AI autonomy level">
          {["Organize", "Recommend", "Prepare", "Delegate"].map((item) => (
            <button key={item} aria-pressed={mode === item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>{item}</button>
          ))}
        </div>
        <p className="mode-explanation">
          {mode === "Organize" && "HEARTH structures information and takes no external action."}
          {mode === "Recommend" && "HEARTH suggests next steps; the caregiver performs them."}
          {mode === "Prepare" && "HEARTH prepares a draft; the caregiver reviews and approves it."}
          {mode === "Delegate" && "Only specifically approved low-risk actions use a labeled simulated adapter."}
        </p>
      </section>
      <div className={`revocation-card ${revoked ? "revoked" : ""}`}>
        <KeyRound aria-hidden="true" />
        <div>
          <strong>Daniel’s transportation access</strong>
          <p>{revoked ? "Revoked immediately. A permission-history event was recorded." : "Task-specific · expires Aug 1 at 6:00 PM · diagnosis access blocked"}</p>
        </div>
        <button className="secondary-button" disabled={revoked} onClick={() => setRevoked(true)}>
          {revoked ? "Access revoked" : "Revoke now"}
        </button>
      </div>
    </>
  );
}

function ReceiptsScreen() {
  const [selected, setSelected] = useState(accountabilityReceipts[0]);
  return (
    <>
      <ScreenHeader
        eyebrow="Accountability receipts"
        title="Every consequential AI action can be inspected"
        description="Receipts show why an action occurred, what was shared, what was withheld, whose permission applied, and what remains unknown."
      />
      <section className="receipt-layout">
        <div className="receipt-list">
          {accountabilityReceipts.map((receipt) => (
            <button key={receipt.id} className={selected.id === receipt.id ? "active" : ""} onClick={() => setSelected(receipt)}>
              <span>{receipt.id}</span><strong>{receipt.action}</strong><small>{receipt.outcome}</small>
            </button>
          ))}
        </div>
        <article className="receipt-paper">
          <div className="receipt-top"><div><span>{selected.id}</span><h2>{selected.action}</h2></div><ReceiptText aria-hidden="true" /></div>
          <dl>
            {[
              ["Reason", selected.reason],
              ["Source", selected.source],
              ["Confidence", selected.confidence],
              ["Information shared", selected.shared],
              ["Intentionally withheld", selected.withheld],
              ["Permission applied", selected.permission],
              ["Human approval", selected.approval],
              ["Outcome", selected.outcome],
              ["Remaining uncertainty", selected.uncertainty],
              ["Next step", selected.next],
            ].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
          </dl>
          <div className="receipt-signature"><span>HEARTH compiler v0.3</span><span>Source bundle 2026-07-27.1</span></div>
        </article>
      </section>
    </>
  );
}

function TrustScreen() {
  const [deleteRequested, setDeleteRequested] = useState(false);
  return (
    <>
      <ScreenHeader
        eyebrow="Trust & privacy center"
        title="Access, correction, export, and deletion"
        description="This controlled prototype uses synthetic records. Production compliance obligations remain to be determined with Phase 2 deployment partners."
      />
      <div className="trust-principles">
        <article><ShieldCheck /><strong>No sale of personal data</strong><p>No advertising based on health information.</p></article>
        <article><Accessibility /><strong>Care-recipient control</strong><p>Purpose-specific, revocable permissions.</p></article>
        <article><PackageCheck /><strong>Portable by design</strong><p>Human-readable export and printable mission.</p></article>
        <article><History /><strong>Auditable actions</strong><p>Access, approvals, corrections, and failed authorization attempts.</p></article>
      </div>
      <section className="audit-log">
        <div className="section-title-row"><div><p className="eyebrow">Household audit trail</p><h2>Recent access events</h2></div><span className="flag flag-reviewed">Synthetic log</span></div>
        {[
          ["09:20", "HEARTH compiler", "Read 10 synthetic sources", "Purpose: mission compilation", "Allowed"],
          ["09:24", "Daniel Kapoor", "Requested medication list", "No purpose-specific permission", "Blocked"],
          ["09:26", "Maya Kapoor", "Reviewed insulin conflict", "Primary caregiver · clinical review", "Allowed"],
          ["09:31", "HEARTH compiler", "Prepared transportation disclosure", "SRC-09 transportation permission", "Prepared"],
          ["09:34", "Unknown household token", "Attempted cross-household object access", "Household mismatch", "Blocked"],
        ].map(([time, actor, action, reason, outcome]) => (
          <div key={`${time}-${actor}`}>
            <time>{time}</time><strong>{actor}</strong><span>{action}</span><small>{reason}</small><b className={outcome === "Blocked" ? "blocked-text" : ""}>{outcome}</b>
          </div>
        ))}
      </section>
      <div className="data-actions">
        <button className="secondary-button"><PackageCheck size={17} /> Export synthetic household record</button>
        <button className="secondary-button" onClick={() => setDeleteRequested(true)} disabled={deleteRequested}>
          <Archive size={17} /> {deleteRequested ? "Deletion request recorded" : "Request deletion"}
        </button>
      </div>
    </>
  );
}

function EvidenceScreen() {
  return (
    <>
      <ScreenHeader
        eyebrow="TRL-3 evidence"
        title="Controlled tests, retained failures, honest limits"
        description="The evidence suite is reproducible from the repository. Results describe deterministic prototype behavior—not clinical effectiveness or real-world caregiver outcomes."
      />
      <div className="evidence-banner">
        <div><span>Smart 40</span><strong>40 / 40</strong><small>consecutive controlled cases</small></div>
        <div><span>Focused benchmark</span><strong>60 / 60</strong><small>six safety and workflow groups</small></div>
        <div><span>Required abstentions</span><strong>4 / 4</strong><small>including Protocol 9-Delta</small></div>
        <div><span>Permission violations</span><strong>0</strong><small>in locked synthetic tests</small></div>
      </div>
      <section className="metric-table">
        <div className="table-header"><span>Measured in locked synthetic set</span><span>Result</span><span>Desired threshold</span><span>Phase 2 target</span></div>
        {[
          ["Responsibility extraction precision", "100%", "≥ 90%", "≥ 92% on reviewed pilot records"],
          ["Responsibility extraction recall", "100%", "≥ 90%", "≥ 92%"],
          ["Provenance coverage", "100%", "100%", "100%"],
          ["Conflict detection recall", "100%", "100% high-risk", "100% high-risk"],
          ["Correct escalation rate", "100%", "100% H3/H4", "100% H3/H4"],
          ["Hallucination rate", "0%", "0% high-risk", "0% unsupported high-risk actions"],
          ["Closed-loop state accuracy", "100%", "≥ 98%", "≥ 98%"],
          ["Net workflow time saved", "Not measured", "Positive", "Timed caregiver evaluation"],
        ].map(([metric, result, threshold, target]) => (
          <div key={metric}><strong>{metric}</strong><span>{result}</span><span>{threshold}</span><span>{target}</span></div>
        ))}
      </section>
      <section className="evidence-grid">
        <article>
          <p className="eyebrow">Exact safety output</p>
          <h2>Protocol 9-Delta</h2>
          <blockquote>
            “I cannot identify Protocol 9-Delta as a verified instruction. I will not invent its meaning or apply it. Please provide an approved source or request review from a qualified professional.”
          </blockquote>
          <span className="flag flag-reviewed">Passed · H3 abstention</span>
        </article>
        <article>
          <p className="eyebrow">Burden benchmark</p>
          <h2>No fictional time-saving claim</h2>
          <p>The repository includes the timed comparison protocol, event schema, and success measures. Net time saved remains unmeasured until observed caregiver testing.</p>
          <span className="flag flag-review">Phase 2 measurement required</span>
        </article>
        <article>
          <p className="eyebrow">Research evidence</p>
          <h2>Interview materials not available here</h2>
          <p>The research structure is present with a missing-evidence warning. No participant counts, profiles, themes, or quotes were invented.</p>
          <span className="flag flag-review">Awaiting de-identified materials</span>
        </article>
        <article>
          <p className="eyebrow">Implementation boundary</p>
          <h2>Sandbox adapters only</h2>
          <p>Provider, pharmacy, appointment, helper, and community-resource outcomes are labeled simulations. No real external connection is claimed.</p>
          <span className="flag flag-reviewed">Clearly labeled</span>
        </article>
      </section>
    </>
  );
}

function DemoScreen({
  resolution,
  setResolution,
  mission,
}: {
  resolution: DemoResolution;
  setResolution: React.Dispatch<React.SetStateAction<DemoResolution>>;
  mission: ReturnType<typeof compileMission>;
}) {
  const completed = demoSteps.filter((step) => resolution[step.key]).length;
  const next = demoSteps.find((step) => !resolution[step.key]);
  return (
    <>
      <ScreenHeader
        eyebrow="Guided reviewer demo · 3–5 minutes"
        title="Watch a fragmented plan become executable"
        description="Each step changes real mission state, preserves evidence, and maintains human or professional authority."
      >
        <button className="secondary-button" onClick={() => setResolution(initialResolution)}>
          <RefreshCcw size={16} /> Reset demo
        </button>
      </ScreenHeader>
      <section className="demo-status">
        <div>
          <span>Mission transformation</span>
          <div className="status-transition">
            <span className="status-pill status-blocked">× NOT EXECUTABLE</span>
            <ArrowRight />
            <StatusMark status={mission.status === "NOT EXECUTABLE" ? "READY WITH CONTROLS" : mission.status} />
          </div>
        </div>
        <div className="demo-progress">
          <strong>{completed} of {demoSteps.length}</strong>
          <span>safe resolution steps recorded</span>
          <div><span style={{ width: `${(completed / demoSteps.length) * 100}%` }} /></div>
        </div>
      </section>
      {next ? (
        <section className="next-demo-step">
          <span>Next controlled action · {String(completed + 1).padStart(2, "0")}</span>
          <h2>{next.title}</h2>
          <p>{next.detail}</p>
          <button
            className="primary-button"
            onClick={() => setResolution((value) => ({ ...value, [next.key]: true }))}
          >
            Run this step <ArrowRight size={17} />
          </button>
        </section>
      ) : (
        <section className="next-demo-step complete-demo">
          <Check aria-hidden="true" />
          <span>Mission control state reached</span>
          <h2>Ready with controls</h2>
          <p>Clinical uncertainty remains with professionals, privacy boundaries remain active, and every external workflow stays open until an outcome is recorded.</p>
        </section>
      )}
      <section className="demo-step-list">
        {demoSteps.map((step, index) => (
          <article key={step.key} className={resolution[step.key] ? "complete" : next?.key === step.key ? "current" : ""}>
            <span>{resolution[step.key] ? <Check /> : String(index + 1).padStart(2, "0")}</span>
            <div><strong>{step.title}</strong><p>{step.detail}</p><small>{resolution[step.key] ? step.receipt : "Not yet run"}</small></div>
          </article>
        ))}
      </section>
      <SimulationNotice />
    </>
  );
}

export default function HearthApp() {
  const [screen, setScreen] = useState<Screen>("welcome");
  const [resolution, setResolution] = useState<DemoResolution>(initialResolution);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const mission = useMemo(() => compileMission(resolution), [resolution]);
  const currentNav = navItems.find((item) => item.id === screen)!;

  const goTo = (target: Screen) => {
    setScreen(target);
    setMobileNavOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const runNextStep = () => {
    const next = demoSteps.find((step) => !resolution[step.key]);
    if (next) setResolution((value) => ({ ...value, [next.key]: true }));
  };

  const renderScreen = () => {
    switch (screen) {
      case "welcome": return <WelcomeScreen onOpen={() => goTo("today")} status={mission.status} />;
      case "today": return <TodayScreen goTo={goTo} resolution={resolution} />;
      case "inbox": return <InboxScreen goTo={goTo} />;
      case "compile": return <CompilationScreen resolution={resolution} setResolution={setResolution} />;
      case "reality": return <RealityScreen mission={mission} runNextStep={runNextStep} />;
      case "board": return <BoardScreen resolution={resolution} />;
      case "medications": return <MedicationScreen resolution={resolution} setResolution={setResolution} />;
      case "appointments": return <AppointmentsScreen resolution={resolution} setResolution={setResolution} />;
      case "circle": return <CircleScreen resolution={resolution} setResolution={setResolution} />;
      case "capacity": return <CapacityScreen resolution={resolution} setResolution={setResolution} />;
      case "consent": return <ConsentScreen />;
      case "receipts": return <ReceiptsScreen />;
      case "trust": return <TrustScreen />;
      case "evidence": return <EvidenceScreen />;
      case "demo": return <DemoScreen resolution={resolution} setResolution={setResolution} mission={mission} />;
    }
  };

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <aside className={`sidebar ${mobileNavOpen ? "is-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true"><HeartHandshake /></div>
          <div><strong>HEARTH</strong><span>Care execution assurance</span></div>
          <button className="mobile-close" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}><X /></button>
        </div>
        <div className="case-switcher">
          <div className="case-monogram">EB</div>
          <div><strong>Eleanor’s mission</strong><span>Synthetic · day 2 at home</span></div>
          <ChevronRight size={16} />
        </div>
        <nav aria-label="HEARTH sections">
          {(["Mission", "Safeguards", "Proof"] as const).map((group) => (
            <div className="nav-group" key={group}>
              <span>{group}</span>
              {navItems.filter((item) => item.group === group).map((item) => {
                const Icon = item.icon;
                return (
                  <button key={item.id} className={screen === item.id ? "active" : ""} onClick={() => goTo(item.id)} aria-current={screen === item.id ? "page" : undefined}>
                    <Icon size={17} aria-hidden="true" />
                    <span>{item.label}</span>
                    {item.id === "reality" && <b>{mission.blockerCount}</b>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <div className="sidebar-footer">
          <ShieldCheck size={17} />
          <div><strong>Prepare by default</strong><span>Human approval for external action</span></div>
        </div>
      </aside>
      {mobileNavOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      <div className="main-column">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu /></button>
          <div className="breadcrumb"><span>Eleanor’s mission</span><ChevronRight size={14} /><strong>{currentNav.label}</strong></div>
          <div className="topbar-actions">
            <span className="synthetic-chip">Synthetic data</span>
            <StatusMark status={mission.status} />
            <button className="reviewer-button" onClick={() => goTo("demo")}>Reviewer demo</button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className={screen === "welcome" ? "welcome-main" : ""}>
          {renderScreen()}
        </main>
        <footer className="app-footer">
          <span>HEARTH TRL-3 proof of concept · Track 1</span>
          <span>All people and records shown are synthetic.</span>
          <span>Not for clinical use.</span>
        </footer>
      </div>
    </div>
  );
}
