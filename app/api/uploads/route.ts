import { randomUUID } from "node:crypto";
import { AIProviderUnavailableError } from "@/lib/ai/provider";
import { getAIProvider } from "@/lib/ai/nvidia";
import { PROMPT_VERSION } from "@/lib/ai/prompts";
import { getServerEnvironment } from "@/lib/config/env";
import { requireCareSpaceMember } from "@/lib/server/auth";
import {
  prepareDocumentForAnalysis,
  sanitizeFileName,
  sha256File,
  validateUpload,
} from "@/lib/server/files";
import { limitRequest, requestIdentifier } from "@/lib/server/rate-limit";
import { apiError } from "@/lib/server/responses";
import { safeInitialCommitmentState } from "@/lib/safety/lifecycle";
import { requireSameOrigin } from "@/lib/server/csrf";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: Request) {
  let analysisRunId: string | undefined;
  let sourceDocumentId: string | undefined;
  let careSpaceId: string | undefined;
  try {
    requireSameOrigin(request);
    const form = await request.formData();
    const file = form.get("file");
    careSpaceId = String(form.get("careSpaceId") ?? "");
    const synthetic = String(form.get("synthetic") ?? "") === "true";
    if (!(file instanceof File)) return Response.json({ error: "Choose a file to upload." }, { status: 400 });
    if (!careSpaceId) return Response.json({ error: "careSpaceId is required." }, { status: 400 });
    validateUpload(file);

    const env = getServerEnvironment();
    if (!env.ALLOW_REAL_PATIENT_DATA && !synthetic) {
      return Response.json({
        error: "Real patient data is disabled. Use only synthetic or properly de-identified information.",
        code: "REAL_DATA_DISABLED",
      }, { status: 403 });
    }

    const { user, supabase } = await requireCareSpaceMember(careSpaceId);
    const rate = await limitRequest("upload", requestIdentifier(request, user.id));
    if (!rate.success) {
      return Response.json({ error: "Upload limit reached. Please try again later.", code: "RATE_LIMITED" }, {
        status: 429,
        headers: { "Retry-After": String(Math.max(1, Math.ceil((rate.reset - Date.now()) / 1000))) },
      });
    }

    const hash = await sha256File(file);
    const { data: duplicate } = await supabase
      .from("source_documents")
      .select("id, original_file_name, processing_status")
      .eq("care_space_id", careSpaceId)
      .eq("file_hash", hash)
      .is("deleted_at", null)
      .maybeSingle();
    if (duplicate) {
      return Response.json({ error: "This file has already been uploaded.", duplicate }, { status: 409 });
    }

    sourceDocumentId = randomUUID();
    const safeName = sanitizeFileName(file.name);
    const storagePath = `${careSpaceId}/${sourceDocumentId}/${safeName}`;
    const { error: storageError } = await supabase.storage
      .from("care-documents")
      .upload(storagePath, file, { contentType: file.type, upsert: false });
    if (storageError) throw storageError;

    const { error: documentError } = await supabase.from("source_documents").insert({
      id: sourceDocumentId,
      care_space_id: careSpaceId,
      uploaded_by: user.id,
      storage_bucket: "care-documents",
      storage_path: storagePath,
      original_file_name: safeName,
      file_hash: hash,
      mime_type: file.type,
      byte_size: file.size,
      processing_status: "extracting",
      synthetic,
    });
    if (documentError) throw documentError;

    const prepared = await prepareDocumentForAnalysis(file);
    if (prepared.pages.length > 0) {
      const { error: pageError } = await supabase.from("document_pages").insert(
        prepared.pages.map((page) => ({
          care_space_id: careSpaceId,
          source_document_id: sourceDocumentId,
          page_number: page.pageNumber,
          extracted_text: page.text || null,
        })),
      );
      if (pageError) throw pageError;
    }

    analysisRunId = randomUUID();
    const { error: runError } = await supabase.from("analysis_runs").insert({
      id: analysisRunId,
      care_space_id: careSpaceId,
      source_document_id: sourceDocumentId,
      requested_by: user.id,
      provider: "nvidia_nim",
      model: env.NVIDIA_MODEL,
      prompt_version: PROMPT_VERSION,
      status: "running",
      input_hash: hash,
      started_at: new Date().toISOString(),
    });
    if (runError) throw runError;

    const aiRate = await limitRequest("ai", requestIdentifier(request, user.id));
    if (!aiRate.success) {
      await markWaiting(supabase, sourceDocumentId, analysisRunId, "rate_limited");
      return Response.json({
        sourceDocumentId,
        analysisRunId,
        status: "waiting_for_ai",
        message: "The file is saved. Analysis will resume after the request limit resets.",
      }, { status: 202 });
    }

    let result;
    const startedAt = Date.now();
    try {
      result = await getAIProvider().analyzeDocument({
        sourceDocumentId,
        fileName: safeName,
        mimeType: file.type,
        extractedText: prepared.text,
        images: prepared.images,
        preferredLanguage: String(form.get("preferredLanguage") ?? "English"),
      });
    } catch (error) {
      if (error instanceof AIProviderUnavailableError) {
        await markWaiting(supabase, sourceDocumentId, analysisRunId, "ai_not_configured");
        return Response.json({
          sourceDocumentId,
          analysisRunId,
          status: "waiting_for_ai",
          message: "The file is saved safely. Connect NVIDIA to analyze it.",
        }, { status: 202 });
      }
      throw error;
    }

    const { data: insertedCommitments, error: commitmentError } = await supabase
      .from("care_commitments")
      .insert(result.commitments.map((item) => ({
        care_space_id: careSpaceId,
        analysis_run_id: analysisRunId,
        title: item.title,
        plain_language_description: item.plainLanguageDescription,
        category: item.category,
        state: safeInitialCommitmentState({
          riskLevel: item.riskLevel,
          requiresHumanReview: item.requiresHumanReview,
          possibleConflict: item.possibleConflict,
          evidenceKind: item.evidenceKind,
        }),
        risk_level: item.riskLevel,
        due_at: item.dueDate ? `${item.dueDate}T12:00:00.000Z` : null,
        time_window: item.timeWindow,
        confidence: item.confidence,
        evidence_kind: item.evidenceKind,
        possible_conflict: item.possibleConflict,
        requires_human_review: item.requiresHumanReview,
        escalation_target: item.recommendedEscalationTarget,
        required_equipment: item.requiredEquipment,
        required_skill: item.requiredSkill,
        dependencies: item.dependencies,
        completion_evidence_rule: item.completionEvidence,
      })))
      .select("id");
    if (commitmentError) throw commitmentError;

    if (insertedCommitments?.length) {
      const { error: sourceError } = await supabase.from("commitment_sources").insert(
        insertedCommitments.map((commitment, index) => ({
          care_space_id: careSpaceId,
          commitment_id: commitment.id,
          source_document_id: sourceDocumentId,
          source_excerpt: result.commitments[index].sourceExcerpt,
          source_date: result.commitments[index].sourceDate,
        })),
      );
      if (sourceError) throw sourceError;
    }

    const completedAt = new Date().toISOString();
    const { error: finishRunError } = await supabase.from("analysis_runs").update({
      status: "completed",
      output_json: result,
      latency_ms: Date.now() - startedAt,
      completed_at: completedAt,
    }).eq("id", analysisRunId);
    if (finishRunError) throw finishRunError;
    const { error: finishDocumentError } = await supabase.from("source_documents").update({
      processing_status: "review_ready",
      document_type: result.documentType,
      document_date: result.documentDate,
    }).eq("id", sourceDocumentId);
    if (finishDocumentError) throw finishDocumentError;
    await supabase.from("audit_events").insert({
      care_space_id: careSpaceId,
      actor_id: user.id,
      event_type: "ai_analysis",
      object_type: "source_document",
      object_id: sourceDocumentId,
      outcome: "review_ready",
      safe_metadata: {
        provider: "nvidia_nim",
        model: env.NVIDIA_MODEL,
        commitmentCount: result.commitments.length,
        conflictCount: result.conflicts.length,
      },
    });

    return Response.json({
      sourceDocumentId,
      analysisRunId,
      status: "review_ready",
      summary: result.summary,
      commitmentCount: result.commitments.length,
      conflictCount: result.conflicts.length,
    }, { status: 201 });
  } catch (error) {
    return apiError(error, "document_upload_analysis");
  }
}

async function markWaiting(
  supabase: Awaited<ReturnType<typeof requireCareSpaceMember>>["supabase"],
  documentId: string,
  runId: string,
  reason: string,
) {
  await supabase.from("analysis_runs").update({ status: "waiting", error_code: reason }).eq("id", runId);
  await supabase.from("source_documents").update({ processing_status: "waiting_for_ai" }).eq("id", documentId);
}
