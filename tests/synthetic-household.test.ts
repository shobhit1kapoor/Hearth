import assert from "node:assert/strict";
import { test } from "node:test";
import { syntheticHousehold } from "../lib/synthetic-household";

test("launch household is realistic, explicitly synthetic, and non-identifiable", () => {
  assert.match(syntheticHousehold.marker, /synthetic/i);
  assert.equal(syntheticHousehold.recipient.preferences.synthetic_household, true);
  assert.match(syntheticHousehold.careSpaceName, /Synthetic Test/);
  assert.match(syntheticHousehold.caregiver.email, /@example\.com$/);
  assert.match(syntheticHousehold.helper.email, /@example\.com$/);
  assert.notEqual(syntheticHousehold.caregiver.displayName, syntheticHousehold.helper.displayName);
  assert.equal(
    syntheticHousehold.capacity.requiredHours - syntheticHousehold.capacity.availableHours,
    syntheticHousehold.capacity.deficitHours,
  );
});

test("helper receives task-only access with sensitive categories withheld", () => {
  assert.deepEqual(syntheticHousehold.helperPermission.allowedCategories, ["tasks", "appointments", "transportation"]);
  assert.ok(syntheticHousehold.helperPermission.withheldCategories.includes("medications"));
  assert.ok(syntheticHousehold.helperPermission.withheldCategories.includes("diagnoses"));
  assert.ok(syntheticHousehold.helperPermission.withheldCategories.includes("caregiver_private_notes"));
});
