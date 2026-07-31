"use client";

import {
  Bell,
  Check,
  ChevronRight,
  Download,
  FileText,
  HeartHandshake,
  Inbox,
  Languages,
  ListChecks,
  LogOut,
  Menu,
  Plus,
  Settings,
  ShieldCheck,
  Upload,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type ServiceReadiness = {
  supabase: boolean;
  ai: boolean;
  rateLimiting: boolean;
  email: boolean;
  monitoring: boolean;
  realPatientDataAllowed: boolean;
  publicDemo: boolean;
};

type CareSpace = {
  id: string;
  name: string;
  mode: string;
  care_recipients: Array<{ id: string; preferred_name: string; preferred_language: string }>;
  membership: { id: string; role: string } | null;
};

type Commitment = {
  id: string;
  version: number;
  title: string;
  plain_language_description: string;
  category: string;
  state: string;
  risk_level: string;
  confidence: number | null;
  evidence_kind: string;
  possible_conflict: string | null;
  requires_human_review: boolean;
  escalation_target: string | null;
  completion_evidence_rule: string;
  owner_member_id: string | null;
  commitment_sources: Array<{
    id: string;
    source_excerpt: string;
    source_date: string | null;
    source_documents: { id: string; original_file_name: string } | null;
  }>;
};

type SourceDocument = {
  id: string;
  original_file_name: string;
  mime_type: string;
  byte_size: number;
  processing_status: string;
  synthetic: boolean;
  created_at: string;
};

type WorkspaceView = "today" | "inbox" | "plan" | "family" | "settings";
type AuthMode = "sign_in" | "sign_up" | "recovery";
type CareSpaceInvitation = {
  id: string;
  care_space_id: string;
  care_space_name: string;
  role: string;
  expires_at: string | null;
};

const copy = {
  en: {
    today: "Today",
    inbox: "Care information",
    plan: "Care plan",
    family: "Family help",
    settings: "Settings",
    oneStep: "Start with one step.",
    noTasks: "There are no care tasks yet.",
  },
  es: {
    today: "Hoy",
    inbox: "Información de cuidado",
    plan: "Plan de cuidado",
    family: "Ayuda familiar",
    settings: "Configuración",
    oneStep: "Empiece con un paso.",
    noTasks: "Todavía no hay tareas de cuidado.",
  },
};

export default function CaregiverApp({ onTrySample }: { onTrySample: () => void }) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [readiness, setReadiness] = useState<ServiceReadiness | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [careSpaces, setCareSpaces] = useState<CareSpace[]>([]);
  const [invitations, setInvitations] = useState<CareSpaceInvitation[]>([]);
  const [activeSpace, setActiveSpace] = useState<CareSpace | null>(null);
  const [stage, setStage] = useState<"checking" | "auth" | "invitation" | "onboarding" | "workspace">(supabase ? "checking" : "auth");
  const [authMode, setAuthMode] = useState<AuthMode>("sign_in");
  const [notice, setNotice] = useState("");

  const loadCareSpaces = useCallback(async () => {
    const response = await fetch("/api/care-spaces", { cache: "no-store" });
    if (!response.ok) {
      setStage("auth");
      return;
    }
    const payload = await response.json() as { careSpaces: CareSpace[] };
    setCareSpaces(payload.careSpaces);
    if (payload.careSpaces.length === 0) {
      const invitationResponse = await fetch("/api/family/invitations", { cache: "no-store" });
      const invitationPayload = invitationResponse.ok
        ? await invitationResponse.json() as { invitations: CareSpaceInvitation[] }
        : { invitations: [] };
      setInvitations(invitationPayload.invitations);
      setStage(invitationPayload.invitations.length > 0 ? "invitation" : "onboarding");
    } else {
      setActiveSpace(payload.careSpaces[0]);
      setStage("workspace");
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetch("/api/readiness", { cache: "no-store" })
      .then((response) => response.json())
      .then((payload: { services: ServiceReadiness }) => active && setReadiness(payload.services))
      .catch(() => active && setReadiness(null));

    if (!supabase) {
      return () => { active = false; };
    }
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user);
      if (data.user) void loadCareSpaces();
      else setStage("auth");
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      if (session?.user) void loadCareSpaces();
      else setStage("auth");
    });
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [loadCareSpaces, supabase]);

  if (stage === "checking") {
    return <div className="care-loading"><HeartHandshake aria-hidden="true" /><strong>Opening HEARTH…</strong></div>;
  }

  if (stage === "auth") {
    return (
      <AuthScreen
        supabaseAvailable={Boolean(readiness?.supabase && supabase)}
        aiAvailable={Boolean(readiness?.ai)}
        mode={authMode}
        setMode={setAuthMode}
        notice={notice}
        setNotice={setNotice}
        onTrySample={onTrySample}
        onAuthenticated={(nextUser) => {
          setUser(nextUser);
          void loadCareSpaces();
        }}
      />
    );
  }

  if (stage === "onboarding" && user) {
    return (
      <OnboardingScreen
        email={user.email ?? ""}
        onSignOut={async () => { await supabase?.auth.signOut(); }}
        onComplete={async (careSpaceId) => {
          await loadCareSpaces();
          const next = careSpaces.find((space) => space.id === careSpaceId);
          if (next) setActiveSpace(next);
        }}
      />
    );
  }

  if (stage === "invitation" && user && invitations.length > 0) {
    return (
      <InvitationScreen
        invitation={invitations[0]}
        email={user.email ?? ""}
        onSignOut={async () => { await supabase?.auth.signOut(); }}
        onAccepted={loadCareSpaces}
        onCreateOwnSpace={() => setStage("onboarding")}
      />
    );
  }

  if (stage === "workspace" && user && activeSpace) {
    return (
      <CaregiverWorkspace
        user={user}
        careSpace={activeSpace}
        readiness={readiness}
        onSwitchSpace={(id) => setActiveSpace(careSpaces.find((space) => space.id === id) ?? activeSpace)}
        careSpaces={careSpaces}
        onSignOut={async () => { await supabase?.auth.signOut(); }}
      />
    );
  }

  return <div className="care-loading"><strong>HEARTH could not open this care space.</strong></div>;
}

