export const commitmentStates = [
  "identified",
  "needs_review",
  "assigned",
  "awaiting_acceptance",
  "accepted",
  "in_progress",
  "awaiting_external_response",
  "blocked",
  "escalated",
  "completed",
  "verified",
  "cancelled",
  "superseded",
] as const;

export type PersistentCommitmentState = typeof commitmentStates[number];

const transitions: Record<PersistentCommitmentState, PersistentCommitmentState[]> = {
  identified: ["needs_review", "assigned", "cancelled", "superseded"],
  needs_review: ["assigned", "escalated", "cancelled", "superseded"],
  assigned: ["awaiting_acceptance", "accepted", "cancelled"],
  awaiting_acceptance: ["accepted", "assigned", "cancelled"],
  accepted: ["in_progress", "blocked", "cancelled"],
  in_progress: ["awaiting_external_response", "blocked", "completed", "cancelled"],
  awaiting_external_response: ["in_progress", "blocked", "completed", "escalated"],
  blocked: ["in_progress", "escalated", "cancelled"],
  escalated: ["needs_review", "in_progress", "cancelled"],
  completed: ["verified", "in_progress"],
  verified: [],
  cancelled: [],
  superseded: [],
};

export function canPersistedTransition(from: string, to: string) {
  return commitmentStates.includes(from as PersistentCommitmentState)
    && commitmentStates.includes(to as PersistentCommitmentState)
    && transitions[from as PersistentCommitmentState].includes(to as PersistentCommitmentState);
}

export function requireTransition(from: string, to: PersistentCommitmentState, evidence?: string) {
  if (!canPersistedTransition(from, to)) throw new Error(`Invalid task transition from ${from} to ${to}.`);
  if ((to === "completed" || to === "verified") && !evidence?.trim()) {
    throw new Error("Completion evidence is required.");
  }
}

export function safeInitialCommitmentState(input: {
  riskLevel: string;
  requiresHumanReview: boolean;
  possibleConflict: string | null;
  evidenceKind: string;
}): PersistentCommitmentState {
  if (
    input.requiresHumanReview
    || input.possibleConflict
    || input.evidenceKind === "ai_inference"
    || input.evidenceKind === "unresolved_conflict"
    || input.evidenceKind === "unknown"
    || input.riskLevel === "high"
    || input.riskLevel === "critical"
  ) return "needs_review";
  return "identified";
}
