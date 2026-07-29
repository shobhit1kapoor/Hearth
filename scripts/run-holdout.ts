import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import {
  auditChain,
  authorizeAccess,
  canTransition,
  commitments,
  correctionHistory,
  detectPromptInjection,
  redactLog,
  safeOutageState,
  safeProtocolResponse,
  transitionCommitment,
} from "../lib/hearth";

type Case = { id: string; kind: string; input: string };
type Truth = { id: string; expected: string; safetyCritical: boolean };

const casesPath = "evidence/holdout/test-cases.json";
const truthPath = "evidence/holdout/ground-truth.json";
const lockPath = "evidence/holdout/lock.json";
const [caseBytes, truthBytes, lockBytes] = await Promise.all([
  readFile(casesPath),
  readFile(truthPath),
  readFile(lockPath),
]);
const lock = JSON.parse(lockBytes.toString()) as {
  casesSha256: string;
  groundTruthSha256: string;
  lockedAt: string;
  executionCount: number;
};
const sha = (value: Buffer) => createHash("sha256").update(value).digest("hex");
if (sha(caseBytes) !== lock.casesSha256 || sha(truthBytes) !== lock.groundTruthSha256) {
  throw new Error("Holdout lock mismatch; refusing to execute changed cases or expectations.");
}
if (lock.executionCount !== 0) {
  const existing = JSON.parse(await readFile("evidence/holdout/results.json", "utf8"));
  console.log(`Holdout already executed once: ${existing.summary.passed}/${existing.summary.total} passed; retained without rerun.`);
  process.exit(0);
}

const testCases = (JSON.parse(caseBytes.toString()).cases as Case[]);
const truth = new Map((JSON.parse(truthBytes.toString()).expectations as Truth[]).map((item) => [item.id, item]));

function observe(testCase: Case): { actual: string; behavior: string } {
  const baseAccess = {
    actor: "Helper",
    householdId: "HH-01",
    objectHouseholdId: "HH-01",
    purpose: "transport",
    categories: ["Date", "Time", "Location", "Medication list"],
  };
  switch (testCase.kind) {
    case "unknown_protocol": return { actual: safeProtocolResponse(testCase.input).action, behavior: safeProtocolResponse(testCase.input).response };
    case "prompt_injection": return { actual: detectPromptInjection(testCase.input).quarantined ? "quarantine" : "continue", behavior: detectPromptInjection(testCase.input).action };
    case "minimum_disclosure": {
      const result = authorizeAccess(baseAccess);
      return { actual: result.disclosed.includes("Medication list") ? "over_disclose" : "logistics_only", behavior: result.disclosed.join(", ") };
    }
    case "cross_household": {
      const result = authorizeAccess({ ...baseAccess, objectHouseholdId: "HH-02" });
      return { actual: result.allowed ? "allow" : "deny", behavior: result.reason };
    }
    case "expired_grant": {
      const result = authorizeAccess({ ...baseAccess, expiresAt: "2026-07-28T12:00:00Z" });
      return { actual: result.allowed ? "allow" : "deny", behavior: result.reason };
    }
    case "revoked_grant": {
      const result = authorizeAccess({ ...baseAccess, revoked: true });
      return { actual: result.allowed ? "allow" : "deny", behavior: result.reason };
    }
    case "completion_without_evidence": {
      const item = { ...commitments[1], state: "In progress" as const };
      const result = transitionCommitment(item, "Completed");
      return { actual: result.allowed ? "complete" : "remain_open", behavior: result.reason };
    }
    case "valid_transition": return { actual: canTransition("Awaiting acceptance", "Accepted") ? "allow_transition" : "deny_transition", behavior: "Lifecycle graph checked." };
    case "invalid_transition": return { actual: canTransition("Identified", "Verified") ? "allow_transition" : "deny_transition", behavior: "Lifecycle graph checked." };
    case "model_outage": return { actual: safeOutageState("model").state === "Blocked" ? "block_new_interpretation" : "continue", behavior: safeOutageState("model").behavior };
    case "provider_outage": return { actual: safeOutageState("provider").state === "Awaiting external response" ? "await_response" : "close", behavior: safeOutageState("provider").behavior };
    case "superseded_source": return { actual: commitments.find((item) => item.id === "CCO-026")?.state === "Superseded" ? "retain_superseded" : "activate", behavior: "Older source remains retained and non-activating." };
    case "log_redaction": return { actual: redactLog(testCase.input).includes("[email redacted]") ? "redact" : "expose", behavior: redactLog(testCase.input) };
    case "audit_integrity": {
      const full = auditChain([{ actor: "Maya", action: "Review" }, { actor: "HEARTH", action: "Prepare" }]);
      const changed = auditChain([{ actor: "HEARTH", action: "Prepare" }]);
      return { actual: full[1].hash !== changed[0].hash ? "detect_change" : "miss_change", behavior: `${full[1].hash} != ${changed[0].hash}` };
    }
    case "correction_history": return { actual: correctionHistory("blue pill", "unidentified medication", "Insufficient evidence").originalPreserved ? "preserve_original" : "overwrite", behavior: "Original and correction retained." };
    case "duplicate_name": return { actual: "assign_first_match", behavior: "Known limitation: identity disambiguation is not implemented." };
    case "ambiguous_date": return { actual: "parse_us_locale", behavior: "Known limitation: locale confirmation is not implemented." };
    case "clinical_shorthand": return { actual: "needs_review", behavior: "Known limitation: shorthand-specific escalation taxonomy is not implemented." };
    case "conflicting_correction": return { actual: "last_write_wins", behavior: "Known limitation: concurrent correction conflict persistence is not implemented." };
    case "recurring_exception": return { actual: "daily_schedule", behavior: "Known limitation: variable recurring exceptions are not modeled." };
    default: return { actual: "unknown", behavior: "No evaluator." };
  }
}

const runAt = new Date().toISOString();
const results = testCases.map((testCase) => {
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
    correction: observed.actual === expected.expected ? "None" : "Failure retained; Phase 2 mitigation specified in the report.",
  };
});
const summary = {
  total: results.length,
  passed: results.filter((item) => item.passed).length,
  failed: results.filter((item) => !item.passed).length,
  safetyCriticalFailures: results.filter((item) => !item.passed && item.safetyCritical).length,
};
await writeFile("evidence/holdout/results.json", JSON.stringify({
  run: {
    executedAt: runAt,
    consecutive: true,
    selectedReruns: false,
    configuration: "hearth-deterministic-compiler-v0.4",
    casesSha256: lock.casesSha256,
    groundTruthSha256: lock.groundTruthSha256,
  },
  summary,
  results,
}, null, 2));
await writeFile(lockPath, JSON.stringify({ ...lock, executionCount: 1, executedAt: runAt }, null, 2));
console.log(`Holdout: ${summary.passed}/${summary.total} passed; ${summary.failed} failures retained; ${summary.safetyCriticalFailures} safety-critical failures.`);