function InvitationScreen({
  invitation,
  email,
  onSignOut,
  onAccepted,
  onCreateOwnSpace,
}: {
  invitation: CareSpaceInvitation;
  email: string;
  onSignOut: () => void;
  onAccepted: () => Promise<void>;
  onCreateOwnSpace: () => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function accept() {
    setPending(true);
    setError("");
    const response = await fetch("/api/family/invitations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invitationId: invitation.id }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload.error ?? "HEARTH could not accept this invitation.");
      setPending(false);
      return;
    }
    await onAccepted();
  }

  return (
    <main className="onboarding-main">
      <section className="onboarding-card">
        <div className="onboarding-top">
          <div className="entry-brand">HEARTH</div>
          <button className="text-button" onClick={onSignOut}><LogOut size={18} /> Sign out</button>
        </div>
        <p className="eyebrow">Family invitation</p>
        <h1>Help with {invitation.care_space_name}?</h1>
        <p>This invitation was sent to {email}. Accept it to see only the care information shared with you.</p>
        {error && <p className="form-error" role="alert">{error}</p>}
        <button className="primary-button" onClick={accept} disabled={pending}>
          {pending ? "Accepting…" : "Accept invitation"}
        </button>
        <button className="secondary-button" onClick={onCreateOwnSpace} disabled={pending}>Create my own care space</button>
      </section>
    </main>
  );
}

function AuthScreen({
  supabaseAvailable,
  aiAvailable,
  mode,
  setMode,
  notice,
  setNotice,
  onTrySample,
  onAuthenticated,
}: {
  supabaseAvailable: boolean;
  aiAvailable: boolean;
  mode: AuthMode;
  setMode: (mode: AuthMode) => void;
  notice: string;
  setNotice: (notice: string) => void;
  onTrySample: () => void;
  onAuthenticated: (user: User) => void;
}) {
  const supabase = useMemo(() => createSupabaseBrowserClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setPending(true);
    setNotice("");
    try {
      if (mode === "recovery") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth/callback?next=/`,
        });
        if (error) throw error;
        setNotice("Check your email for a password-reset link.");
      } else if (mode === "sign_up") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback?next=/`,
            data: { display_name: displayName },
          },
        });
        if (error) throw error;
        if (data.user && data.session) onAuthenticated(data.user);
        else setNotice("Check your email to verify your account, then return here to sign in.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        onAuthenticated(data.user);
      }
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "HEARTH could not complete sign-in.");
    } finally {
      setPending(false);
    }
  }

  async function sendMagicLink() {
    if (!supabase || !email) return;
    setPending(true);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/` },
    });
    setNotice(error ? error.message : "Check your email for a sign-in link.");
    setPending(false);
  }

  return (
    <main className="auth-main">
      <section className="auth-card">
        <div className="entry-brand">HEARTH</div>
        <p className="eyebrow">{mode === "sign_up" ? "Create an account" : mode === "recovery" ? "Reset password" : "Welcome back"}</p>
        <h1>{mode === "sign_up" ? "Create your private care space." : mode === "recovery" ? "Get a reset link." : "Sign in to continue."}</h1>
        {!supabaseAvailable ? (
          <div className="service-blocker" role="status">
            <ShieldCheck aria-hidden="true" />
            <div>
              <strong>Private accounts need Supabase setup.</strong>
              <p>The integration is built, but no Supabase project is connected on this computer. You can still use the sample case.</p>
              <button className="primary-button" onClick={onTrySample}>Try the sample case</button>
            </div>
          </div>
        ) : (
          <form className="care-form" onSubmit={submit}>
            {mode === "sign_up" && (
              <label>Your name<input value={displayName} onChange={(event) => setDisplayName(event.target.value)} required autoComplete="name" /></label>
            )}
            <label>Email<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" /></label>
            {mode !== "recovery" && (
              <label>Password<input type="password" minLength={10} value={password} onChange={(event) => setPassword(event.target.value)} required autoComplete={mode === "sign_up" ? "new-password" : "current-password"} /></label>
            )}
            {notice && <p className="form-notice" role="status">{notice}</p>}
            <button className="primary-button" type="submit" disabled={pending}>
              {pending ? "Please wait…" : mode === "sign_up" ? "Create account" : mode === "recovery" ? "Send reset link" : "Sign in"}
            </button>
            {mode === "sign_in" && (
              <button className="secondary-button" type="button" disabled={pending || !email} onClick={sendMagicLink}>Email me a sign-in link</button>
            )}
          </form>
        )}
        {supabaseAvailable && (
          <div className="auth-links">
            <button onClick={() => setMode(mode === "sign_up" ? "sign_in" : "sign_up")}>
              {mode === "sign_up" ? "Already have an account? Sign in" : "New to HEARTH? Create an account"}
            </button>
            {mode !== "recovery" && <button onClick={() => setMode("recovery")}>Forgot password?</button>}
            {mode === "recovery" && <button onClick={() => setMode("sign_in")}>Back to sign in</button>}
          </div>
        )}
        <div className="service-line">
          <span className={aiAvailable ? "service-ready" : "service-waiting"} />
          {aiAvailable ? "Live document analysis is connected." : "Live document analysis still needs an NVIDIA key."}
        </div>
      </section>
    </main>
  );
}

function OnboardingScreen({
  email,
  onSignOut,
  onComplete,
}: {
  email: string;
  onSignOut: () => void;
  onComplete: (id: string) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    careSpaceName: "Our family care space",
    recipientName: "",
    relationship: "",
    preferredLanguage: "en",
    notificationsEnabled: true,
    consentAcknowledged: false,
  });

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setPending(true);
    setError("");
    const response = await fetch("/api/care-spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const payload = await response.json();
    setPending(false);
    if (!response.ok) {
      setError(payload.error ?? "HEARTH could not create the care space.");
      return;
    }
    onComplete(payload.careSpaceId);
  }

  return (
    <main className="onboarding-main">
      <section className="onboarding-card">
        <div className="onboarding-top"><div className="entry-brand">HEARTH</div><button className="text-button" onClick={onSignOut}><LogOut size={18} /> Sign out</button></div>
        <p className="eyebrow">Step 2 of 3</p>
        <h1>Set up the care space.</h1>
        <p>Only enter what HEARTH needs to organize care. You can change these settings later.</p>
        <form className="care-form onboarding-form" onSubmit={submit}>
          <label>Care-space name<input value={form.careSpaceName} onChange={(event) => setForm({ ...form, careSpaceName: event.target.value })} required /></label>
          <label>Care recipient’s preferred name<input value={form.recipientName} onChange={(event) => setForm({ ...form, recipientName: event.target.value })} required /></label>
          <label>Your relationship<input placeholder="For example: daughter, spouse, friend" value={form.relationship} onChange={(event) => setForm({ ...form, relationship: event.target.value })} required /></label>
          <label>Preferred language<select value={form.preferredLanguage} onChange={(event) => setForm({ ...form, preferredLanguage: event.target.value })}><option value="en">English</option><option value="es">Español</option></select></label>
          <label className="check-row"><input type="checkbox" checked={form.notificationsEnabled} onChange={(event) => setForm({ ...form, notificationsEnabled: event.target.checked })} /><span>Show helpful reminders and a daily summary.</span></label>
          <label className="check-row consent-check"><input type="checkbox" checked={form.consentAcknowledged} onChange={(event) => setForm({ ...form, consentAcknowledged: event.target.checked })} required /><span>I understand that HEARTH is for controlled testing and does not give medical advice. I will use synthetic or properly de-identified information unless an approved policy allows otherwise.</span></label>
          <p className="signed-in-note">Signed in as {email}</p>
          {error && <p className="form-error" role="alert">{error}</p>}
          <button className="primary-button" disabled={pending || !form.consentAcknowledged}>{pending ? "Creating…" : "Create care space"}</button>
        </form>
      </section>
    </main>
  );
}

function CaregiverWorkspace({
  user,
  careSpace,
  readiness,
  careSpaces,
  onSwitchSpace,
  onSignOut,
}: {
  user: User;
  careSpace: CareSpace;
  readiness: ServiceReadiness | null;
  careSpaces: CareSpace[];
  onSwitchSpace: (id: string) => void;
  onSignOut: () => void;
}) {
  const recipient = careSpace.care_recipients[0];
  const isManager = ["primary_caregiver", "care_recipient", "administrator"].includes(careSpace.membership?.role ?? "");
  const [language, setLanguage] = useState<"en" | "es">((recipient?.preferred_language === "es" ? "es" : "en"));
  const [view, setView] = useState<WorkspaceView>("today");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commitments, setCommitments] = useState<Commitment[]>([]);
  const [documents, setDocuments] = useState<SourceDocument[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);
  const text = copy[language];

  const refresh = useCallback(() => setRefreshKey((value) => value + 1), []);

  useEffect(() => {
    let active = true;
    Promise.all([
      fetch(`/api/commitments?careSpaceId=${careSpace.id}`, { cache: "no-store" }).then((response) => response.json()),
      fetch(`/api/documents?careSpaceId=${careSpace.id}`, { cache: "no-store" }).then((response) => response.json()),
    ]).then(([taskPayload, documentPayload]) => {
      if (!active) return;
      setCommitments(taskPayload.commitments ?? []);
      setDocuments(documentPayload.documents ?? []);
    });
    return () => { active = false; };
  }, [careSpace.id, refreshKey]);

  const nextTask = commitments.find((item) => ["needs_review", "blocked", "escalated"].includes(item.state))
    ?? commitments.find((item) => !["verified", "cancelled", "superseded"].includes(item.state));

  function goTo(nextView: WorkspaceView) {
    setView(nextView);
    setMobileOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const nav: Array<{ id: WorkspaceView; label: string; icon: typeof Inbox }> = [
    { id: "today", label: text.today, icon: HeartHandshake },
    ...(isManager ? [{ id: "inbox" as const, label: text.inbox, icon: Inbox }] : []),
    { id: "plan", label: text.plan, icon: ListChecks },
    ...(isManager ? [{ id: "family" as const, label: text.family, icon: Users }] : []),
    { id: "settings", label: text.settings, icon: Settings },
  ];

  return (
    <div className="real-app-shell">
      <a className="skip-link" href="#care-main">Skip to main content</a>
      <aside className={`care-sidebar ${mobileOpen ? "is-open" : ""}`}>
        <div className="brand"><div className="brand-mark"><HeartHandshake /></div><div><strong>HEARTH</strong><span>Care, one step at a time</span></div><button className="mobile-close" aria-label="Close navigation" onClick={() => setMobileOpen(false)}><X /></button></div>
        <div className="real-space-picker">
          <label>Care space<select value={careSpace.id} onChange={(event) => onSwitchSpace(event.target.value)}>{careSpaces.map((space) => <option value={space.id} key={space.id}>{space.name}</option>)}</select></label>
          <strong>{recipient?.preferred_name ?? "Care recipient"}</strong>
        </div>
        <nav aria-label="Caregiver sections">
          {nav.map((item) => {
            const Icon = item.icon;
            return <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => goTo(item.id)}><Icon size={21} /><span>{item.label}</span>{item.id === "plan" && commitments.length > 0 && <b>{commitments.length}</b>}</button>;
          })}
        </nav>
        <div className="care-sidebar-bottom">
          <div className="service-line"><span className={readiness?.ai ? "service-ready" : "service-waiting"} />{readiness?.ai ? "Live analysis connected" : "Analysis waiting for setup"}</div>
          <button onClick={onSignOut}><LogOut size={18} /> Sign out</button>
        </div>
      </aside>
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <div className="care-main-column">
        <header className="care-topbar">
          <button className="mobile-menu" aria-label="Open navigation" onClick={() => setMobileOpen(true)}><Menu /></button>
          <div><span>{careSpace.name}</span><strong>{nav.find((item) => item.id === view)?.label}</strong></div>
          <div className="care-top-actions">
            <label className="language-switch"><Languages size={18} /><span className="sr-only">Language</span><select value={language} onChange={(event) => setLanguage(event.target.value as "en" | "es")}><option value="en">English</option><option value="es">Español</option></select></label>
            <button className="icon-button" aria-label="Notifications"><Bell size={21} /></button>
          </div>
        </header>
        <main id="care-main" tabIndex={-1} className="care-workspace">
          {view === "today" && <TodayView nextTask={nextTask} commitments={commitments} onOpenTask={() => goTo("plan")} onAddInformation={isManager ? () => goTo("inbox") : undefined} text={text} />}
          {view === "inbox" && isManager && <InboxView careSpaceId={careSpace.id} documents={documents} readiness={readiness} onChanged={refresh} />}
          {view === "plan" && <PlanView careSpaceId={careSpace.id} commitments={commitments} language={language} membership={careSpace.membership} isManager={isManager} onChanged={refresh} />}
          {view === "family" && isManager && <FamilyView careSpaceId={careSpace.id} />}
          {view === "settings" && <SettingsView careSpaceId={careSpace.id} userEmail={user.email ?? ""} canManageSpace={isManager} onDeleted={onSignOut} />}
        </main>
      </div>
      <nav className="real-mobile-nav" aria-label="Quick navigation">
        {nav.slice(0, 4).map((item) => {
          const Icon = item.icon;
          return <button key={item.id} className={view === item.id ? "active" : ""} onClick={() => goTo(item.id)}><Icon size={21} /><span>{item.label}</span></button>;
        })}
      </nav>
    </div>
  );
}

function TodayView({
  nextTask,
  commitments,
  onOpenTask,
  onAddInformation,
  text,
}: {
  nextTask?: Commitment;
  commitments: Commitment[];
  onOpenTask: () => void;
  onAddInformation?: () => void;
  text: typeof copy.en;
}) {
  const complete = commitments.filter((item) => item.state === "verified").length;
  return (
    <>
      <header className="real-screen-header"><p className="eyebrow">{text.today}</p><h1>{text.oneStep}</h1><p>You can stop and return later. Your care space saves your progress.</p></header>
      {nextTask ? (
        <section className="real-next-card">
          <span className="calm-attention">Do this first</span>
          <h2>{nextTask.title}</h2>
          <p>{nextTask.plain_language_description}</p>
          {nextTask.possible_conflict && <div className="plain-warning"><ShieldCheck /><span>{nextTask.possible_conflict}</span></div>}
          <button className="primary-button" onClick={onOpenTask}>Review this task <ChevronRight size={19} /></button>
        </section>
      ) : (
        <section className="empty-care-state"><Check aria-hidden="true" /><h2>{commitments.length ? "Everything has a clear path." : text.noTasks}</h2><p>{commitments.length ? `${complete} tasks are verified.` : onAddInformation ? "Add a note or document to begin." : "There are no tasks assigned to you."}</p>{onAddInformation && <button className="primary-button" onClick={onAddInformation}>Add care information</button>}</section>
      )}
      <div className="real-summary-grid">
        <article><strong>{commitments.filter((item) => item.state === "needs_review").length}</strong><span>need a quick review</span></article>
        <article><strong>{commitments.filter((item) => ["assigned", "awaiting_acceptance", "accepted", "in_progress"].includes(item.state)).length}</strong><span>being handled</span></article>
        <article><strong>{complete}</strong><span>verified complete</span></article>
      </div>
    </>
  );
}

function InboxView({
  careSpaceId,
  documents,
  readiness,
  onChanged,
}: {
  careSpaceId: string;
  documents: SourceDocument[];
  readiness: ServiceReadiness | null;
  onChanged: () => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [note, setNote] = useState("");
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  async function upload(file: File) {
    setPending(true);
    setMessage("Saving and checking the file…");
    const form = new FormData();
    form.set("file", file);
    form.set("careSpaceId", careSpaceId);
    form.set("synthetic", "true");
    form.set("preferredLanguage", "English");
    const response = await fetch("/api/uploads", { method: "POST", body: form });
    const payload = await response.json();
    setPending(false);
    setMessage(payload.message ?? (response.ok ? `${payload.commitmentCount ?? 0} care tasks are ready to review.` : payload.error));
    if (response.ok) onChanged();
  }

  async function addNote(kind: "note" | "medication") {
    if (!note.trim()) return;
    const file = new File([note], kind === "medication" ? "typed-medication-list.txt" : "caregiver-note.txt", { type: "text/plain" });
    await upload(file);
    setNote("");
  }

  async function loadSample() {
    setPending(true);
    const response = await fetch("/api/demo/load", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ careSpaceId }),
    });
    const payload = await response.json();
    setPending(false);
    setMessage(payload.message ?? payload.error);
    if (response.ok) onChanged();
  }

  return (
    <>
      <header className="real-screen-header"><p className="eyebrow">Care information</p><h1>Add notes and documents.</h1><p>HEARTH keeps the source beside every task it finds.</p></header>
      <div className="upload-safety"><ShieldCheck /><div><strong>Use synthetic or properly de-identified information.</strong><span>Real patient data is {readiness?.realPatientDataAllowed ? "allowed by this deployment policy." : "disabled."}</span></div></div>
      <section className="inbox-actions">
        <button className="primary-button" disabled={pending} onClick={() => inputRef.current?.click()}><Upload size={20} /> Upload documents</button>
        <input ref={inputRef} className="visually-hidden-input" type="file" accept=".pdf,.jpg,.jpeg,.png,.txt,application/pdf,image/jpeg,image/png,text/plain" onChange={(event) => { const file = event.target.files?.[0]; if (file) void upload(file); }} />
        <button className="secondary-button" disabled={pending} onClick={loadSample}>Load synthetic sample</button>
      </section>
      <section className="typed-note-card">
        <label htmlFor="care-note">Add a written note or medication list</label>
        <textarea id="care-note" value={note} onChange={(event) => setNote(event.target.value)} placeholder="Type or paste information here. Do not include real identifying information in this test deployment." />
        <div><button className="secondary-button" disabled={pending || !note.trim()} onClick={() => addNote("note")}>Add written note</button><button className="secondary-button" disabled={pending || !note.trim()} onClick={() => addNote("medication")}>Add medication list</button></div>
      </section>
      {message && <p className="workspace-notice" role="status">{message}</p>}
      <section className="real-list-section">
        <div className="real-section-title"><h2>Saved information</h2><span>{documents.length}</span></div>
        {documents.length === 0 ? <div className="simple-empty"><FileText /><p>No care information has been added yet.</p></div> : documents.map((document) => (
          <article className="real-document-row" key={document.id}><FileText /><div><strong>{document.original_file_name}</strong><span>{new Date(document.created_at).toLocaleDateString()} · {document.synthetic ? "Synthetic" : "Private"} example</span></div><span className={`plain-status status-${document.processing_status}`}>{document.processing_status.replaceAll("_", " ")}</span></article>
        ))}
      </section>
    </>
  );
}

function PlanView({
  careSpaceId,
  commitments,
  language,
  membership,
  isManager,
  onChanged,
}: {
  careSpaceId: string;
  commitments: Commitment[];
  language: "en" | "es";
  membership: CareSpace["membership"];
  isManager: boolean;
  onChanged: () => void;
}) {
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState<string | null>(null);
  const [helpers, setHelpers] = useState<Array<{ id: string; display_name: string | null; invited_email: string | null; status: string }>>([]);
  const [selectedHelpers, setSelectedHelpers] = useState<Record<string, string>>({});
  const [completionNotes, setCompletionNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!isManager) return;
    let active = true;
    fetch(`/api/family?careSpaceId=${careSpaceId}`, { cache: "no-store" })
      .then((response) => response.ok ? response.json() : { members: [] })
      .then((payload) => {
        if (!active) return;
        setHelpers((payload.members ?? []).filter((member: { role: string; status: string }) => member.role === "family_helper" && ["invited", "active"].includes(member.status)));
      });
    return () => { active = false; };
  }, [careSpaceId, isManager]);

  async function update(id: string, body: Record<string, unknown>) {
    const response = await fetch(`/api/commitments/${id}?careSpaceId=${careSpaceId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const payload = await response.json();
    setMessage(response.ok ? "The care plan was updated." : payload.error);
    if (response.ok) {
      setEditing(null);
      onChanged();
    }
  }

  async function translate(item: Commitment) {
    const protectedTerms = Array.from(item.plain_language_description.matchAll(/\b(?:\d+(?:\.\d+)?|mg|mL|units?|AM|PM)\b/gi)).map((match) => match[0]);
    const response = await fetch("/api/translations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        careSpaceId,
        commitmentId: item.id,
        text: item.plain_language_description,
        targetLanguage: language === "es" ? "Spanish" : "English",
        protectedTerms,
      }),
    });
    const payload = await response.json();
    setMessage(response.ok ? `Translation saved: ${payload.translation.translated_text}` : payload.error);
  }

  return (
    <>
      <header className="real-screen-header"><p className="eyebrow">Care plan</p><h1>Review every care task.</h1><p>Important or uncertain instructions stay inactive until a person reviews them.</p></header>
      {message && <p className="workspace-notice" role="status">{message}</p>}
      {commitments.length === 0 ? <div className="empty-care-state"><ListChecks /><h2>No tasks yet.</h2><p>Add care information to begin.</p></div> : (
        <section className="real-commitment-list">
          {commitments.map((item) => (
            <article key={item.id} className={`real-commitment risk-${item.risk_level}`}>
              <div className="real-commitment-top"><span className="plain-status">{item.state.replaceAll("_", " ")}</span><span>{Math.round((item.confidence ?? 0) * 100)}% extraction confidence</span></div>
              <h2>{item.title}</h2>
              <p>{item.plain_language_description}</p>
              {item.possible_conflict && <div className="plain-warning"><ShieldCheck /><span>{item.possible_conflict}</span></div>}
              <details>
                <summary>See source and review details</summary>
                <dl>
                  <div><dt>Source</dt><dd>{item.commitment_sources[0]?.source_documents?.original_file_name ?? "Uploaded information"}</dd></div>
                  <div><dt>Exact words</dt><dd>{item.commitment_sources[0]?.source_excerpt ?? "Source excerpt unavailable"}</dd></div>
                  <div><dt>Review</dt><dd>{item.requires_human_review ? `A person must review this${item.escalation_target ? ` · ${item.escalation_target}` : ""}` : "Caregiver review is enough"}</dd></div>
                  <div><dt>Done when</dt><dd>{item.completion_evidence_rule}</dd></div>
                </dl>
              </details>
              {editing === item.id ? (
                <CorrectionForm item={item} onCancel={() => setEditing(null)} onSave={(title, description, reason) => update(item.id, { action: "correct", baseVersion: item.version, title, description, reason })} />
              ) : (
                <div className="commitment-actions">
                  {isManager && ["identified", "needs_review"].includes(item.state) && <button className="primary-button" onClick={() => update(item.id, { action: "confirm" })}>{item.requires_human_review && ["high", "critical"].includes(item.risk_level) ? "Send for professional review" : "Confirm this task"}</button>}
                  {isManager && item.state === "assigned" && helpers.length > 0 && <div className="task-handoff"><label>Choose a helper<select value={selectedHelpers[item.id] ?? ""} onChange={(event) => setSelectedHelpers({ ...selectedHelpers, [item.id]: event.target.value })}><option value="">Select a helper</option>{helpers.map((helper) => <option key={helper.id} value={helper.id}>{helper.display_name ?? helper.invited_email ?? "Family helper"}{helper.status === "invited" ? " · invitation pending" : ""}</option>)}</select></label><button className="primary-button" disabled={!selectedHelpers[item.id]} onClick={() => update(item.id, { action: "assign", memberId: selectedHelpers[item.id] })}>Assign task</button></div>}
                  {!isManager && item.state === "awaiting_acceptance" && item.owner_member_id === membership?.id && <button className="primary-button" onClick={() => update(item.id, { action: "accept" })}>Accept this task</button>}
                  {item.state === "accepted" && (isManager || item.owner_member_id === membership?.id) && <button className="primary-button" onClick={() => update(item.id, { action: "start" })}>Start this task</button>}
                  {item.state === "in_progress" && (isManager || item.owner_member_id === membership?.id) && <div className="task-completion"><label>What was completed?<textarea value={completionNotes[item.id] ?? ""} onChange={(event) => setCompletionNotes({ ...completionNotes, [item.id]: event.target.value })} placeholder={item.completion_evidence_rule} /></label><button className="primary-button" disabled={!completionNotes[item.id]?.trim()} onClick={() => update(item.id, { action: "complete", completionEvidence: completionNotes[item.id] })}>Mark complete</button></div>}
                  {isManager && item.state === "completed" && <button className="primary-button" onClick={() => update(item.id, { action: "verify", completionEvidence: "Caregiver reviewed the recorded completion." })}>Verify completion</button>}
                  {isManager && <button className="secondary-button" onClick={() => setEditing(item.id)}>Correct</button>}
                  {isManager && ["identified", "needs_review"].includes(item.state) && <button className="text-button danger-text" onClick={() => update(item.id, { action: "reject", reason: "Caregiver rejected this extracted task." })}>Reject</button>}
                  <button className="text-button" onClick={() => translate(item)}><Languages size={18} /> Translate</button>
                </div>
              )}
            </article>
          ))}
        </section>
      )}
    </>
  );
}

