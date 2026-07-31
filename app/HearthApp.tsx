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
import BurdenStudy from "./BurdenStudy";
import {
  accountabilityReceipts,
  capacitySummary,
  careCircle,
  commitments,
  compileMission,
  initialResolution,
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
  | "study"
  | "demo";

const navItems: {
  id: Screen;
  label: string;
  icon: typeof Home;
  group: "Care" | "More" | "Reviewer";
}[] = [
  { id: "welcome", label: "Home", icon: Home, group: "Care" },
  { id: "today", label: "Today", icon: Clock3, group: "Care" },
  { id: "board", label: "Care plan", icon: ListChecks, group: "Care" },
  { id: "inbox", label: "Care information", icon: Inbox, group: "Care" },
  { id: "circle", label: "Family help", icon: Users, group: "Care" },
  { id: "reality", label: "What needs attention", icon: ShieldCheck, group: "More" },
  { id: "medications", label: "Medicine questions", icon: Pill, group: "More" },
  { id: "appointments", label: "Visits", icon: CalendarClock, group: "More" },
  { id: "capacity", label: "My time and energy", icon: Scale, group: "More" },
  { id: "consent", label: "Sharing", icon: KeyRound, group: "More" },
  { id: "trust", label: "Privacy", icon: Archive, group: "More" },
  { id: "compile", label: "Review extracted tasks", icon: FileCheck2, group: "Reviewer" },
  { id: "receipts", label: "Activity history", icon: ReceiptText, group: "Reviewer" },
  { id: "evidence", label: "How this was tested", icon: BookOpenCheck, group: "Reviewer" },
  { id: "study", label: "Usability study", icon: Clock3, group: "Reviewer" },
  { id: "demo", label: "Reviewer tour", icon: Sparkles, group: "Reviewer" },
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
  const label = status === "NOT EXECUTABLE"
    ? "Needs attention"
    : status === "READY WITH CONTROLS"
      ? "Ready with checks"
      : status === "HOLD"
        ? "Paused"
        : "Ready";
  return (
    <span className={`status-pill ${statusClass(status)}`}>
      <span aria-hidden="true">{status === "NOT EXECUTABLE" ? "!" : "✓"}</span>
      {label}
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
        <span>{finding.resolved ? "Checked" : "Needs follow-up"}</span>
      </div>
      <h3>{finding.title}</h3>
      <p>{finding.explanation}</p>
      {!compact && (
        <>
          <dl className="finding-details">
            <div>
              <dt>What we checked</dt>
              <dd>{finding.evidence.join(" · ")}</dd>
            </div>
            <div>
              <dt>What to do</dt>
              <dd>{finding.requiredAction}</dd>
            </div>
            <div>
              <dt>Who can help</dt>
              <dd>{finding.resolver}</dd>
            </div>
          </dl>
          <p className="continue-note">
            <Check size={15} aria-hidden="true" />
            Other care tasks can continue.
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
        <strong>Example household</strong>
        <span>This demo does not connect to a real doctor, pharmacy, insurer, or care record.</span>
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
          <p className="eyebrow">Care, one step at a time</p>
          <h1>Know what to do next.</h1>
          <p>
            HEARTH brings today’s care tasks, questions, and family help into one calm place.
          </p>
          <div className="hero-actions">
            <button className="primary-button" onClick={onOpen}>
              See today’s next step <ArrowRight size={19} aria-hidden="true" />
            </button>
          </div>
          <p className="resume-note"><Clock3 size={18} aria-hidden="true" /> You can stop and come back at any time.</p>
          <SimulationNotice />
        </div>
        <aside className="case-card" aria-label="Demonstration case summary">
          <div className="case-monogram" aria-hidden="true">EB</div>
          <div>
            <p className="eyebrow">Today’s care</p>
            <h2>Eleanor Brooks</h2>
            <p>Day 2 at home · Maya is the main caregiver</p>
          </div>
          <div className="case-grid">
            <div><span>Next step</span><strong>Ask about insulin amount</strong></div>
            <div><span>Today</span><strong>4 care tasks</strong></div>
            <div><span>Family help</span><strong>2 people available</strong></div>
            <div><span>Care status</span><StatusMark status={status} /></div>
          </div>
        </aside>
      </section>
      <section className="boundary-section">
        <div>
          <p className="eyebrow">What to expect</p>
          <h2>HEARTH helps you stay organized.</h2>
        </div>
        <div className="boundary-grid">
          <article>
            <Check aria-hidden="true" />
            <h3>Shows one next step</h3>
            <p>See what matters now and what can wait.</p>
          </article>
          <article>
            <UserRoundCheck aria-hidden="true" />
            <h3>Keeps people in charge</h3>
            <p>You choose what to approve and share.</p>
          </article>
          <article className="boundary-no">
            <X aria-hidden="true" />
            <h3>Does not give medical advice</h3>
            <p>Questions about medicine stay with a doctor or pharmacist.</p>
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
        title="Today"
        description="Start with this one step. The rest can wait."
      />
      <div className="resume-banner" role="status">
        <Clock3 size={20} aria-hidden="true" />
        <div><strong>Your place is easy to find again.</strong><span>Finish one step, pause, or come back later.</span></div>
        <button className="text-button" onClick={() => window.print()}><Printer size={17} aria-hidden="true" /> Print</button>
      </div>
      <section className="primary-action-card">
        <div className="action-sequence">
          <span>01</span>
          <div aria-hidden="true" />
          <span>02</span>
          <div aria-hidden="true" />
          <span>03</span>
        </div>
        <div className="action-main">
          <span className="urgent-label"><CircleAlert size={17} /> Do this first</span>
          <h2>{nextAction.responsibility}</h2>
          <p>
            {resolution.medicationResolved
              ? "A working scale is needed for tomorrow morning."
              : "Two care lists show different amounts. Ask a pharmacist or doctor which one is current."}
          </p>
          <div className="action-meta">
            <span><Clock3 size={15} /> {nextAction.dueWindow}</span>
            <span><UserRoundCheck size={15} /> {nextAction.owner}</span>
            <SourceBadge sourceId={nextAction.sourceId} />
          </div>
          <button className="primary-button" onClick={() => goTo(resolution.medicationResolved ? "reality" : "medications")}>
            {resolution.medicationResolved ? "See what to do" : "Prepare the question"}
            <ArrowRight size={17} />
          </button>
        </div>
        <aside className="why-card">
          <span>Why this is first</span>
          <strong>{resolution.medicationResolved ? "It is needed tomorrow morning." : "The amount needs a clear answer."}</strong>
          <p>Other care tasks can still continue.</p>
        </aside>
      </section>
      <section className="section-block">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Later</p>
            <h2>After this step</h2>
          </div>
          <span className="quiet-note">Nothing else needs your attention now.</span>
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
        eyebrow="Care information"
        title="All care information in one place"
        description="See where each note came from and what still needs a quick check."
      >
        <button className="secondary-button">
          <Inbox size={18} /> Add an example note
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
                <span>{source.extractedCount} care tasks found</span>
                <span>Example data</span>
                <button onClick={() => goTo("compile")}>Review tasks <ChevronRight size={16} /></button>
              </div>
            </div>
          </article>
        ))}
      </section>
      <div className="prompt-defense">
        <ShieldCheck aria-hidden="true" />
        <div>
          <strong>Notes cannot change HEARTH’s safety rules.</strong>
          <p>You still review anything that could affect care or sharing.</p>
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
        eyebrow="Review care tasks"
        title="Check the tasks HEARTH found"
        description="Open a task to see where it came from, who can help, and what needs to happen."
      />
      <div className="compiler-summary">
        <Metric value="26" label="care tasks" detail="from 10 example notes" />
        <Metric value="26" label="linked to a source" detail="you can check every one" tone="good" />
        <Metric value="3" label="need a person to review" detail="HEARTH will not decide them" tone="warn" />
        <Metric value="1" label="wording check" detail={resolution.extractionCorrected ? "Maya’s correction saved" : "waiting for Maya"} tone="neutral" />
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
            <strong>Please check one unclear note</strong>
            <p>“Blue pill if needed” does not identify a medicine. Confirm that the note is unclear.</p>
          </div>
          <button
            className="secondary-button"
            onClick={() => setResolution((value) => ({ ...value, extractionCorrected: true }))}
          >
            Mark as unclear
          </button>
        </div>
      )}
      {resolution.extractionCorrected && (
        <div className="success-callout">
          <Check aria-hidden="true" />
          <div>
            <strong>Correction saved</strong>
            <p>Maya marked the words as unclear. The original note is still available.</p>
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
  goTo,
  resolution,
}: {
  mission: ReturnType<typeof compileMission>;
  goTo: (screen: Screen) => void;
  resolution: DemoResolution;
}) {
  const open = mission.findings.filter((finding) => !finding.resolved);
  const controls = mission.findings.filter((finding) => finding.resolved);
  return (
    <>
      <ScreenHeader
        eyebrow="What needs attention"
        title={open.length === 0 ? "Everything has a clear path" : `${open.length} things still need follow-up`}
        description="Start with the first item. Other care tasks can continue."
      />
      <section className={`reality-banner ${statusClass(mission.status)}`}>
        <div className="reality-icon">{mission.status === "NOT EXECUTABLE" ? "!" : "✓"}</div>
        <div>
          <span>Care plan</span>
          <h2>{mission.status === "NOT EXECUTABLE" ? "Needs a few answers" : "Ready with checks"}</h2>
          <p>
            {mission.status === "NOT EXECUTABLE"
              ? "Some care tasks need a person, a piece of equipment, or a clear answer."
              : "The remaining checks and approvals are visible in the care plan."}
          </p>
        </div>
        <div className="reality-score">
          <strong>{mission.findings.filter((item) => item.resolved).length}/{mission.findings.length}</strong>
          <span>checks complete</span>
        </div>
      </section>
      {open.length > 0 && (
        <section className="section-block">
          <div className="section-title-row">
            <div><p className="eyebrow">Start here</p><h2>{open[0].title}</h2></div>
            <span className="count-badge">1 next step</span>
          </div>
          <article className="next-attention-card">
            <p>{open[0].explanation}</p>
            <div><strong>Who can help</strong><span>{open[0].resolver}</span></div>
            <button className="primary-button" onClick={() => goTo(resolution.medicationResolved ? "capacity" : "medications")}>
              {resolution.medicationResolved ? "Review help options" : "Prepare the medicine question"} <ArrowRight size={18} />
            </button>
          </article>
          <details className="secondary-details">
            <summary>See all {open.length} items</summary>
            <div className="finding-grid">
              {open.map((finding) => <FindingCard key={finding.code} finding={finding} />)}
            </div>
          </details>
        </section>
      )}
      <details className="secondary-details section-block">
        <summary>See {controls.length} completed checks</summary>
        <div className="finding-grid finding-grid-compact">
          {controls.map((finding) => <FindingCard key={finding.code} finding={finding} compact />)}
        </div>
      </details>
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
        eyebrow="Care plan"
        title="See what is happening and what is done"
        description="A task stays open until someone confirms the result."
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
        eyebrow="Medicine question"
        title="Two lists show different insulin amounts"
        description="HEARTH will not choose between them. A pharmacist or doctor needs to confirm the current amount."
      />
      <section className="med-comparison">
        <article className="med-source current-source">
          <div><span>Hospital list · July 26</span><SourceBadge sourceId="SRC-02" /></div>
          <h2>Insulin glargine</h2>
          <strong>18 units · nightly</strong>
          <p>Medication table, row 3</p>
          <span className="flag flag-review">Needs confirmation</span>
        </article>
        <div className="conflict-mark" aria-label="Conflicting instructions">
          <CircleAlert aria-hidden="true" />
          <span>does not match</span>
        </div>
        <article className="med-source older-source">
          <div><span>Home list · May 4</span><SourceBadge sourceId="SRC-03" /></div>
          <h2>Insulin glargine</h2>
          <strong>24 units · nightly</strong>
          <p>Older list kept for comparison</p>
          <span className="flag flag-outdated">Older list</span>
        </article>
      </section>
      <div className="safety-stop">
        <CircleAlert aria-hidden="true" />
        <div>
          <span>Needs a clear answer</span>
          <strong>Do not use HEARTH to choose an amount.</strong>
          <p>Ask a pharmacist or doctor which list is current.</p>
        </div>
      </div>
      <section className="workflow-panel">
        <div className="workflow-step complete">
          <span><Check /></span><div><strong>Different amounts found</strong><p>Both lists and dates are shown above.</p></div>
        </div>
        <div className={`workflow-step ${resolution.pharmacistQuestionPrepared ? "complete" : "current"}`}>
          <span>{resolution.pharmacistQuestionPrepared ? <Check /> : "2"}</span>
          <div>
            <strong>Prepare the question</strong>
            <p>“Which insulin glargine instruction is active: 18 units from July 26 or 24 units from May 4?”</p>
            {!resolution.pharmacistQuestionPrepared && (
              <button className="primary-button" onClick={() => setResolution((value) => ({ ...value, pharmacistQuestionPrepared: true }))}>
                Prepare this question
              </button>
            )}
          </div>
        </div>
        <div className={`workflow-step ${resolution.medicationResolved ? "complete" : resolution.pharmacistQuestionPrepared ? "current" : ""}`}>
          <span>{resolution.medicationResolved ? <Check /> : "3"}</span>
          <div>
            <strong>Record the answer</strong>
            <p>In this demo, the example answer includes who replied, when they replied, and Maya’s confirmation.</p>
            {resolution.pharmacistQuestionPrepared && !resolution.medicationResolved && (
              <button className="primary-button" onClick={() => setResolution((value) => ({ ...value, medicationResolved: true }))}>
                Record the example answer
              </button>
            )}
          </div>
        </div>
        <div className={`workflow-step ${resolution.medicationResolved ? "current" : ""}`}>
          <span>4</span><div><strong>Check the refill</strong><p>This stays open until the pharmacy confirms what happened.</p></div>
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
  return (
    <>
      <ScreenHeader
        eyebrow="Upcoming visit"
        title="Cardiology · August 1 at 10:00 AM"
        description="Transportation is the next thing to confirm."
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
          <p className="eyebrow">What Daniel will see</p>
          <h2>Ride request</h2>
          <dl>
            <div><dt>Date & time</dt><dd>Aug 1 · pickup 9:10 AM</dd></div>
            <div><dt>Location</dt><dd>Lakeshore Cardiology, north entrance</dd></div>
            <div><dt>Support</dt><dd>Foldable walker; allow extra entry time</dd></div>
          </dl>
          <div className="withheld-box">
            <strong>Not shared</strong>
            <p>Diagnosis, medicine list, and other private care details.</p>
          </div>
          <button
            className="primary-button"
            disabled={resolution.transportAssigned}
            onClick={() => setResolution((value) => ({ ...value, transportAssigned: true }))}
          >
            {resolution.transportAssigned ? "Daniel confirmed the ride" : "Record Daniel’s example reply"}
          </button>
        </aside>
      </section>
      <section className="visit-questions">
        <div>
          <p className="eyebrow">For the visit</p>
          <h2>Questions to bring</h2>
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
        eyebrow="Family help"
        title="Share the task, not the whole care record"
        description="Each helper sees only what they need for the task."
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
          <p className="eyebrow">Help plan</p>
          <h2>Give Maya back about 5 hours this week</h2>
          <p>This is a time estimate, not a medical judgment.</p>
        </div>
        <div className="delegation-list">
          <div><span>Transportation + pickup</span><strong>Daniel · 3h 20m</strong><small>Task-specific access</small></div>
          <div><span>Scale pickup</span><strong>Community service · 45m</strong><small>No medical details needed</small></div>
          <div><span>Home safety + supply checks</span><strong>Robert · 1h 05m</strong><small>Existing household access</small></div>
        </div>
        <button
          className="primary-button"
          disabled={resolution.eveningLoadRedistributed}
          onClick={() => setResolution((value) => ({ ...value, eveningLoadRedistributed: true }))}
        >
          {resolution.eveningLoadRedistributed ? "Help plan saved" : "Use this help plan"}
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
        eyebrow="My time and energy"
        title="Does this week fit Maya’s available time?"
        description="The estimate includes travel, waiting, calls, forms, and hands-on care."
      />
      <section className="capacity-hero">
        <div className="capacity-number">
          <span>{capacity.state}</span>
          <strong>{Math.abs(capacity.margin).toFixed(1)} hours</strong>
          <p>{capacity.margin < 0 ? "more care than Maya can cover" : "available after family help"}</p>
        </div>
        <div className="capacity-chart" role="img" aria-label={`${capacity.required} hours required compared with ${capacity.available} available`}>
          <div className="capacity-scale">
            <span>0h</span><span>7h</span><span>14h</span><span>21h</span><span>28h</span>
          </div>
          <div className="bar-line">
            <span style={{ width: `${ratio}%` }}>{capacity.required}h of care</span>
          </div>
          <div className="available-marker" style={{ left: `${(capacity.available / 28) * 100}%` }}>
            <span>{capacity.available}h Maya has</span>
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
        <div className="table-header"><span>Task</span><span>Suggested help</span><span>Why</span></div>
        <div><span>Transportation</span><strong>Delegate to Daniel</strong><span>Permitted and available</span></div>
        <div><span>Refill request</span><strong>HEARTH drafts; Maya approves</strong><span>Maya stays in control</span></div>
        <div><span>Wound care</span><strong>Ask home health</strong><span>Training is still needed</span></div>
        <div><span>Weight equipment</span><strong>Ask a community service</strong><span>No private care details needed</span></div>
      </section>
      {!resolution.eveningLoadRedistributed && (
        <button className="primary-button wide-action" onClick={() => setResolution((value) => ({ ...value, eveningLoadRedistributed: true }))}>
          Use this help plan <ArrowRight size={17} />
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
        eyebrow="Sharing"
        title="Choose what each helper can see"
        description="Access can be limited by task and removed at any time."
      />
      <section className="choice-banner">
        <div className="case-monogram">EB</div>
        <div><strong>Eleanor took part in this choice.</strong><p>Her preferences stay visible to the family.</p></div>
        <span className="flag flag-reviewed">Checked July 27</span>
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
          <p className="eyebrow">How HEARTH helps</p>
          <h2>HEARTH prepares. Maya approves.</h2>
          <p>Nothing is sent outside the household until Maya reviews it.</p>
        </div>
        <div className="segmented-control" role="group" aria-label="How HEARTH may help">
          {["Organize", "Recommend", "Prepare", "Delegate"].map((item) => (
            <button key={item} aria-pressed={mode === item} className={mode === item ? "active" : ""} onClick={() => setMode(item)}>{item}</button>
          ))}
        </div>
        <p className="mode-explanation">
          {mode === "Organize" && "HEARTH puts information in order and sends nothing."}
          {mode === "Recommend" && "HEARTH suggests a next step. The caregiver does it."}
          {mode === "Prepare" && "HEARTH prepares a draft. The caregiver reviews and approves it."}
          {mode === "Delegate" && "Only approved, low-risk example tasks can be handed off."}
        </p>
      </section>
      <div className={`revocation-card ${revoked ? "revoked" : ""}`}>
        <KeyRound aria-hidden="true" />
        <div>
          <strong>Daniel’s transportation access</strong>
          <p>{revoked ? "Access removed. The change was saved." : "Ride details only · ends August 1 at 6:00 PM · medical details are not shared"}</p>
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
        eyebrow="Activity history"
        title="See what happened and why"
        description="Each entry shows what was shared, who approved it, and what still needs follow-up."
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
        eyebrow="Privacy"
        title="Control access to this care record"
        description="This demo uses example records. You can review access, export a copy, or request deletion."
      />
      <div className="trust-principles">
        <article><ShieldCheck /><strong>Personal data is not sold</strong><p>No ads based on care information.</p></article>
        <article><Accessibility /><strong>Eleanor stays involved</strong><p>Sharing can be limited or removed.</p></article>
        <article><PackageCheck /><strong>Download a copy</strong><p>Export or print the care plan.</p></article>
        <article><History /><strong>Review activity</strong><p>See access, approvals, and corrections.</p></article>
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
        <button className="secondary-button"><PackageCheck size={17} /> Download example record</button>
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
        <div><span>External-style holdout</span><strong>15 / 20</strong><small>five first-run failures retained</small></div>
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
          <p className="eyebrow">Locked holdout</p>
          <h2>Five failures retained</h2>
          <p>Duplicate-name assignment, ambiguous dates, clinical shorthand, conflicting corrections, and recurring exceptions exposed real gaps. Two safety-taxonomy misses remain Phase 2 release blockers.</p>
          <span className="flag flag-review">15 / 20 · no reruns</span>
        </article>
        <article>
          <p className="eyebrow">Burden benchmark</p>
          <h2>No fictional time-saving claim</h2>
          <p>The product now includes a resettable eight-task timer, interaction/help/correction counts, confidence, effort, feedback, and JSON export. Net time saved remains unmeasured.</p>
          <span className="flag flag-review">0 participants · instrument ready</span>
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
        eyebrow="Reviewer tour · 3–5 minutes"
        title="See how the care plan becomes clear"
        description="Each step changes the example while keeping people in control."
      >
        <button className="secondary-button" onClick={() => setResolution(initialResolution)}>
          <RefreshCcw size={18} /> Restart tour
        </button>
      </ScreenHeader>
      <section className="demo-status">
        <div>
          <span>Care plan change</span>
          <div className="status-transition">
            <span className="status-pill status-blocked">! Needs attention</span>
            <ArrowRight />
            <StatusMark status={mission.status === "NOT EXECUTABLE" ? "READY WITH CONTROLS" : mission.status} />
          </div>
        </div>
        <div className="demo-progress">
          <strong>{completed} of {demoSteps.length}</strong>
          <span>steps complete</span>
          <div><span style={{ width: `${(completed / demoSteps.length) * 100}%` }} /></div>
        </div>
      </section>
      {next ? (
        <section className="next-demo-step">
          <span>Next step · {String(completed + 1).padStart(2, "0")}</span>
          <h2>{next.title}</h2>
          <p>{next.detail}</p>
          <button
            className="primary-button"
            onClick={() => setResolution((value) => ({ ...value, [next.key]: true }))}
          >
            Complete this step <ArrowRight size={17} />
          </button>
        </section>
      ) : (
        <section className="next-demo-step complete-demo">
          <Check aria-hidden="true" />
          <span>Tour complete</span>
          <h2>Ready with checks</h2>
          <p>Medicine questions stay with professionals, sharing limits stay active, and tasks stay open until someone confirms the result.</p>
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

  const renderScreen = () => {
    switch (screen) {
      case "welcome": return <WelcomeScreen onOpen={() => goTo("today")} status={mission.status} />;
      case "today": return <TodayScreen goTo={goTo} resolution={resolution} />;
      case "inbox": return <InboxScreen goTo={goTo} />;
      case "compile": return <CompilationScreen resolution={resolution} setResolution={setResolution} />;
      case "reality": return <RealityScreen mission={mission} goTo={goTo} resolution={resolution} />;
      case "board": return <BoardScreen resolution={resolution} />;
      case "medications": return <MedicationScreen resolution={resolution} setResolution={setResolution} />;
      case "appointments": return <AppointmentsScreen resolution={resolution} setResolution={setResolution} />;
      case "circle": return <CircleScreen resolution={resolution} setResolution={setResolution} />;
      case "capacity": return <CapacityScreen resolution={resolution} setResolution={setResolution} />;
      case "consent": return <ConsentScreen />;
      case "receipts": return <ReceiptsScreen />;
      case "trust": return <TrustScreen />;
      case "evidence": return <EvidenceScreen />;
      case "study": return <BurdenStudy />;
      case "demo": return <DemoScreen resolution={resolution} setResolution={setResolution} mission={mission} />;
    }
  };

  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <aside className={`sidebar ${mobileNavOpen ? "is-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark" aria-hidden="true"><HeartHandshake /></div>
          <div><strong>HEARTH</strong><span>Care, one step at a time</span></div>
          <button className="mobile-close" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)}><X /></button>
        </div>
        <div className="case-switcher">
          <div className="case-monogram">EB</div>
          <div><strong>Eleanor’s care</strong><span>Example · day 2 at home</span></div>
          <ChevronRight size={16} />
        </div>
        <nav aria-label="HEARTH sections">
          <div className="nav-group">
            <span>Care</span>
            {navItems.filter((item) => item.group === "Care").map((item) => {
              const Icon = item.icon;
              return (
                <button key={item.id} className={screen === item.id ? "active" : ""} onClick={() => goTo(item.id)} aria-current={screen === item.id ? "page" : undefined}>
                  <Icon size={20} aria-hidden="true" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>
          {(["More", "Reviewer"] as const).map((group) => (
            <details className="nav-details" key={`${group}-${screen}`} open={navItems.some((item) => item.group === group && item.id === screen) || undefined}>
              <summary>{group === "More" ? "More care tools" : "For reviewers"}</summary>
              <div className="nav-group">
                {navItems.filter((item) => item.group === group).map((item) => {
                  const Icon = item.icon;
                  return (
                    <button key={item.id} className={screen === item.id ? "active" : ""} onClick={() => goTo(item.id)} aria-current={screen === item.id ? "page" : undefined}>
                      <Icon size={19} aria-hidden="true" />
                      <span>{item.label}</span>
                      {item.id === "reality" && <b>{mission.blockerCount}</b>}
                    </button>
                  );
                })}
              </div>
            </details>
          ))}
        </nav>
        <div className="sidebar-footer">
          <ShieldCheck size={17} />
          <div><strong>You stay in control</strong><span>Review before anything is shared</span></div>
        </div>
      </aside>
      {mobileNavOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileNavOpen(false)} />}
      <div className="main-column">
        <header className="topbar">
          <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}><Menu /></button>
          <div className="breadcrumb"><span>Eleanor’s care</span><ChevronRight size={16} /><strong>{currentNav.label}</strong></div>
          <div className="topbar-actions">
            <span className="synthetic-chip">Example household</span>
            <StatusMark status={mission.status} />
            <button className="reviewer-button" onClick={() => goTo("demo")}>Reviewer tour</button>
          </div>
        </header>
        <main id="main-content" tabIndex={-1} className={screen === "welcome" ? "welcome-main" : ""}>
          {renderScreen()}
        </main>
        <footer className="app-footer">
          <span>HEARTH example</span>
          <span>All people and records shown are made up.</span>
          <span>HEARTH does not give medical advice.</span>
        </footer>
      </div>
      <nav className="mobile-quick-nav" aria-label="Quick navigation">
        {(["today", "board", "inbox", "circle"] as const).map((id) => {
          const item = navItems.find((entry) => entry.id === id)!;
          const Icon = item.icon;
          return (
            <button key={id} className={screen === id ? "active" : ""} onClick={() => goTo(id)} aria-current={screen === id ? "page" : undefined}>
              <Icon size={21} aria-hidden="true" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
