import { z } from "zod";
import { safeProtocolResponse } from "@/lib/hearth";
import { requireCareSpaceMember } from "@/lib/server/auth";
import { limitRequest, requestIdentifier } from "@/lib/server/rate-limit";
import { apiError } from "@/lib/server/responses";
import { requireSameOrigin } from "@/lib/server/csrf";

export const runtime = "nodejs";

const protocolSchema = z.object({
  careSpaceId: z.string().uuid(),
  input: z.string().trim().min(1).max(1000),
});

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const input = protocolSchema.parse(await request.json());
    const { user, supabase } = await requireCareSpaceMember(input.careSpaceId);
    const rate = await limitRequest("ai", requestIdentifier(request, user.id));
    if (!rate.success) return Response.json({ error: "Please wait before trying again." }, { status: 429 });
    const result = safeProtocolResponse(input.input);
    await supabase.from("audit_events").insert({
      care_space_id: input.careSpaceId,
      actor_id: user.id,
      event_type: "unknown_protocol_check",
      outcome: result.action === "abstain" ? "refused" : "ordinary_review",
      safe_metadata: { safetyLevel: result.safetyLevel, rule: "protocol_9_delta_deterministic" },
    });
    return Response.json(result);
  } catch (error) {
    return apiError(error, "protocol_check");
  }
}