function CorrectionForm({ item, onCancel, onSave }: { item: Commitment; onCancel: () => void; onSave: (title: string, description: string, reason: string) => void }) {
  const [title, setTitle] = useState(item.title);
  const [description, setDescription] = useState(item.plain_language_description);
  const [reason, setReason] = useState("");
  return <div className="inline-correction"><label>Task title<input value={title} onChange={(event) => setTitle(event.target.value)} /></label><label>Plain-language description<textarea value={description} onChange={(event) => setDescription(event.target.value)} /></label><label>Why are you changing it?<input value={reason} onChange={(event) => setReason(event.target.value)} required /></label><div><button className="primary-button" disabled={!reason.trim()} onClick={() => onSave(title, description, reason)}>Save correction</button><button className="secondary-button" onClick={onCancel}>Cancel</button></div></div>;
}

function FamilyView({ careSpaceId }: { careSpaceId: string }) {
  const [members, setMembers] = useState<Array<Record<string, unknown>>>([]);
  const [message, setMessage] = useState("");
  const [form, setForm] = useState({ name: "", email: "", purpose: "Transportation help", canView: true, canEdit: true, canReceiveAlerts: true, canAccessDocuments: false, canContactProfessionals: false });

  const load = useCallback(async () => {
    const response = await fetch(`/api/family?careSpaceId=${careSpaceId}`, { cache: "no-store" });
    const payload = await response.json();
    setMembers(payload.members ?? []);
  }, [careSpaceId]);
  useEffect(() => {
    let active = true;
    fetch(`/api/family?careSpaceId=${careSpaceId}`, { cache: "no-store" })
      .then((response) => response.json())
      .then((payload) => { if (active) setMembers(payload.members ?? []); });
    return () => { active = false; };
  }, [careSpaceId]);

  async function invite(event: React.FormEvent) {
    event.preventDefault();
    const response = await fetch("/api/family", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        careSpaceId,
        ...form,
        allowedCategories: ["transportation", "appointments", "tasks"],
        expiresAt: null,
      }),
    });
    const payload = await response.json() as {
      error?: string;
      email?: { sent: boolean; reason?: string };
    };
    if (!response.ok) {
      setMessage(payload.error ?? "HEARTH could not save this invitation.");
    } else if (payload.email?.sent) {
      setMessage("Invitation sent. The helper will see only the tasks you assign.");
    } else {
      setMessage(`Access is saved, but the email could not be sent. Ask ${form.name} to open HEARTH and sign in with ${form.email}.`);
    }
    if (response.ok) {
      setForm({ ...form, name: "", email: "" });
      void load();
    }
  }

  async function revoke(permissionId: string) {
    const response = await fetch("/api/family", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ careSpaceId, permissionId, revoke: true }),
    });
    const payload = await response.json();
    setMessage(response.ok ? "Access removed immediately." : payload.error);
    if (response.ok) void load();
  }

  return (
    <>
      <header className="real-screen-header"><p className="eyebrow">Family help</p><h1>Share the task, not the whole record.</h1><p>Choose exactly what each helper may see or do.</p></header>
      <form className="invite-card care-form" onSubmit={invite}>
        <div><UserPlus /><div><h2>Invite a family helper</h2><p>They must accept before a task is handed over.</p></div></div>
        <label>Name<input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required /></label>
        <label>Email<input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required /></label>
        <label>Purpose<input value={form.purpose} onChange={(event) => setForm({ ...form, purpose: event.target.value })} required /></label>
        <div className="permission-checks">
          <label className="check-row"><input type="checkbox" checked={form.canView} onChange={(event) => setForm({ ...form, canView: event.target.checked })} /><span>Can view assigned tasks</span></label>
          <label className="check-row"><input type="checkbox" checked={form.canEdit} onChange={(event) => setForm({ ...form, canEdit: event.target.checked })} /><span>Can update assigned tasks</span></label>
          <label className="check-row"><input type="checkbox" checked={form.canReceiveAlerts} onChange={(event) => setForm({ ...form, canReceiveAlerts: event.target.checked })} /><span>Can receive alerts</span></label>
          <label className="check-row"><input type="checkbox" checked={form.canAccessDocuments} onChange={(event) => setForm({ ...form, canAccessDocuments: event.target.checked })} /><span>Can open shared documents</span></label>
        </div>
        <button className="primary-button"><Plus size={19} /> Send invitation</button>
      </form>
      {message && <p className="workspace-notice" role="status">{message}</p>}
      <section className="real-list-section">
        <div className="real-section-title"><h2>Care-space members</h2><span>{members.length}</span></div>
        {members.map((member) => {
          const permissions = (member.permissions as Array<Record<string, unknown>> | undefined) ?? [];
          const memberName = String(member.display_name ?? member.invited_email ?? member.role ?? "Member");
          return <article className="member-row" key={String(member.id)}><div className="member-avatar">{memberName.slice(0, 1).toUpperCase()}</div><div><strong>{memberName}</strong><span>{String(member.role).replaceAll("_", " ")} · {String(member.status)}</span><small>{permissions[0] ? `Purpose: ${permissions[0].purpose}` : "Full caregiver access"}</small></div>{permissions[0] && !permissions[0].revoked_at && <button className="secondary-button" onClick={() => revoke(String(permissions[0].id))}>Revoke access</button>}</article>;
        })}
      </section>
    </>
  );
}

