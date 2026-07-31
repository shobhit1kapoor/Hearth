import { requireCareSpaceMember } from "@/lib/server/auth";
import { apiError } from "@/lib/server/responses";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const careSpaceId = new URL(request.url).searchParams.get("careSpaceId");
    if (!careSpaceId) return Response.json({ error: "careSpaceId is required." }, { status: 400 });
    const { supabase } = await requireCareSpaceMember(careSpaceId);
    const { data, error } = await supabase.from("source_documents")
      .select("id, original_file_name, mime_type, byte_size, document_type, document_date, processing_status, synthetic, created_at")
      .eq("care_space_id", careSpaceId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return Response.json({ documents: data });
  } catch (error) {
    return apiError(error, "documents_list");
  }
}
