import { getAIProvider } from "@/lib/ai/nvidia";
import { getServerEnvironment } from "@/lib/config/env";
import { translationRequestSchema } from "@/lib/app-schemas";
import { requireCareSpaceMember } from "@/lib/server/auth";
import { limitRequest, requestIdentifier } from "@/lib/server/rate-limit";
import { apiError } from "@/lib/server/responses";
import { requireSameOrigin } from "@/lib/server/csrf";

export const runtime = "nodejs";
export const maxDuration = 180;

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const input = translationRequestSchema.parse(await request.json());
    const { user, supabase } = await requireCareSpaceMember(input.careSpaceId);
    const rate = await limitRequest("translation", requestIdentifier(request, user.id));
    if (!rate.success) return Response.json({ error: "Translation limit reached. Please try again later." }, { status: 429 });
    const result = await getAIProvider().translateInstruction({
      text: input.text,
      targetLanguage: input.targetLanguage,
      protectedTerms: input.protectedTerms,
    });
    const env = getServerEnvironment();
    const { data, error } = await supabase.from("translations").insert({
      care_space_id: input.careSpaceId,
      commitment_id: input.commitmentId ?? null,
      original_text: result.originalText,
      translated_text: result.translatedText,
      source_language: input.targetLanguage === "Spanish" ? "en" : "es",
      target_language: input.targetLanguage === "Spanish" ? "es" : "en",
      provider: "nvidia_nim",
      model: env.NVIDIA_MODEL,
      confidence: result.confidence,
      verification_state: result.requiresHumanVerification ? "needs_human_review" : "machine_translated",
    }).select().single();
    if (error) throw error;
    await supabase.from("audit_events").insert({
      care_space_id: input.careSpaceId,
      actor_id: user.id,
      event_type: "translation",
      object_type: input.commitmentId ? "care_commitment" : "instruction",
      object_id: input.commitmentId ?? null,
      outcome: result.requiresHumanVerification ? "needs_human_review" : "machine_translated",
      safe_metadata: { targetLanguage: input.targetLanguage, confidence: result.confidence },
    });
    return Response.json({ translation: data, warnings: result.warnings });
  } catch (error) {
    return apiError(error, "translation");
  }
}