function SettingsView({ careSpaceId, userEmail, canManageSpace, onDeleted }: { careSpaceId: string; userEmail: string; canManageSpace: boolean; onDeleted: () => void }) {
  const [message, setMessage] = useState("");
  const [deleteText, setDeleteText] = useState("");
  const [settings, setSettings] = useState({
    masterEnabled: true,
    emailEnabled: false,
    inAppEnabled: true,
    dailySummary: true,
    categories: {
      daily_responsibilities: true,
      appointments: true,
      medication_refills: true,
      family_task_updates: true,
      external_responses: true,
      routine_summaries: true,
      professional_review: true,
    },
    quietHours: { enabled: true, start: "21:00", end: "07:00", days: [0, 1, 2, 3, 4, 5, 6], timezone: Intl.DateTimeFormat().resolvedOptions().timeZone },
  });

  useEffect(() => {
    fetch(`/api/settings/notifications?careSpaceId=${careSpaceId}`, { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return;
      const payload = await response.json();
      setSettings({
        masterEnabled: payload.preferences.master_enabled,
        emailEnabled: payload.preferences.email_enabled,
        inAppEnabled: payload.preferences.in_app_enabled,
        dailySummary: payload.preferences.daily_summary,
        categories: payload.preferences.category_settings,
        quietHours: {
          enabled: payload.quietHours.enabled,
          start: String(payload.quietHours.start_time).slice(0, 5),
          end: String(payload.quietHours.end_time).slice(0, 5),
          days: payload.quietHours.days,
          timezone: payload.quietHours.timezone,
        },
      });
    });
  }, [careSpaceId]);

  async function saveSettings() {
    const response = await fetch(`/api/settings/notifications?careSpaceId=${careSpaceId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    const payload = await response.json();
    setMessage(response.ok ? "Notification settings saved." : payload.error);
  }

  async function exportData() {
    const response = await fetch("/api/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ careSpaceId }),
    });
    if (!response.ok) {
      const payload = await response.json();
      setMessage(payload.error);
      return;
    }
    const blob = await response.blob();
    const href = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = href;
    link.download = `hearth-export-${careSpaceId}.json`;
    link.click();
    URL.revokeObjectURL(href);
    setMessage("Export downloaded.");
  }

  async function deleteSpace() {
    const response = await fetch("/api/deletion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ careSpaceId, confirmation: deleteText }),
    });
    const payload = await response.json();
    setMessage(response.ok ? "The care space and active care data were deleted." : payload.error);
    if (response.ok) onDeleted();
  }

  return (
    <>
      <header className="real-screen-header"><p className="eyebrow">Settings</p><h1>Choose when HEARTH should notify you.</h1><p>Routine updates wait during quiet hours. Safety and professional-review issues remain visible.</p></header>
      <section className="settings-card">
        <div className="setting-row"><div><strong>All notifications</strong><span>Turn routine reminders on or off.</span></div><input aria-label="All notifications" type="checkbox" checked={settings.masterEnabled} onChange={(event) => setSettings({ ...settings, masterEnabled: event.target.checked })} /></div>
        <div className="setting-row"><div><strong>In-app notifications</strong><span>Show updates inside HEARTH.</span></div><input aria-label="In-app notifications" type="checkbox" checked={settings.inAppEnabled} onChange={(event) => setSettings({ ...settings, inAppEnabled: event.target.checked })} /></div>
        <div className="setting-row"><div><strong>Email notifications</strong><span>Send permitted reminders to {userEmail}.</span></div><input aria-label="Email notifications" type="checkbox" checked={settings.emailEnabled} onChange={(event) => setSettings({ ...settings, emailEnabled: event.target.checked })} /></div>
        <div className="setting-row"><div><strong>Daily summary</strong><span>Group routine updates into one summary.</span></div><input aria-label="Daily summary" type="checkbox" checked={settings.dailySummary} onChange={(event) => setSettings({ ...settings, dailySummary: event.target.checked })} /></div>
      </section>
      <section className="settings-card quiet-settings">
        <div className="setting-row"><div><strong>Quiet hours</strong><span>Routine notifications will wait until quiet hours end.</span></div><input aria-label="Quiet hours" type="checkbox" checked={settings.quietHours.enabled} onChange={(event) => setSettings({ ...settings, quietHours: { ...settings.quietHours, enabled: event.target.checked } })} /></div>
        <div className="time-fields"><label>Start<input type="time" value={settings.quietHours.start} onChange={(event) => setSettings({ ...settings, quietHours: { ...settings.quietHours, start: event.target.value } })} /></label><label>End<input type="time" value={settings.quietHours.end} onChange={(event) => setSettings({ ...settings, quietHours: { ...settings.quietHours, end: event.target.value } })} /></label></div>
      </section>
      <button className="primary-button settings-save" onClick={saveSettings}>Save notification settings</button>
      {message && <p className="workspace-notice" role="status">{message}</p>}
      {canManageSpace && <section className="data-control-card">
        <div><Download /><div><h2>Export your information</h2><p>Download the care plan, permissions, activity history, and settings as JSON.</p></div></div>
        <button className="secondary-button" onClick={exportData}>Download export</button>
      </section>}
      {canManageSpace && <section className="data-control-card deletion-control">
        <div><ShieldCheck /><div><h2>Delete this care space</h2><p>This removes files and active care data. A minimal deletion record is kept.</p></div></div>
        <label>Type DELETE to confirm<input value={deleteText} onChange={(event) => setDeleteText(event.target.value)} /></label>
        <button className="secondary-button danger-button" disabled={deleteText !== "DELETE"} onClick={deleteSpace}>Delete care space</button>
      </section>}
    </>
  );
}
