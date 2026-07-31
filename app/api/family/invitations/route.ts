import { z } from "zod";
import { requireUser } from "@/lib/server/auth";
import { apiError } from "@/lib/server/responses";
import { requireSameOrigin } from "@/lib/server/csrf";

export const runtime = "nodejs";

const acceptanceSchema = z.object({
  invitationId: z.string().uuid(),
});

export async function GET() {
  try {
    const { supabase } = await requireUser();
    const { data, error } = await supabase.rpc("list_my_care_space_invitations");
    if (error) throw error;
    return Response.json({ invitations: data ?? [] });
  } catch (error) {
    return apiError(error, "family_invitations_list");
  }
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const input = acceptanceSchema.parse(await request.json());
    const { supabase } = await requireUser();
    const { data, error } = await supabase.rpc("accept_care_space_invitation", {
      invitation_id: input.invitationId,
    });
    if (error) throw error;
    return Response.json({ careSpaceId: data });
  } catch (error) {
    return apiError(error, "family_invitation_accept");
  }
}
