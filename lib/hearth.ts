export type MissionStatus =
  | "READY"
  | "READY WITH CONTROLS"
  | "HOLD"
  | "NOT EXECUTABLE";

export type SafetyLevel = "H0" | "H1" | "H2" | "H3" | "H4";

export type LifecycleState =
  | "Identified"
  | "Needs review"
  | "Assigned"
  | "Awaiting acceptance"
  | "Accepted"
  | "In progress"
  | "Awaiting external response"
  | "Blocked"
  | "Escalated"
  | "Completed"
  | "Verified"
  | "Cancelled"
  | "Superseded";

export type Source = {
  id: string;
  title: string;
  type: string;
  date: string;
  origin: string;
  reviewed: boolean;
  outdated?: boolean;
  synthetic: true;
  extractedCount: number;
};

export type HistoryEvent = {
  at: string;
  actor: string;
  action: string;
  note: string;
};

export type Commitment = {
  id: string;
  responsibility: string;
  owner: string;
  alternates: string[];
  sourceId: string;
  sourceLocation: string;
  excerpt: string;
  sourceDate: string;
  verification: "Verified instruction" | "Caregiver-provided" | "AI interpretation" | "Unresolved conflict";
  confidence: "High" | "Medium" | "Low";
  dueWindow: string;
  dependencies: string[];
  equipment: string[];
  skill: string;
  privacy: "Care circle" | "Clinical" | "Caregiver private" | "Administrative";
  consentRule: string;
  risk: "Critical" | "High" | "Moderate" | "Low";
  safetyLevel: SafetyLevel;
  approvalRequired: boolean;
  completionCriteria: string;
  evidence: string;
  backup: string;
  escalation: string;
  state: LifecycleState;
  durationMinutes: number;
  history: HistoryEvent[];
};

export type Finding = {
  code: string;
  title: string;
  severity: "Critical" | "High" | "Moderate" | "Control";
  explanation: string;
  evidence: string[];
  affected: string[];
  requiredAction: string;
  resolver: string;
  unaffectedMayContinue: boolean;
  resolved: boolean;
};

export type DemoResolution = {
  extractionCorrected: boolean;
  pharmacistQuestionPrepared: boolean;
  medicationResolved: boolean;
  transportAssigned: boolean;
  equipmentArranged: boolean;
  woundTrainingArranged: boolean;
  eveningLoadRedistributed: boolean;
  providerAcknowledged: boolean;
  unclearInstructionEscalated: boolean;
};

export const initialResolution: DemoResolution = {
  extractionCorrected: false,
  pharmacistQuestionPrepared: false,
  medicationResolved: false,
  transportAssigned: false,
  equipmentArranged: false,
  woundTrainingArranged: false,
  eveningLoadRedistributed: false,
  providerAcknowledged: false,
  unclearInstructionEscalated: false,
};

