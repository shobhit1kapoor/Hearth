"use client";

import Link from "next/link";
import { useState } from "react";
import CaregiverApp from "./CaregiverApp";

export default function AppEntry() {
  const [mode, setMode] = useState<"start" | "caregiver">("start");

  if (mode === "caregiver") return <CaregiverApp onTrySample={() => window.location.assign("/demo")} />;

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
          <div className="entry-action-choice entry-action-choice-primary">
            <Link className="primary-button" href="/demo">Open demo — no sign in</Link>
            <span>Explore a complete made-up household. Nothing is saved to an account.</span>
          </div>
          <div className="entry-action-choice">
            <button className="secondary-button" onClick={() => setMode("caregiver")}>Sign in or create an account</button>
            <span>Use the private workspace for saved caregiver testing.</span>
          </div>
        </div>
        <div className="entry-safety-note">
          <strong>Start with example or de-identified information.</strong>
          <span>Real patient data stays disabled until an approved deployment policy turns it on.</span>
        </div>
      </section>
    </main>
  );
}
