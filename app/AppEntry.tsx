"use client";

import { useState } from "react";
import CaregiverApp from "./CaregiverApp";
import HearthApp from "./HearthApp";

export default function AppEntry() {
  const [mode, setMode] = useState<"start" | "caregiver" | "demo">("start");

  if (mode === "demo") return <HearthApp />;
  if (mode === "caregiver") return <CaregiverApp onTrySample={() => setMode("demo")} />;

  return (
    <main className="entry-main">
      <section className="entry-card">
        <div className="entry-brand">HEARTH</div>
        <p className="eyebrow">Care, one step at a time</p>
        <h1>Turn care instructions into a clear plan.</h1>
        <p className="entry-description">
          HEARTH organizes care information, identifies missing or conflicting instructions, and helps caregivers
          safely track responsibilities. HEARTH does not diagnose or change treatment.
        </p>
        <div className="entry-actions">
          <button className="primary-button" onClick={() => setMode("caregiver")}>Create my care space</button>
          <button className="secondary-button" onClick={() => setMode("demo")}>Try the sample case</button>
        </div>
        <div className="entry-safety-note">
          <strong>Start with example or de-identified information.</strong>
          <span>Real patient data stays disabled until an approved deployment policy turns it on.</span>
        </div>
      </section>
    </main>
  );
}
