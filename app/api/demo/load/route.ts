import { createHash, randomUUID } from "node:crypto";
import { commitments, sources } from "@/lib/hearth";
import { requireCareSpaceMember } from "@/lib/server/auth";
import { limitRequest, requestIdentifier } from "@/lib/server/rate-limit";
import { apiError } from "@/lib/server/responses";
import { requireSameOrigin } from "@/lib/server/csrf";

export const runtime = "nodejs";

const stateMap: Record<string, string> = {
  Identified: "identified",
  "Needs review": "needs_review",
  Assigned: "assigned",
  "Awaiting acceptance": "awaiting_acceptance",
  Accepted: "accepted",
  "In progress": "in_progress",
  "Awaiting external response": "awaiting_external_response",
  Blocked: "blocked",
  Escalated: "escalated",
  Completed: "completed",
  Verified: "verified",
  Cancelled: "cancelled",
  Superseded: "superseded",
};

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const { careSpaceId } = await request.json() as { careSpaceId?: string };
    if (!careSpaceId) return Response.json({ error: "careSpaceId is required." }, { status: 400 });
    const { user, supabase } = await requireCareSpaceMember(careSpaceId);
    const rate = await limitRequest("demo_reset", requestIdentifier(request, user.id));
    if (!rate.success) return Response.json({ error: "Please wait before loading the sample again." }, { status: 429 });
    const sampleHash = createHash("sha256").update("hearth-validated-sample-2026-07-27.1").digest("hex");
    const { data: existing } = await supabase.from("source_documents")
      .select("id").eq("care_space_id", careSpaceId).eq("file_hash", sampleHash).maybeSingle();
    if (existing) {
      return Response.json({ loaded: false, message: "The validated sample is already in this care space." });
    }

    const bundleId = randomUUID();
    const sourceText = sources.map((source) => `${source.id}: ${source.title}\n${source.date} · ${source.origin}`).join("\n\n");
    const fileName = "hearth-validated-synthetic-sample.txt";
    const storagePath = `${careSpaceId}/${bundleId}/${fileName}`;
    const { error: uploadError } = await supabase.storage.from("care-documents").upload(
      storagePath,
      new Blob([sourceText], { type: "text/plain" }),
      { contentType: "text/plain", upsert: false },
    );
    if (uploadError) throw uploadError;

    const { error: documentError } = await supabase.from("source_documents").insert({
      id: bundleId,
      care_space_id: careSpaceId,
      uploaded_by: user.id,
      storage_bucket: "care-documents",
      storage_path: storagePath,
      original_file_name: fileName,
      file_hash: sampleHash,
      mime_type: "text/plain",
      byte_size: Buffer.byteLength(sourceText),
      document_type: "validated_synthetic_bundle",
      document_date: "2026-07-27",
      processing_status: "review_ready",
      synthetic: true,
    });
    if (documentError) throw documentError;

    const runId = randomUUID();
    const { error: runError } = await supabase.from("analysis_runs").insert({
      id: runId,
      care_space_id: careSpaceId,
      source_document_id: bundleId,
      requested_by: user.id,
      provider: "validated_cache",
      model: "hearth-deterministic-compiler-v0.3",
      prompt_version: "validated-bundle-2026-07-27.1",
      status: "completed",
      input_hash: sampleHash,
      output_json: { sourceCount: sources.length, commitmentCount: commitments.length, liveAI: false },
      started_at: new Date().toISOString(),
      completed_at: new Date().toISOString(),
    });
    if (runError) throw runError;

    const { data: rows, error: commitmentError } = await supabase.from("care_commitments").insert(
      commitments.map((item) => ({
        care_space_id: careSpaceId,
        analysis_run_id: runId,
        title: item.responsibility,
        plain_language_description: item.excerpt,
        category: item.privacy.toLowerCase().replace(" ", "_"),
        state: stateMap[item.state] ?? "needs_review",
        risk_level: item.risk.toLowerCase(),
        time_window: item.dueWindow,
        confidence: item.confidence === "High" ? 0.95 : item.confidence === "Medium" ? 0.75 : 0.45,
        evidence_kind: item.confidence === "Low" ? "unknown" : "verified_source_fact",
        possible_conflict: item.verification === "Unresolved conflict" ? "The source instructions conflict and need human review." : null,
        requires_human_review: item.approvalRequired,
        escalation_target: item.escalation,
        required_equipment: item.equipment,
        required_skill: item.skill ? [item.skill] : [],
        dependencies: item.dependencies,
        completion_evidence_rule: item.completionCriteria,
      })),
    ).select("id");
    if (commitmentError) throw commitmentError;
    const { error: sourceError } = await supabase.from("commitment_sources").insert(
      (rows ?? []).map((row, index) => ({
        care_space_id: careSpaceId,
        commitment_id: row.id,
        source_document_id: bundleId,
        source_excerpt: commitments[index].excerpt,
        source_date: "2026-07-27",
      })),
    );
    if (sourceError) throw sourceError;
    await supabase.from("audit_events").insert({
      care_space_id: careSpaceId,
      actor_id: user.id,
      event_type: "synthetic_sample_loaded",
      object_type: "source_document",
      object_id: bundleId,
      outcome: "review_ready",
      safe_metadata: { sourceCount: sources.length, commitmentCount: commitments.length, liveAI: false },
    });
    return Response.json({
      loaded: true,
      sourceCount: sources.length,
      commitmentCount: commitments.length,
      liveAI: false,
      message: "Validated cached sample loaded. No live AI call was used.",
    }, { status: 201 });
  } catch (error) {
    return apiError(error, "load_validated_sample");
  }
}
