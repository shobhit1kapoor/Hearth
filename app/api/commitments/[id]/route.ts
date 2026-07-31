import { commitmentUpdateSchema } from "@/lib/app-schemas";
import { requireCareSpaceMember } from "@/lib/server/auth";
import { apiError } from "@/lib/server/responses";
import { requireTransition, type PersistentCommitmentState } from "@/lib/safety/lifecycle";
import { reconcileCorrections } from "@/lib/safety/interpretation";
import { requireSameOrigin } from "@/lib/server/csrf";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    const { id } = await context.params;
    const careSpaceId = new URL(request.url).searchParams.get("careSpaceId");
    if (!careSpaceId) return Response.json({ error: "careSpaceId is required." }, { status: 400 });
    const input = commitmentUpdateSchema.parse(await request.json());
    const { user, supabase, membership } = await requireCareSpaceMember(careSpaceId);
    const { data: current, error: readError } = await supabase
      .from("care_commitments")
      .select("*")
      .eq("id", id)
      .eq("care_space_id", careSpaceId)
      .single();
    if (readError || !current) throw readError ?? new Error("Task not found.");

    const isManager = ["primary_caregiver", "care_recipient", "administrator"].includes(membership.role);
    const isAssignedOwner = current.owner_member_id === membership.id;
    if (["correct", "reject", "confirm", "assign", "verify"].includes(input.action) && !isManager) {
      return Response.json({ error: "Only the care-space owner can make this change." }, { status: 403 });
    }
    if (input.action === "accept" && !isAssignedOwner) {
      return Response.json({ error: "Only the assigned helper can accept this task." }, { status: 403 });
    }
    if (["start", "complete"].includes(input.action) && !isManager && !isAssignedOwner) {
      return Response.json({ error: "This task is assigned to someone else." }, { status: 403 });
    }

    if (input.action === "correct" && current.version !== input.baseVersion) {
      return recordCorrectionConflict({
        supabase,
        careSpaceId,
        commitmentId: id,
        userId: user.id,
        current,
        proposal: input,
      });
    }

    const update: Record<string, unknown> = { version: current.version + 1 };
    let nextState = current.state as PersistentCommitmentState;
    let reason: string = input.action;
    let evidence: string | undefined;

    if (input.action === "correct") {
      update.title = input.title;
      update.plain_language_description = input.description;
      update.approved_by = user.id;
      update.approved_at = new Date().toISOString();
      reason = input.reason;
    } else if (input.action === "reject") {
      nextState = "cancelled";
      requireTransition(current.state, nextState);
      reason = input.reason;
    } else if (input.action === "confirm") {
      nextState = current.requires_human_review && ["high", "critical"].includes(current.risk_level)
        ? "escalated"
        : "assigned";
      requireTransition(current.state, nextState);
      update.approved_by = user.id;
      update.approved_at = new Date().toISOString();
      evidence = input.completionEvidence;
    } else if (input.action === "assign") {
      const { data: assignedMember, error: assignedMemberError } = await supabase
        .from("care_space_members")
        .select("id")
        .eq("id", input.memberId)
        .eq("care_space_id", careSpaceId)
        .in("status", ["invited", "active"])
        .is("revoked_at", null)
        .maybeSingle();
      if (assignedMemberError) throw assignedMemberError;
      if (!assignedMember) {
        return Response.json({ error: "Choose an available helper from this care space." }, { status: 400 });
      }
      nextState = "awaiting_acceptance";
      requireTransition(current.state, nextState);
      update.owner_member_id = input.memberId;
    } else if (input.action === "accept") {
      nextState = "accepted";
      requireTransition(current.state, nextState);
    } else if (input.action === "start") {
      nextState = "in_progress";
      requireTransition(current.state, nextState);
    } else if (input.action === "complete") {
      nextState = "completed";
      evidence = input.completionEvidence;
      requireTransition(current.state, nextState, evidence);
      update.completion_evidence = { note: evidence, recordedAt: new Date().toISOString(), recordedBy: user.id };
    } else if (input.action === "verify") {
      nextState = "verified";
      evidence = input.completionEvidence;
      requireTransition(current.state, nextState, evidence);
      update.completion_evidence = { note: evidence, verifiedAt: new Date().toISOString(), verifiedBy: user.id };
    }

    update.state = nextState;
    let updateQuery = supabase.from("care_commitments").update(update).eq("id", id);
    if (input.action === "correct") updateQuery = updateQuery.eq("version", input.baseVersion);
    const { data, error } = await updateQuery.select().maybeSingle();
    if (error) throw error;
    if (!data && input.action === "correct") {
      const { data: latest, error: latestError } = await supabase
        .from("care_commitments")
        .select("*")
        .eq("id", id)
        .eq("care_space_id", careSpaceId)
        .single();
      if (latestError || !latest) throw latestError ?? new Error("Task not found.");
      return recordCorrectionConflict({
        supabase,
        careSpaceId,
        commitmentId: id,
        userId: user.id,
        current: latest,
        proposal: input,
      });
    }
    const { error: eventError } = await supabase.from("commitment_events").insert({
      care_space_id: careSpaceId,
      commitment_id: id,
      actor_id: user.id,
      from_state: current.state,
      to_state: nextState,
      reason,
      evidence: evidence ? { note: evidence } : null,
    });
    if (eventError) throw eventError;
    return Response.json({ commitment: data });
  } catch (error) {
    return apiError(error, "commitment_update");
  }
}

