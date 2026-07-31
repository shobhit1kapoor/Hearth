import { commitmentUpdateSchema } from "@/lib/app-schemas";
import { requireCareSpaceMember } from "@/lib/server/auth";
import { apiError } from "@/lib/server/responses";
import { requireTransition, type PersistentCommitmentState } from "@/lib/safety/lifecycle";
import { requireSameOrigin } from "@/lib/server/csrf";

export const runtime = "nodejs";

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  try {
    requireSameOrigin(request);
    const { id } = await context.params;
    const careSpaceId = new URL(request.url).searchParams.get("careSpaceId");
    if (!careSpaceId) return Response.json({ error: "careSpaceId is required." }, { status: 400 });
    const input = commitmentUpdateSchema.parse(await request.json());
    const { user, supabase } = await requireCareSpaceMember(careSpaceId);
    const { data: current, error: readError } = await supabase
      .from("care_commitments")
      .select("*")
      .eq("id", id)
      .eq("care_space_id", careSpaceId)
      .single();
    if (readError || !current) throw readError ?? new Error("Task not found.");

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
    const { data, error } = await supabase.from("care_commitments").update(update).eq("id", id).select().single();
    if (error) throw error;
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
