"use client";

import { Check, Clock3, Download, HelpCircle, MousePointerClick, RefreshCcw } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type Condition = "manual" | "hearth-assisted";
type StepResult = {
  id: string;
  label: string;
  completedAt: string;
  elapsedSeconds: number;
};

const tasks = [
  "Locate the active discharge source",
  "Identify the next eight responsibilities",
  "Find conflicting or unclear instructions",
  "Assign safe owners and backups",
  "Check permission and minimum-disclosure boundaries",
  "Verify equipment and skill prerequisites",
  "Record external-response and completion criteria",
  "Produce a review-ready daily mission",
];

export default function BurdenStudy() {
  const [condition, setCondition] = useState<Condition>("manual");
  const [sessionStartedAt, setSessionStartedAt] = useState<string>();
  const [stepStartedAt, setStepStartedAt] = useState<number>();
  const [results, setResults] = useState<StepResult[]>([]);
  const [interactions, setInteractions] = useState(0);
  const [helpRequests, setHelpRequests] = useState(0);
  const [corrections, setCorrections] = useState(0);
  const [confidence, setConfidence] = useState(3);
  const [effort, setEffort] = useState(3);
  const [feedback, setFeedback] = useState("");
  const [now, setNow] = useState(0);

  useEffect(() => {
    if (!stepStartedAt) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [stepStartedAt]);

  const currentIndex = results.length;
  const elapsed = stepStartedAt ? Math.max(0, Math.floor((now - stepStartedAt) / 1000)) : 0;
  const totalSeconds = useMemo(() => results.reduce((sum, item) => sum + item.elapsedSeconds, 0), [results]);

  const countInteraction = () => setInteractions((value) => value + 1);

  const startSession = () => {
    countInteraction();
    const timestamp = new Date().toISOString();
    setSessionStartedAt(timestamp);
    setStepStartedAt(Date.now());
    setNow(Date.now());
  };

  const completeStep = () => {
    if (!stepStartedAt || currentIndex >= tasks.length) return;
    countInteraction();
    const timestamp = new Date().toISOString();
    setResults((value) => [
      ...value,
      {
        id: `T${String(currentIndex + 1).padStart(2, "0")}`,
        label: tasks[currentIndex],
        completedAt: timestamp,
        elapsedSeconds: Math.max(1, Math.floor((Date.now() - stepStartedAt) / 1000)),
      },
    ]);
    setStepStartedAt(currentIndex + 1 < tasks.length ? Date.now() : undefined);
    setNow(Date.now());
  };

  const reset = () => {
    setSessionStartedAt(undefined);
    setStepStartedAt(undefined);
    setResults([]);
    setInteractions(0);
    setHelpRequests(0);
    setCorrections(0);
    setConfidence(3);
    setEffort(3);
    setFeedback("");
  };

  const exportResult = () => {
    countInteraction();
    const payload = {
      schema: "hearth-burden-study/v1",
      exportedAt: new Date().toISOString(),
      participantId: null,
      condition,
      sessionStartedAt,
      sessionCompletedAt: results.length === tasks.length ? results.at(-1)?.completedAt : null,
      completed: results.length === tasks.length,
      tasks: results,
      measures: {
        totalSeconds,
        interactions: interactions + 1,
        helpRequests,
        corrections,
        confidenceOneToFive: confidence,
        effortOneToFive: effort,
      },
      optionalFeedback: feedback.trim() || null,
      interpretation: "Single-session record only. No comparative effect is calculated in the browser.",
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const href = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = href;
    anchor.download = `hearth-burden-${condition}-${Date.now()}.json`;
    anchor.click();
    URL.revokeObjectURL(href);
  };

  return (
    <>
      <header className="screen-header">
        <div>
          <p className="eyebrow">Timed burden study · no participant results loaded</p>
          <h1>Measure workflow burden without guessing</h1>
          <p>Run the same eight fixed responsibilities in a manual or HEARTH-assisted condition. The browser records observable time and interaction counts; it does not infer improvement.</p>
        </div>
        <button className="secondary-button" onClick={reset}><RefreshCcw size={16} /> Reset study</button>
      </header>

      <section className="study-protocol" aria-labelledby="study-condition">
        <div>
          <p className="eyebrow" id="study-condition">Condition</p>
          <div className="segmented-control" aria-label="Study condition">
            <button className={condition === "manual" ? "active" : ""} onClick={() => { countInteraction(); setCondition("manual"); }} disabled={Boolean(sessionStartedAt)}>Manual workflow</button>
            <button className={condition === "hearth-assisted" ? "active" : ""} onClick={() => { countInteraction(); setCondition("hearth-assisted"); }} disabled={Boolean(sessionStartedAt)}>HEARTH-assisted</button>
          </div>
        </div>
        <div className="study-stat"><Clock3 /><span>Current step</span><strong>{elapsed}s</strong></div>
        <div className="study-stat"><MousePointerClick /><span>Interactions</span><strong>{interactions}</strong></div>
        <div className="study-stat"><HelpCircle /><span>Help requests</span><strong>{helpRequests}</strong></div>
      </section>

      {!sessionStartedAt ? (
        <section className="study-start">
          <h2>Ready for an unpopulated study session</h2>
          <p>Use an anonymous participant code outside this prototype if approved by the study protocol. Do not enter names, health records, or contact details in feedback.</p>
          <button className="primary-button" onClick={startSession}>Start {condition === "manual" ? "manual" : "HEARTH-assisted"} timer</button>
        </section>
      ) : (
        <section className="study-task-list" aria-live="polite">
          {tasks.map((task, index) => {
            const result = results[index];
            const current = index === currentIndex;
            return (
              <article key={task} className={result ? "complete" : current ? "current" : ""}>
                <span>{result ? <Check /> : String(index + 1).padStart(2, "0")}</span>
                <div><strong>{task}</strong><p>{result ? `${result.elapsedSeconds} seconds recorded` : current ? "Timer running" : "Waiting for prior step"}</p></div>
                {current && <button className="primary-button" onClick={completeStep}>Complete step</button>}
              </article>
            );
          })}
        </section>
      )}

      <section className="study-measures">
        <div><label htmlFor="confidence">Confidence in result: {confidence}/5</label><input id="confidence" type="range" min="1" max="5" value={confidence} onChange={(event) => { countInteraction(); setConfidence(Number(event.target.value)); }} /></div>
        <div><label htmlFor="effort">Perceived effort: {effort}/5</label><input id="effort" type="range" min="1" max="5" value={effort} onChange={(event) => { countInteraction(); setEffort(Number(event.target.value)); }} /></div>
        <div className="study-counters">
          <button className="secondary-button" onClick={() => { countInteraction(); setHelpRequests((value) => value + 1); }}>Record help request</button>
          <button className="secondary-button" onClick={() => { countInteraction(); setCorrections((value) => value + 1); }}>Record correction</button>
        </div>
        <label className="feedback-field" htmlFor="study-feedback">Optional de-identified feedback<textarea id="study-feedback" value={feedback} maxLength={500} onChange={(event) => setFeedback(event.target.value)} placeholder="What made the workflow easier or harder? Do not enter personal or health information." /></label>
      </section>

      <section className="study-export">
        <div><p className="eyebrow">Current session</p><h2>{results.length} of {tasks.length} steps · {totalSeconds}s recorded</h2><p>Exported JSON is human-readable and includes no prefilled participant identity.</p></div>
        <button className="primary-button" onClick={exportResult} disabled={!sessionStartedAt}><Download size={17} /> Export session JSON</button>
      </section>
    </>
  );
}