export const sources: Source[] = [
  {
    id: "SRC-01",
    title: "Hospital discharge instructions",
    type: "Discharge PDF",
    date: "2026-07-26",
    origin: "Lakeshore Medical Center · page 4–9",
    reviewed: true,
    synthetic: true,
    extractedCount: 9,
  },
  {
    id: "SRC-02",
    title: "Medication list at discharge",
    type: "Medication list",
    date: "2026-07-26",
    origin: "Hospital pharmacy reconciliation",
    reviewed: true,
    synthetic: true,
    extractedCount: 5,
  },
  {
    id: "SRC-03",
    title: "Prior home medication list",
    type: "Medication list",
    date: "2026-05-04",
    origin: "Caregiver upload",
    reviewed: true,
    outdated: true,
    synthetic: true,
    extractedCount: 2,
  },
  {
    id: "SRC-04",
    title: "Cardiology portal message",
    type: "Provider message",
    date: "2026-07-27",
    origin: "Controlled message simulation",
    reviewed: false,
    synthetic: true,
    extractedCount: 3,
  },
  {
    id: "SRC-05",
    title: "Follow-up appointment instructions",
    type: "Appointment letter",
    date: "2026-07-26",
    origin: "Discharge coordination",
    reviewed: true,
    synthetic: true,
    extractedCount: 3,
  },
  {
    id: "SRC-06",
    title: "Home-health authorization",
    type: "Insurance letter",
    date: "2026-07-25",
    origin: "Northstar Health Plan",
    reviewed: true,
    synthetic: true,
    extractedCount: 2,
  },
  {
    id: "SRC-07",
    title: "Maya’s evening voice note",
    type: "Voice-note transcript",
    date: "2026-07-27",
    origin: "Caregiver-provided",
    reviewed: false,
    synthetic: true,
    extractedCount: 3,
  },
  {
    id: "SRC-08",
    title: "Family availability",
    type: "Availability",
    date: "2026-07-27",
    origin: "Maya and Daniel",
    reviewed: true,
    synthetic: true,
    extractedCount: 4,
  },
  {
    id: "SRC-09",
    title: "Eleanor’s permission choices",
    type: "Permission profile",
    date: "2026-07-27",
    origin: "Supported decision-making session",
    reviewed: true,
    synthetic: true,
    extractedCount: 5,
  },
  {
    id: "SRC-10",
    title: "Synthetic health-record bundle",
    type: "FHIR-like sandbox bundle",
    date: "2026-07-26",
    origin: "Controlled Phase 1 simulation",
    reviewed: true,
    synthetic: true,
    extractedCount: 6,
  },
];

const event = (action: string, note: string): HistoryEvent => ({
  at: "2026-07-27 09:20",
  actor: "HEARTH compiler v0.3",
  action,
  note,
});

const commitment = (
  value: Partial<Commitment> &
    Pick<Commitment, "id" | "responsibility" | "sourceId" | "dueWindow" | "owner">,
): Commitment => ({
  alternates: [],
  sourceLocation: "Structured section",
  excerpt: "Synthetic source excerpt retained for review.",
  sourceDate: "2026-07-26",
  verification: "Verified instruction",
  confidence: "High",
  dependencies: [],
  equipment: [],
  skill: "No specialized training",
  privacy: "Care circle",
  consentRule: "Share only with an assigned person for this task",
  risk: "Moderate",
  safetyLevel: "H1",
  approvalRequired: true,
  completionCriteria: "Outcome recorded and reviewed by the responsible owner",
  evidence: "No completion evidence yet",
  backup: "Return to primary caregiver for reassignment",
  escalation: "Primary caregiver",
  state: "Assigned",
  durationMinutes: 20,
  history: [event("Identified", "Responsibility extracted with source provenance.")],
  ...value,
});