async function recordCorrectionConflict(input: {
  supabase: Awaited<ReturnType<typeof requireCareSpaceMember>>["supabase"];
  careSpaceId: string;
  commitmentId: string;
  userId: string;
  current: Record<string, unknown>;
  proposal: {
    baseVersion: number;
    title: string;
    description: string;
    reason: string;
  };
}) {
  const existingValue = {
    title: String(input.current.title ?? ""),
    description: String(input.current.plain_language_description ?? ""),
  };
  const proposedValue = {
    title: input.proposal.title,
    description: input.proposal.description,
  };
  const resolution = reconcileCorrections([
    {
      actorId: String(input.current.approved_by ?? "existing-version"),
      baseVersion: input.proposal.baseVersion,
      value: JSON.stringify(existingValue),
      reason: "Current saved version",
    },
    {
      actorId: input.userId,
      baseVersion: input.proposal.baseVersion,
      value: JSON.stringify(proposedValue),
      reason: input.proposal.reason,
    },
  ]);
  const observedVersion = Number(input.current.version ?? input.proposal.baseVersion + 1);
  const { data: conflict, error: conflictError } = await input.supabase
    .from("commitment_correction_conflicts")
    .insert({
      care_space_id: input.careSpaceId,
      commitment_id: input.commitmentId,
      proposed_by: input.userId,
      base_version: input.proposal.baseVersion,
      observed_version: observedVersion,
      existing_value: existingValue,
      proposed_value: proposedValue,
      reason: input.proposal.reason,
      status: "unresolved",
    })
    .select("id")
    .single();
  if (conflictError || !conflict) throw conflictError ?? new Error("The correction conflict could not be saved.");

  const ended = ["cancelled", "superseded"].includes(String(input.current.state));
  const nextState = ended ? String(input.current.state) : "blocked";
  const { data: blockedCommitment, error: blockError } = await input.supabase
    .from("care_commitments")
    .update({
      state: nextState,
      version: observedVersion + 1,
      requires_human_review: true,
      possible_conflict: resolution.message,
    })
    .eq("id", input.commitmentId)
    .eq("care_space_id", input.careSpaceId)
    .eq("version", observedVersion)
    .select("id")
    .maybeSingle();
  if (blockError || !blockedCommitment) {
    throw blockError ?? new Error("The task changed again. The conflicting correction was saved; reload before continuing.");
  }
  const { error: eventError } = await input.supabase.from("commitment_events").insert({
    care_space_id: input.careSpaceId,
    commitment_id: input.commitmentId,
    actor_id: input.userId,
    from_state: input.current.state,
    to_state: nextState,
    reason: "Conflicting correction preserved for review",
    evidence: {
      baseVersion: input.proposal.baseVersion,
      observedVersion,
      conflictId: conflict.id,
    },
  });
  if (eventError) throw eventError;

  return Response.json({
    error: "Someone changed this task while you were reviewing it. Both versions were saved. Review the conflict before continuing.",
    code: "CORRECTION_CONFLICT",
  }, { status: 409 });
}
