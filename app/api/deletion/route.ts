import { z } from "zod";
import { requireCareSpaceMember } from "@/lib/server/auth";
import { limitRequest, requestIdentifier } from "@/lib/server/rate-limit";
import { apiError } from "@/lib/server/responses";
import { createSupabaseAdminClient } from "@/lib/supabase/server";
import { requireSameOrigin } from "@/lib/server/csrf";

export const runtime = "nodejs";

const deletionSchema = z.object({
  careSpaceId: z.string().uuid(),
  confirmation: z.literal("DELETE"),
});

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const input = deletionSchema.parse(await request.json());
    const { user, supabase, membership } = await requireCareSpaceMember(input.careSpaceId);
    if (!["primary_caregiver", "care_recipient", "administrator"].includes(membership.role)) {
      return Response.json({ error: "Only a care-space owner can request deletion." }, { status: 403 });
    }
    const rate = await limitRequest("deletion", requestIdentifier(request, user.id));
    if (!rate.success) return Response.json({ error: "Please wait before making another deletion request." }, { status: 429 });
    const requestId = crypto.randomUUID();
    const now = new Date().toISOString();
    await supabase.from("deletion_requests").insert({
      id: requestId,
      care_space_id: input.careSpaceId,
      requested_by: user.id,
      status: "processing",
      identity_confirmed_at: now,
      affected_records: { files: true, activeCareData: true, memberships: true },
    });
    await supabase.from("audit_events").insert({
      care_space_id: input.careSpaceId,
      actor_id: user.id,
      event_type: "deletion_requested",
      outcome: "identity_confirmed",
      safe_metadata: { requestId },
    });

    const admin = createSupabaseAdminClient();
    if (!admin) {
      await supabase.from("deletion_requests").update({
        status: "failed",
        failure_reason: "server_admin_not_configured",
      }).eq("id", requestId);
      return Response.json({
        requestId,
        status: "failed",
        error: "Deletion needs the server administrator connection. No records were removed.",
      }, { status: 503 });
    }

    const { data: documents, error: documentReadError } = await admin.from("source_documents")
      .select("storage_bucket, storage_path").eq("care_space_id", input.careSpaceId).is("deleted_at", null);
    if (documentReadError) throw documentReadError;
    for (const bucket of ["care-documents", "caregiver-notes", "generated-exports"]) {
      const paths = documents?.filter((item) => item.storage_bucket === bucket).map((item) => item.storage_path) ?? [];
      if (paths.length > 0) {
        const { error } = await admin.storage.from(bucket).remove(paths);
        if (error) throw error;
      }
    }

    await admin.from("source_documents").update({ deleted_at: now, processing_status: "deleted" }).eq("care_space_id", input.careSpaceId);
    await admin.from("care_commitments").update({ deleted_at: now }).eq("care_space_id", input.careSpaceId);
    await admin.from("care_recipients").update({ deleted_at: now }).eq("care_space_id", input.careSpaceId);
    await admin.from("care_space_members").update({ status: "revoked", revoked_at: now }).eq("care_space_id", input.careSpaceId);
    await admin.from("care_spaces").update({ deleted_at: now }).eq("id", input.careSpaceId);
    await admin.from("deletion_requests").update({
      status: "completed",
      completed_at: now,
      preserved_audit_summary: { requestId, completedAt: now, rawCareContentPreserved: false },
    }).eq("id", requestId);
    return Response.json({ requestId, status: "completed" });
  } catch (error) {
    return apiError(error, "care_space_deletion");
  }
}