export const commitments: Commitment[] = [
  commitment({
    id: "CCO-001",
    responsibility: "Clarify the active insulin glargine dose before the next administration",
    owner: "Pharmacist or prescriber",
    sourceId: "SRC-02",
    sourceLocation: "Medication table · row 3",
    excerpt: "Insulin glargine 18 units subcutaneous nightly.",
    dueWindow: "Before tonight · 8:00 PM",
    verification: "Unresolved conflict",
    confidence: "High",
    dependencies: ["Professional reconciliation of SRC-02 and SRC-03"],
    skill: "Licensed medication review",
    privacy: "Clinical",
    risk: "Critical",
    safetyLevel: "H3",
    completionCriteria: "Authorized professional confirms dose; Maya explicitly activates it",
    backup: "Use configured urgent clinical contact if no response before administration window",
    escalation: "Lakeshore pharmacy / prescribing clinician",
    state: "Blocked",
    durationMinutes: 25,
  }),
  commitment({
    id: "CCO-002",
    responsibility: "Request refill for furosemide",
    owner: "Maya Kapoor",
    sourceId: "SRC-02",
    sourceLocation: "Medication table · row 5",
    excerpt: "Furosemide 40 mg daily · 2 tablets remaining.",
    dueWindow: "Within 48 hours",
    dependencies: ["Caregiver approval", "Pharmacy response"],
    privacy: "Clinical",
    risk: "High",
    safetyLevel: "H1",
    completionCriteria: "Pharmacy confirms fill or records a blocking outcome",
    escalation: "Pharmacist",
    state: "Needs review",
    durationMinutes: 20,
  }),
  commitment({
    id: "CCO-003",
    responsibility: "Obtain a working digital scale for daily weight monitoring",
    owner: "Unassigned",
    sourceId: "SRC-01",
    sourceLocation: "Page 6 · Heart failure instructions",
    excerpt: "Record weight each morning before breakfast.",
    dueWindow: "Before tomorrow · 8:00 AM",
    equipment: ["Digital scale with stable platform"],
    risk: "High",
    safetyLevel: "H2",
    completionCriteria: "Scale is present, stable, and a reading can be recorded safely",
    escalation: "Home-health coordinator",
    state: "Blocked",
    durationMinutes: 45,
  }),
  commitment({
    id: "CCO-004",
    responsibility: "Perform and document wound dressing change",
    owner: "Unassigned qualified person",
    sourceId: "SRC-01",
    sourceLocation: "Page 7 · Wound care",
    excerpt: "Change dressing at 6 PM daily using clean technique.",
    dueWindow: "Today · 6:00–7:00 PM",
    equipment: ["Dressing kit", "Saline", "Disposable gloves"],
    skill: "Demonstrated wound-care technique",
    risk: "High",
    safetyLevel: "H3",
    completionCriteria: "Trained person documents dressing change and any observations",
    backup: "Contact home health; do not improvise an unfamiliar procedure",
    escalation: "Home-health nurse",
    state: "Blocked",
    durationMinutes: 35,
  }),
  commitment({
    id: "CCO-005",
    responsibility: "Arrange transportation and mobility support for cardiology",
    owner: "Unassigned",
    alternates: ["Daniel Kapoor"],
    sourceId: "SRC-05",
    sourceLocation: "Cardiology follow-up",
    excerpt: "Cardiology visit within 7 days; arrive 20 minutes early.",
    dueWindow: "August 1 · 9:10 AM pickup",
    dependencies: ["Helper acceptance", "Vehicle with easy entry"],
    equipment: ["Foldable walker"],
    privacy: "Administrative",
    risk: "High",
    safetyLevel: "H1",
    completionCriteria: "Driver accepts date, time, location, and mobility support",
    escalation: "Primary caregiver",
    state: "Awaiting acceptance",
    durationMinutes: 150,
  }),
  commitment({
    id: "CCO-006",
    responsibility: "Confirm primary-care follow-up appointment",
    owner: "Maya Kapoor",
    sourceId: "SRC-05",
    sourceLocation: "Primary-care follow-up",
    excerpt: "PCP follow-up in 7–10 days.",
    dueWindow: "Request by July 29",
    dependencies: ["Clinic response"],
    privacy: "Administrative",
    risk: "Moderate",
    safetyLevel: "H1",
    completionCriteria: "Appointment is offered, declined, or escalated",
    state: "Awaiting external response",
    durationMinutes: 20,
  }),
  commitment({
    id: "CCO-007",
    responsibility: "Acknowledge cardiology portal message",
    owner: "Maya Kapoor",
    sourceId: "SRC-04",
    sourceLocation: "Message thread · July 27",
    excerpt: "Please reply to confirm you received the monitoring plan.",
    dueWindow: "Today · 5:00 PM",
    dependencies: ["Caregiver message approval"],
    privacy: "Clinical",
    risk: "Moderate",
    safetyLevel: "H1",
    completionCriteria: "Cardiology office records acknowledgement",
    state: "Awaiting external response",
    durationMinutes: 10,
  }),
  commitment({
    id: "CCO-008",
    responsibility: "Resolve unclear instruction: “resume blue pill if needed”",
    owner: "Prescribing clinician",
    sourceId: "SRC-07",
    sourceLocation: "Transcript · 00:42",
    excerpt: "They said something about the blue pill, maybe resume if needed.",
    dueWindow: "Before any related medication action",
    verification: "AI interpretation",
    confidence: "Low",
    privacy: "Clinical",
    risk: "Critical",
    safetyLevel: "H3",
    completionCriteria: "Approved source identifies the medicine and exact instruction",
    backup: "Do not activate or infer the instruction",
    escalation: "Prescribing clinician",
    state: "Escalated",
    durationMinutes: 15,
  }),
  commitment({
    id: "CCO-009",
    responsibility: "Record morning weight",
    owner: "Robert, with Eleanor",
    sourceId: "SRC-01",
    dueWindow: "Daily · 7:30–8:30 AM",
    dependencies: ["CCO-003"],
    equipment: ["Digital scale"],
    risk: "High",
    safetyLevel: "H2",
    completionCriteria: "Weight entered with date, time, and recorder",
    state: "Blocked",
    durationMinutes: 10,
  }),
  commitment({
    id: "CCO-010",
    responsibility: "Record blood glucose before breakfast",
    owner: "Robert, with Eleanor",
    sourceId: "SRC-01",
    dueWindow: "Daily · 7:30 AM",
    equipment: ["Glucose meter", "Test strips"],
    skill: "Previously demonstrated meter technique",
    privacy: "Clinical",
    risk: "High",
    safetyLevel: "H2",
    completionCriteria: "Reading recorded; configured warning pathway used when applicable",
    state: "Accepted",
    durationMinutes: 10,
  }),
  commitment({
    id: "CCO-011",
    responsibility: "Prepare the current medication list for cardiology",
    owner: "Maya Kapoor",
    sourceId: "SRC-05",
    dueWindow: "By July 31",
    dependencies: ["CCO-001"],
    privacy: "Clinical",
    risk: "Moderate",
    safetyLevel: "H2",
    completionCriteria: "Reconciled list reviewed and placed in visit packet",
    state: "Blocked",
    durationMinutes: 25,
  }),
  commitment({
    id: "CCO-012",
    responsibility: "Prepare three caregiver questions for cardiology",
    owner: "Maya Kapoor",
    sourceId: "SRC-07",
    dueWindow: "By July 31",
    verification: "Caregiver-provided",
    privacy: "Caregiver private",
    risk: "Low",
    safetyLevel: "H0",
    approvalRequired: false,
    completionCriteria: "Maya reviews and saves the visit questions",
    state: "In progress",
    durationMinutes: 15,
  }),
  commitment({
    id: "CCO-013",
    responsibility: "Confirm first home-health visit under authorization",
    owner: "Maya Kapoor",
    sourceId: "SRC-06",
    dueWindow: "Within 24 hours",
    dependencies: ["Agency response"],
    privacy: "Administrative",
    risk: "High",
    safetyLevel: "H1",
    completionCriteria: "Agency confirms visit time and assigned clinician",
    state: "Awaiting external response",
    durationMinutes: 25,
  }),
  commitment({
    id: "CCO-014",
    responsibility: "Ask home health to demonstrate wound-care technique",
    owner: "Maya Kapoor",
    sourceId: "SRC-01",
    dueWindow: "At first home-health visit",
    dependencies: ["CCO-013"],
    skill: "Professional demonstration",
    risk: "High",
    safetyLevel: "H3",
    completionCriteria: "Qualified professional records teach-back outcome",
    state: "Assigned",
    durationMinutes: 45,
  }),
  commitment({
    id: "CCO-015",
    responsibility: "Collect discharge papers and insurance authorization for PCP",
    owner: "Maya Kapoor",
    sourceId: "SRC-05",
    dueWindow: "Before PCP visit",
    privacy: "Administrative",
    risk: "Low",
    safetyLevel: "H0",
    approvalRequired: false,
    completionCriteria: "Documents are in the visit packet",
    state: "Assigned",
    durationMinutes: 15,
  }),
  commitment({
    id: "CCO-016",
    responsibility: "Pick up approved furosemide refill",
    owner: "Daniel Kapoor",
    sourceId: "SRC-02",
    dueWindow: "After pharmacy confirmation · within 48 hours",
    dependencies: ["CCO-002", "Task-specific pharmacy pickup authorization"],
    privacy: "Administrative",
    risk: "Moderate",
    safetyLevel: "H2",
    completionCriteria: "Pickup recorded and receipt attached",
    state: "Blocked",
    durationMinutes: 50,
  }),
  commitment({
    id: "CCO-017",
    responsibility: "Check supply of glucose test strips",
    owner: "Robert",
    sourceId: "SRC-07",
    dueWindow: "Today · before 7:00 PM",
    verification: "Caregiver-provided",
    confidence: "Medium",
    equipment: ["Glucose test strips"],
    risk: "Moderate",
    safetyLevel: "H0",
    approvalRequired: false,
    completionCriteria: "Count recorded; low supply creates a refill responsibility",
    state: "Accepted",
    durationMinutes: 10,
  }),
  commitment({
    id: "CCO-018",
    responsibility: "Review visible warning signs using the discharge source",
    owner: "Maya Kapoor",
    sourceId: "SRC-01",
    dueWindow: "Today · 7:00 PM",
    privacy: "Clinical",
    risk: "High",
    safetyLevel: "H2",
    completionCriteria: "Caregiver confirms source was reviewed; HEARTH does not diagnose",
    state: "Assigned",
    durationMinutes: 15,
  }),
  commitment({
    id: "CCO-019",
    responsibility: "Place the after-hours clinical number beside the home phone",
    owner: "Robert",
    sourceId: "SRC-01",
    dueWindow: "Today",
    privacy: "Administrative",
    risk: "Moderate",
    safetyLevel: "H0",
    approvalRequired: false,
    completionCriteria: "Number is visible and Robert confirms where it is",
    state: "Accepted",
    durationMinutes: 5,
  }),
  commitment({
    id: "CCO-020",
    responsibility: "Confirm Daniel’s task-specific transportation access expires after the visit",
    owner: "Maya Kapoor",
    sourceId: "SRC-09",
    dueWindow: "Before transportation assignment",
    privacy: "Clinical",
    risk: "Moderate",
    safetyLevel: "H2",
    completionCriteria: "Access shows minimum fields and an August 1 expiration",
    state: "Needs review",
    durationMinutes: 5,
  }),
  commitment({
    id: "CCO-021",
    responsibility: "Complete evening medication organization without changing instructions",
    owner: "Maya Kapoor",
    sourceId: "SRC-02",
    dueWindow: "Daily · 7:30 PM",
    dependencies: ["CCO-001"],
    privacy: "Clinical",
    risk: "High",
    safetyLevel: "H2",
    completionCriteria: "Caregiver confirms medicines match the professionally reconciled list",
    state: "Blocked",
    durationMinutes: 25,
  }),
  commitment({
    id: "CCO-022",
    responsibility: "Check walker placement and clear the route to the bathroom",
    owner: "Robert",
    sourceId: "SRC-01",
    dueWindow: "Daily · before evening",
    equipment: ["Walker"],
    risk: "Moderate",
    safetyLevel: "H0",
    approvalRequired: false,
    completionCriteria: "Route is clear and walker is within reach",
    state: "Accepted",
    durationMinutes: 10,
  }),
  commitment({
    id: "CCO-023",
    responsibility: "Review tomorrow’s responsibilities with Eleanor using supported decision-making",
    owner: "Maya Kapoor",
    sourceId: "SRC-09",
    dueWindow: "Daily · before 8:30 PM",
    privacy: "Care circle",
    risk: "Low",
    safetyLevel: "H0",
    approvalRequired: false,
    completionCriteria: "Preferences, questions, or permission changes are recorded",
    state: "Assigned",
    durationMinutes: 20,
  }),
  commitment({
    id: "CCO-024",
    responsibility: "Record the outcome of the home-health authorization call",
    owner: "Maya Kapoor",
    sourceId: "SRC-06",
    dueWindow: "Immediately after response",
    privacy: "Administrative",
    risk: "Moderate",
    safetyLevel: "H1",
    completionCriteria: "Confirmation, denial, or escalation is attached to CCO-013",
    state: "Awaiting external response",
    durationMinutes: 10,
  }),
  commitment({
    id: "CCO-025",
    responsibility: "Prepare a printable one-page daily mission",
    owner: "HEARTH",
    sourceId: "SRC-10",
    dueWindow: "On caregiver request",
    verification: "AI interpretation",
    privacy: "Care circle",
    risk: "Low",
    safetyLevel: "H0",
    approvalRequired: false,
    completionCriteria: "Caregiver reviews the print view before use",
    state: "Completed",
    durationMinutes: 0,
  }),
  commitment({
    id: "CCO-026",
    responsibility: "Review superseded May medication list without activating it",
    owner: "Maya Kapoor",
    sourceId: "SRC-03",
    sourceLocation: "Entire source",
    excerpt: "Insulin glargine 24 units subcutaneous nightly.",
    dueWindow: "During medication reconciliation",
    verification: "Unresolved conflict",
    privacy: "Clinical",
    risk: "Critical",
    safetyLevel: "H3",
    completionCriteria: "Source remains preserved and marked superseded",
    state: "Superseded",
    durationMinutes: 10,
  }),
];

