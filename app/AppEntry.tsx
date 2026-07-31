"use client";

import Link from "next/link";

export default function AppEntry() {
  return (
    <main className="entry-main">
      <section className="entry-card">
        <div className="entry-brand">HEARTH</div>
        <p className="eyebrow">Care, one step at a time</p>
        <h1>Turn care instructions into a clear plan.</h1>
        <p className="entry-description">
          HEARTH organizes care information, identifies missing or conflicting instructions, and helps caregivers
          safely track responsibilities. This public build uses a made-up household and does not require an account.
        </p>
        <div className="entry-actions entry-actions-single">
          <div className="entry-action-choice entry-action-choice-primary">
            <Link
              className="primary-button"
              href="/demo"
              onClick={(event) => {
                event.preventDefault();
                window.location.assign("/demo");
              }}
            >
              Open demo — no sign in
            </Link>
            <span>Explore a complete made-up household. Nothing is saved to an account.</span>
          </div>
        </div>
        <div className="entry-safety-note">
          <strong>Demo only. Use made-up information.</strong>
          <span>Sign-in and real patient data are not available in this public deployment.</span>
        </div>
      </section>
    </main>
  );
}
