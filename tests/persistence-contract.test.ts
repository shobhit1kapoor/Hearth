import assert from "node:assert/strict";
import { test } from "node:test";
import {
  canPersistedTransition,
  requireTransition,
  safeInitialCommitmentState,
} from "../lib/safety/lifecycle";
import { scheduleNotification } from "../lib/notifications";

test("task lifecycle allows accountable progress and rejects unsafe jumps", () => {
  assert.equal(canPersistedTransition("identified", "assigned"), true);
  assert.equal(canPersistedTransition("identified", "verified"), false);
  assert.throws(() => requireTransition("identified", "verified", "done"));
  assert.throws(() => requireTransition("in_progress", "completed"));
  assert.doesNotThrow(() => requireTransition("in_progress", "completed", "Caregiver confirmed pickup."));
});

test("uncertain or high-risk extracted work starts in human review", () => {
  assert.equal(safeInitialCommitmentState({
    riskLevel: "high", requiresHumanReview: false, possibleConflict: null,
    evidenceKind: "verified_source_fact",
  }), "needs_review");
  assert.equal(safeInitialCommitmentState({
    riskLevel: "low", requiresHumanReview: false, possibleConflict: null,
    evidenceKind: "verified_source_fact",
  }), "identified");
});

test("quiet hours delay routine messages but never hide safety review", () => {
  const now = new Date("2026-07-30T03:00:00.000Z");
  const quietHours = {
    enabled: true, start: "20:00", end: "07:00",
    days: [0, 1, 2, 3, 4, 5, 6], timezone: "UTC",
  };
  assert.equal(scheduleNotification({ now, safetyCritical: false, professionalReview: false, quietHours }).delayed, true);
  assert.equal(scheduleNotification({ now, safetyCritical: true, professionalReview: false, quietHours }).delayed, false);
  assert.equal(scheduleNotification({ now, safetyCritical: false, professionalReview: true, quietHours }).delayed, false);
});