export const careCircle = [
  {
    name: "Eleanor Brooks",
    role: "Care recipient",
    access: "Controls her information and receives supported decision-making",
    status: "Active",
  },
  {
    name: "Maya Kapoor",
    role: "Primary caregiver",
    access: "Care plan, medicines, appointments; caregiver notes remain private",
    status: "Active",
  },
  {
    name: "Daniel Kapoor",
    role: "Sibling · transportation",
    access: "Aug 1 time, location, mobility support, contact instructions only",
    status: "Expires Aug 1",
  },
  {
    name: "Robert Brooks",
    role: "Spouse in the home",
    access: "Assigned home tasks and selected daily instructions",
    status: "Active",
  },
  {
    name: "Home-health reviewer",
    role: "Professional reviewer",
    access: "Wound-care responsibilities and related clinical sources",
    status: "Pending",
  },
];

export const permissionRules = [
  {
    purpose: "Transportation",
    role: "Daniel · sibling",
    allowed: "Date, time, location, mobility support",
    withheld: "Diagnoses, medicines, insurance, caregiver notes",
    expiry: "2026-08-01 18:00",
  },
  {
    purpose: "Medication question",
    role: "Pharmacist",
    allowed: "Conflicting medicine name, dose, source excerpts, callback",
    withheld: "Dementia diagnosis, family schedule, caregiver-private notes",
    expiry: "On resolution",
  },
  {
    purpose: "Wound-care review",
    role: "Home-health professional",
    allowed: "Wound instruction, equipment, training status, relevant contact",
    withheld: "Unrelated medicines and insurance correspondence",
    expiry: "2026-08-10",
  },
];

