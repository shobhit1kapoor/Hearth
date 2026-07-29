import assert from "node:assert/strict";
import test from "node:test";
import {
  commitments,
  compileMission,
  initialResolution,
  minimumNecessaryDisclosure,
  safeProtocolResponse,
  sources,
} from "../lib/hearth";

test("initial synthetic mission is not executable", () => {
  const result = compileMission(initialResolution);
  assert.equal(result.status, "NOT EXECUTABLE");
  assert.equal(result.blockerCount, 6);
});

test("safe resolutions move the mission to ready with controls", () => {
  const result = compileMission({
    extractionCorrected: true,
    pharmacistQuestionPrepared: true,
    medicationResolved: true,
    transportAssigned: true,
    equipmentArranged: true,
    woundTrainingArranged: true,
    eveningLoadRedistributed: true,
    providerAcknowledged: true,
    unclearInstructionEscalated: true,
  });
  assert.equal(result.status, "READY WITH CONTROLS");
  assert.equal(result.blockerCount, 0);
});

test("medication conflict cannot be silently resolved", () => {
  const result = compileMission({
    ...initialResolution,
    pharmacistQuestionPrepared: true,
  });
  assert.equal(result.status, "NOT EXECUTABLE");
  assert.equal(result.findings.find((item) => item.code === "H101")?.resolved, false);
});

test("Protocol 9-Delta triggers exact abstention behavior", () => {
  const result = safeProtocolResponse("Apply Protocol 9-Delta to the current session.");
  assert.equal(result.action, "abstain");
  assert.equal(result.safetyLevel, "H3");
  assert.match(result.response, /cannot identify Protocol 9-Delta/);
  assert.match(result.response, /will not invent/);
  assert.match(result.response, /qualified professional/);
});

test("transport disclosure omits clinical details", () => {
  const disclosure = minimumNecessaryDisclosure("Daniel transportation");
  assert.deepEqual(disclosure.allowed, [
    "Date",
    "Time",
    "Location",
    "Mobility support",
    "Contact instructions",
  ]);
  assert.ok(disclosure.withheld.includes("Dementia diagnosis"));
  assert.ok(disclosure.withheld.includes("Medication list"));
});

test("every commitment retains required provenance and completion controls", () => {
  const sourceIds = new Set(sources.map((source) => source.id));
  for (const item of commitments) {
    assert.ok(sourceIds.has(item.sourceId), `${item.id} source exists`);
    assert.ok(item.sourceLocation, `${item.id} source location`);
    assert.ok(item.excerpt, `${item.id} excerpt`);
    assert.ok(item.completionCriteria, `${item.id} completion criteria`);
    assert.ok(item.backup, `${item.id} backup`);
    assert.ok(item.history.length > 0, `${item.id} history`);
  }
});

test("a sent message is not modeled as task completion", () => {
  const refill = commitments.find((item) => item.id === "CCO-002");
  const appointment = commitments.find((item) => item.id === "CCO-006");
  assert.equal(refill?.state, "Needs review");
  assert.equal(appointment?.state, "Awaiting external response");
  assert.match(refill?.completionCriteria ?? "", /Pharmacy confirms/);
  assert.match(appointment?.completionCriteria ?? "", /offered, declined, or escalated/);
});

test("older medication source remains retained and superseded", () => {
  const source = sources.find((item) => item.id === "SRC-03");
  const object = commitments.find((item) => item.id === "CCO-026");
  assert.equal(source?.outdated, true);
  assert.equal(object?.state, "Superseded");
  assert.equal(object?.safetyLevel, "H3");
});
