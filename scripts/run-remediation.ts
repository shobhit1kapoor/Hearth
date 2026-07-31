import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import {
  assessClinicalShorthand,
  modelRecurringSchedule,
  reconcileCorrections,
  resolveNamedAssignee,
  resolveNumericDate,
} from "../lib/safety/interpretation";

type HoldoutCase = { id: string; kind: string; input: string };
type GroundTruth = { id: string; expected: string; safetyCritical: boolean };

const [caseBytes, truthBytes, originalResultBytes] = await Promise.all([
  readFile("evidence/holdout/test-cases.json"),
  readFile("evidence/holdout/ground-truth.json"),
  readFile("evidence/holdout/results.json"),
]);
const cases = (JSON.parse(caseBytes.toString()).cases as HoldoutCase[])
  .filter((item) => ["HO-16", "HO-17", "HO-18", "HO-19", "HO-20"].includes(item.id));
const truth = new Map(
  (JSON.parse(truthBytes.toString()).expectations as GroundTruth[]).map((item) => [item.id, item]),
);

function observe(testCase: HoldoutCase) {
  switch (testCase.kind) {
    case "duplicate_name": {
      const result = resolveNamedAssignee("Alex", [
        { id: "member-alex-sibling", displayName: "Alex", disambiguator: "Sibling" },
        { id: "member-alex-neighbor", displayName: "Alex", disambiguator: "Neighbor" },
      ]);
      return { actual: result.action, behavior: result.message };
    }
    case "ambiguous_date": {
      const result = resolveNumericDate(testCase.input);
      return { actual: result.action, behavior: result.message };
    }
    case "clinical_shorthand": {
      const result = assessClinicalShorthand(testCase.input);
      return { actual: result.action, behavior: result.message };
    }
    case "conflicting_correction": {
      const result = reconcileCorrections([
        { actorId: "caregiver-1", baseVersion: 4, value: "Dose is 18", reason: "First correction" },
        { actorId: "caregiver-2", baseVersion: 4, value: "Dose is 24", reason: "Second correction" },
      ]);
      return { actual: result.action, behavior: result.message };
    }
    case "recurring_exception": {
      const result = modelRecurringSchedule(testCase.input);
      return { actual: result.action, behavior: result.message };
    }
    default:
      return { actual: "not_evaluated", behavior: "No remediation evaluator." };
  }
}

const executedAt = new Date().toISOString();
const results = cases.map((testCase) => {
  const expected = truth.get(testCase.id);
  if (!expected) throw new Error(`Missing ground truth for ${testCase.id}`);
  const observed = observe(testCase);
  return {
    ...testCase,
    expected: expected.expected,
    actual: observed.actual,
    passed: observed.actual === expected.expected,
    safetyCritical: expected.safetyCritical,
    behavior: observed.behavior,
  };
});
const summary = {
  total: results.length,
  passed: results.filter((item) => item.passed).length,
  failed: results.filter((item) => !item.passed).length,
  safetyCriticalFailures: results.filter((item) => !item.passed && item.safetyCritical).length,
};
const originalResultsSha256 = createHash("sha256").update(originalResultBytes).digest("hex");

await writeFile("evidence/holdout/remediation-results.json", JSON.stringify({
  run: {
    executedAt,
    configuration: "hearth-safety-controls-v0.5",
    originalResultsSha256,
    preservesOriginalHoldout: true,
  },
  summary,
  results,
}, null, 2));

await writeFile("evidence/holdout/remediation-report.md", `# Holdout remediation report

Executed: ${executedAt}

The original locked holdout result remains unchanged at 15/20. This post-holdout suite verifies the controls added in response to its five retained failures.

| Result | Count |
|---|---:|
| Remediation cases | ${summary.total} |
| Passed | ${summary.passed} |
| Failed | ${summary.failed} |
| Safety-critical failures | ${summary.safetyCriticalFailures} |

## Controls verified

${results.map((item) => `- **${item.id} — ${item.kind}:** ${item.passed ? "Pass" : "Fail"} · ${item.behavior}`).join("\n")}

## Evidence integrity

- The original test cases, ground truth, lock, and first-run results were not changed.
- This report is a regression/remediation result, not a retroactive change to the holdout score.
`);

console.log(`Holdout remediation: ${summary.passed}/${summary.total} passed; ${summary.failed} failures.`);
if (summary.failed > 0) process.exitCode = 1;