export function compileMission(resolution: DemoResolution): {
  status: MissionStatus;
  findings: Finding[];
  blockerCount: number;
} {
  const findings: Finding[] = [
    {
      code: "H101",
      title: "Conflicting medication instructions",
      severity: "Critical",
      explanation:
        "Two retained sources specify different nightly insulin glargine doses. HEARTH will not choose between them.",
      evidence: [
        "SRC-02 · 18 units nightly · 26 Jul",
        "SRC-03 · 24 units nightly · 4 May · marked older",
      ],
      affected: ["CCO-001", "CCO-011", "CCO-021", "CCO-026"],
      requiredAction:
        "A pharmacist or prescriber must reconcile the sources; Maya must confirm before activation.",
      resolver: "Pharmacist or prescribing clinician",
      unaffectedMayContinue: true,
      resolved: resolution.medicationResolved,
    },
    {
      code: "H203",
      title: "No qualified wound-care owner",
      severity: "Critical",
      explanation:
        "The requested 6 PM dressing change requires demonstrated technique, but no available person is currently documented as trained.",
      evidence: [
        "SRC-01 · daily 6 PM dressing change",
        "SRC-08 · Maya unavailable until 6:45 PM",
      ],
      affected: ["CCO-004", "CCO-014"],
      requiredAction:
        "Confirm a qualified home-health visit or record professional teach-back before assigning.",
      resolver: "Home-health professional",
      unaffectedMayContinue: true,
      resolved: resolution.woundTrainingArranged,
    },
    {
      code: "H306",
      title: "Required equipment unavailable",
      severity: "High",
      explanation:
        "Daily weight monitoring cannot begin because the home inventory does not include a working scale.",
      evidence: [
        "SRC-01 · daily morning weight",
        "SRC-07 · “the old scale no longer turns on”",
      ],
      affected: ["CCO-003", "CCO-009"],
      requiredAction:
        "Assign and verify acquisition of a stable digital scale.",
      resolver: "Caregiver or home-health coordinator",
      unaffectedMayContinue: true,
      resolved: resolution.equipmentArranged,
    },
    {
      code: "H411",
      title: "Permission boundary enforced",
      severity: "Control",
      explanation:
        "Daniel may receive transportation details but is not permitted to see diagnosis or medication information.",
      evidence: ["SRC-09 · purpose-specific transportation permission"],
      affected: ["CCO-005", "CCO-020"],
      requiredAction:
        "Keep the task-specific disclosure and automatic expiration in place.",
      resolver: "Eleanor or authorized representative",
      unaffectedMayContinue: true,
      resolved: true,
    },
    {
      code: "H508",
      title: "Caregiver capacity exceeded",
      severity: "High",
      explanation:
        "The first-week plan requires an estimated 23.8 hours against Maya’s 20 available hours, with six responsibilities clustered after work.",
      evidence: [
        "SRC-08 · 20 hours available",
        "Mission estimate · 23.8 hours required",
      ],
      affected: ["CCO-002", "CCO-006", "CCO-011", "CCO-013", "CCO-021", "CCO-023"],
      requiredAction:
        "Redistribute transportation, pickup, home checks, and administrative preparation.",
      resolver: "Maya with the care circle",
      unaffectedMayContinue: true,
      resolved: resolution.eveningLoadRedistributed,
    },
    {
      code: "H604",
      title: "Transportation has no accepted owner",
      severity: "High",
      explanation:
        "The cardiology visit has a date and mobility requirement but no helper has accepted transportation.",
      evidence: ["SRC-05 · Aug 1 cardiology visit", "SRC-08 · Daniel potentially available"],
      affected: ["CCO-005", "CCO-020"],
      requiredAction:
        "Send a minimum-necessary task request and record acceptance or reassignment.",
      resolver: "Maya or Daniel",
      unaffectedMayContinue: true,
      resolved: resolution.transportAssigned,
    },
    {
      code: "H710",
      title: "Older source is superseded",
      severity: "Control",
      explanation:
        "The May medication list remains visible for audit but cannot activate instructions.",
      evidence: ["SRC-03 · 4 May", "SRC-02 · 26 Jul"],
      affected: ["CCO-001", "CCO-026"],
      requiredAction: "Retain the older version and its correction history.",
      resolver: "System control",
      unaffectedMayContinue: true,
      resolved: true,
    },
    {
      code: "H808",
      title: "Insufficient evidence; human review required",
      severity: "Critical",
      explanation:
        "The phrase “blue pill if needed” does not identify a medicine, dose, frequency, or verified instruction.",
      evidence: ["SRC-07 · voice transcript at 00:42"],
      affected: ["CCO-008"],
      requiredAction:
        "Abstain, preserve the exact wording, and ask the prescriber for an approved source.",
      resolver: "Prescribing clinician",
      unaffectedMayContinue: true,
      resolved: resolution.unclearInstructionEscalated,
    },
    {
      code: "H702",
      title: "Provider follow-up not acknowledged",
      severity: "Moderate",
      explanation:
        "The cardiology message asks for confirmation, but no acknowledgement outcome is recorded.",
      evidence: ["SRC-04 · reply requested on 27 Jul"],
      affected: ["CCO-007"],
      requiredAction: "Approve the prepared acknowledgement and track the office response.",
      resolver: "Maya",
      unaffectedMayContinue: true,
      resolved: resolution.providerAcknowledged,
    },
  ];

  const blockers = findings.filter(
    (finding) =>
      !finding.resolved &&
      (finding.severity === "Critical" || finding.severity === "High"),
  );

  return {
    status: blockers.length > 0 ? "NOT EXECUTABLE" : "READY WITH CONTROLS",
    findings,
    blockerCount: blockers.length,
  };
}

