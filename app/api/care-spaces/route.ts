import { onboardingSchema } from "@/lib/app-schemas";
import { requireUser } from "@/lib/server/auth";
import { apiError } from "@/lib/server/responses";
import { requireSameOrigin } from "@/lib/server/csrf";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase
      .from("care_spaces")
      .select("id, name, mode, created_at, care_recipients(id, preferred_name, preferred_language)")
      .is("deleted_at", null)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return Response.json({ careSpaces: data });
  } catch (error) {
    return apiError(error, "care_spaces_list");
  }
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const input = onboardingSchema.parse(await request.json());
    const { supabase } = await requireUser();
    const { data, error } = await supabase.rpc("create_care_space_with_defaults", {
      space_name: input.careSpaceName,
      recipient_name: input.recipientName,
      relationship: input.relationship,
      preferred_language: input.preferredLanguage,
      notifications_enabled: input.notificationsEnabled,
      consent_acknowledged: input.consentAcknowledged,
    });
    if (error) throw error;
    return Response.json({ careSpaceId: data }, { status: 201 });
  } catch (error) {
    return apiError(error, "care_space_create");
  }
}
