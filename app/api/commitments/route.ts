import { requireCareSpaceMember } from "@/lib/server/auth";
import { apiError } from "@/lib/server/responses";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const careSpaceId = new URL(request.url).searchParams.get("careSpaceId");
    if (!careSpaceId) return Response.json({ error: "careSpaceId is required." }, { status: 400 });
    const { supabase } = await requireCareSpaceMember(careSpaceId);
    const { data, error } = await supabase
      .from("care_commitments")
      .select(`
        id, title, plain_language_description, category, state, risk_level, due_at, time_window,
        confidence, evidence_kind, possible_conflict, requires_human_review, escalation_target,
        completion_evidence_rule, version, owner_member_id,
        commitment_sources(id, source_excerpt, source_date, source_documents(id, original_file_name))
      `)
      .eq("care_space_id", careSpaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return Response.json({ commitments: data });
  } catch (error) {
    return apiError(error, "commitments_list");
  }
}