export function safeProtocolResponse(input: string): {
  action: "abstain" | "continue";
  safetyLevel: SafetyLevel;
  response: string;
} {
  if (/protocol\s+9[-\s]?delta/i.test(input)) {
    return {
      action: "abstain",
      safetyLevel: "H3",
      response:
        "I cannot identify Protocol 9-Delta as a verified instruction. I will not invent its meaning or apply it. Please provide an approved source or request review from a qualified professional.",
    };
  }
  return {
    action: "continue",
    safetyLevel: "H0",
    response: "The input can continue through ordinary source review.",
  };
}

export function minimumNecessaryDisclosure(role: string) {
  if (role.toLowerCase().includes("daniel") || role.toLowerCase().includes("transport")) {
    return {
      allowed: ["Date", "Time", "Location", "Mobility support", "Contact instructions"],
      withheld: ["Dementia diagnosis", "Medication list", "Insurance", "Caregiver-private notes"],
    };
  }
  return { allowed: [], withheld: ["All household information pending a purpose-specific grant"] };
}

export function capacitySummary(resolution: DemoResolution) {
  const required = resolution.eveningLoadRedistributed ? 18.6 : 23.8;
  const available = 20;
  return {
    required,
    available,
    margin: Number((available - required).toFixed(1)),
    state: required > available ? "Deficit" : "Controlled margin",
  };
}

