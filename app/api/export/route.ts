import { requireCareSpaceMember } from "@/lib/server/auth";
import { limitRequest, requestIdentifier } from "@/lib/server/rate-limit";
import { apiError } from "@/lib/server/responses";
import { requireSameOrigin } from "@/lib/server/csrf";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const { careSpaceId } = await request.json() as { careSpaceId?: string };
    if (!careSpaceId) return Response.json({ error: "careSpaceId is required." }, { status: 400 });
    const { user, supabase } = await requireCareSpaceMember(careSpaceId);
    const rate = await limitRequest("export", requestIdentifier(request, user.id));
    if (!rate.success) return Response.json({ error: "Export limit reached. Please try again later." }, { status: 429 });
    const requestId = crypto.randomUUID();
    await supabase.from("export_requests").insert({
      id: requestId,
      care_space_id: careSpaceId,
      requested_by: user.id,
      status: "processing",
      format: "json",
    });
    const tables = [
      "care_spaces",
      "care_recipients",
      "care_space_members",
      "care_commitments",
      "commitment_sources",
      "commitment_events",
      "permissions",
      "permission_events",
      "notification_preferences",
      "quiet_hours",
      "translations",
      "capacity_snapshots",
      "accountability_receipts",
      "audit_events",
    ] as const;
    const exported: Record<string, unknown> = {};
    for (const table of tables) {
      const { data, error } = await supabase.from(table).select("*").eq("care_space_id", careSpaceId);
      if (error) throw error;
      exported[table] = data;
    }
    const payload = {
      exportedAt: new Date().toISOString(),
      careSpaceId,
      formatVersion: "hearth-export-1",
      data: exported,
    };
    await supabase.from("export_requests").update({
      status: "completed",
      completed_at: new Date().toISOString(),
    }).eq("id", requestId);
    await supabase.from("audit_events").insert({
      care_space_id: careSpaceId,
      actor_id: user.id,
      event_type: "export",
      outcome: "completed",
      safe_metadata: { format: "json", requestId },
    });
    return new Response(JSON.stringify(payload, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="hearth-care-space-${careSpaceId}.json"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return apiError(error, "care_space_export");
  }
}
