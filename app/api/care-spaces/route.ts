import { onboardingSchema } from "@/lib/app-schemas";
import { requireUser } from "@/lib/server/auth";
import { apiError } from "@/lib/server/responses";
import { requireSameOrigin } from "@/lib/server/csrf";

export const runtime = "nodejs";

export async function GET() {
  try {
    const { user, supabase } = await requireUser();
    const { data, error } = await supabase
      .from("care_spaces")
      .select("id, name, mode, created_at, care_recipients(id, preferred_name, preferred_language)")
      .is("deleted_at", null)
      .order("created_at", { ascending: true });
    if (error) throw error;
    const ids = (data ?? []).map((space) => space.id);
    const { data: memberships, error: membershipError } = ids.length === 0
      ? { data: [], error: null }
      : await supabase.from("care_space_members")
        .select("id, care_space_id, role")
        .eq("user_id", user.id)
        .eq("status", "active")
        .in("care_space_id", ids);
    if (membershipError) throw membershipError;
    const bySpace = new Map((memberships ?? []).map((member) => [member.care_space_id, member]));
    return Response.json({
      careSpaces: (data ?? []).map((space) => ({ ...space, membership: bySpace.get(space.id) ?? null })),
    });
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