export const accountabilityReceipts = [
  {
    id: "AR-1042",
    action: "Insulin workflow blocked",
    reason: "Conflicting dose instructions",
    source: "SRC-02 + SRC-03",
    confidence: "High conflict confidence",
    shared: "Nothing sent externally",
    withheld: "All unrelated household information",
    permission: "No external action permitted",
    approval: "Professional review required",
    outcome: "CCO-001 remains blocked",
    uncertainty: "Active dose is unknown",
    next: "Prepare pharmacist question",
  },
  {
    id: "AR-1043",
    action: "Transportation disclosure prepared",
    reason: "Cardiology visit lacks an owner",
    source: "SRC-05 + SRC-08 + SRC-09",
    confidence: "High",
    shared: "Date, time, location, walker support",
    withheld: "Diagnosis, medicines, insurance, private notes",
    permission: "Transportation purpose · expires Aug 1",
    approval: "Maya approval required",
    outcome: "Awaiting helper acceptance",
    uncertainty: "Daniel has not accepted yet",
    next: "Record accept, decline, or reassignment",
  },
  {
    id: "AR-1044",
    action: "Protocol 9-Delta rejected",
    reason: "No verified meaning or approved source",
    source: "User-provided test input",
    confidence: "High uncertainty",
    shared: "Nothing",
    withheld: "All care data",
    permission: "Not applicable",
    approval: "Qualified human review required",
    outcome: "Abstained safely",
    uncertainty: "Protocol identity and meaning",
    next: "Request approved source",
  },
];

