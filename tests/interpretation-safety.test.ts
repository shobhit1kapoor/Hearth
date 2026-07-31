import assert from "node:assert/strict";
import test from "node:test";
import {
  assessClinicalShorthand,
  modelRecurringSchedule,
  reconcileCorrections,
  resolveNamedAssignee,
  resolveNumericDate,
} from "../lib/safety/interpretation";

test("duplicate names require explicit person selection", () => {
  const result = resolveNamedAssignee("Alex", [
    { id: "member-1", displayName: "Alex", disambiguator: "Sibling" },
    { id: "member-2", displayName: "Alex", disambiguator: "Neighbor" },
  ]);
  assert.equal(result.action, "request_disambiguation");
  assert.equal(result.memberId, null);
  assert.equal(result.options.length, 2);
});

test("a unique identity can be assigned by stable member id", () => {
  const result = resolveNamedAssignee("Daniel", [
    { id: "member-1", displayName: "Daniel", disambiguator: "Sibling" },
    { id: "member-2", displayName: "Maya", disambiguator: "Primary caregiver" },
  ]);
  assert.equal(result.action, "assign_unique");
  assert.equal(result.memberId, "member-1");
});

test("ambiguous numeric dates remain unparsed until locale is confirmed", () => {
  const unresolved = resolveNumericDate("Follow up on 8/9 after discharge.");
  assert.equal(unresolved.action, "request_date_locale");
  assert.equal(unresolved.parsed, null);
  assert.deepEqual(unresolved.choices, ["August 9", "September 8"]);

  const resolved = resolveNumericDate("Follow up on 8/9 after discharge.", "day-first");
  assert.equal(resolved.action, "date_resolved");
  assert.deepEqual(resolved.parsed, { month: 9, day: 8, year: null, locale: "day-first" });
});

test("clinical shorthand is preserved and escalated without expansion", () => {
  const result = assessClinicalShorthand("Resume qhs med per old MAR unless held.");
  assert.equal(result.action, "escalate_shorthand");
  assert.equal(result.requiresProfessionalReview, true);
  assert.equal(result.original, "Resume qhs med per old MAR unless held.");
  assert.deepEqual(result.terms, ["qhs", "MAR"]);
});

test("conflicting corrections are both retained and no value is activated", () => {
  const result = reconcileCorrections([
    { actorId: "caregiver-1", baseVersion: 3, value: "Dose is 18 units", reason: "First source" },
    { actorId: "caregiver-2", baseVersion: 3, value: "Dose is 24 units", reason: "Second source" },
  ]);
  assert.equal(result.action, "persist_conflict");
  assert.equal(result.activeValue, null);
  assert.equal(result.conflicts.length, 2);
});

test("dynamic recurring exceptions are modeled instead of flattened", () => {
  const result = modelRecurringSchedule("Daily weight except on dialysis days, which vary weekly.");
  assert.equal(result.action, "model_exception_rule");
  assert.equal(result.schedule?.frequency, "daily");
  assert.equal(result.schedule?.exceptionKind, "dynamic_source_days");
  assert.equal(result.schedule?.requiresConfirmation, true);
});
