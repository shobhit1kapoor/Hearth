import { notificationPreferencesSchema } from "@/lib/app-schemas";
import { requireCareSpaceMember } from "@/lib/server/auth";
import { apiError } from "@/lib/server/responses";
import { requireSameOrigin } from "@/lib/server/csrf";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const careSpaceId = new URL(request.url).searchParams.get("careSpaceId");
    if (!careSpaceId) return Response.json({ error: "careSpaceId is required." }, { status: 400 });
    const { user, supabase } = await requireCareSpaceMember(careSpaceId);
    const [preferences, quietHours] = await Promise.all([
      supabase.from("notification_preferences").select("*").eq("care_space_id", careSpaceId).eq("user_id", user.id).single(),
      supabase.from("quiet_hours").select("*").eq("care_space_id", careSpaceId).eq("user_id", user.id).single(),
    ]);
    if (preferences.error) throw preferences.error;
    if (quietHours.error) throw quietHours.error;
    return Response.json({ preferences: preferences.data, quietHours: quietHours.data });
  } catch (error) {
    return apiError(error, "notification_settings_get");
  }
}

export async function PUT(request: Request) {
  try {
    requireSameOrigin(request);
    const careSpaceId = new URL(request.url).searchParams.get("careSpaceId");
    if (!careSpaceId) return Response.json({ error: "careSpaceId is required." }, { status: 400 });
    const input = notificationPreferencesSchema.parse(await request.json());
    const { user, supabase } = await requireCareSpaceMember(careSpaceId);
    const [preferences, quietHours] = await Promise.all([
      supabase.from("notification_preferences").upsert({
        care_space_id: careSpaceId,
        user_id: user.id,
        master_enabled: input.masterEnabled,
        email_enabled: input.emailEnabled,
        in_app_enabled: input.inAppEnabled,
        daily_summary: input.dailySummary,
        category_settings: input.categories,
      }, { onConflict: "care_space_id,user_id" }),
      supabase.from("quiet_hours").upsert({
        care_space_id: careSpaceId,
        user_id: user.id,
        enabled: input.quietHours.enabled,
        start_time: input.quietHours.start,
        end_time: input.quietHours.end,
        days: input.quietHours.days,
        timezone: input.quietHours.timezone,
      }, { onConflict: "care_space_id,user_id" }),
    ]);
    if (preferences.error) throw preferences.error;
    if (quietHours.error) throw quietHours.error;
    await supabase.from("audit_events").insert({
      care_space_id: careSpaceId,
      actor_id: user.id,
      event_type: "notification_preferences_changed",
      outcome: "saved",
      safe_metadata: {
        masterEnabled: input.masterEnabled,
        emailEnabled: input.emailEnabled,
        inAppEnabled: input.inAppEnabled,
        quietHoursEnabled: input.quietHours.enabled,
      },
    });
    return Response.json({ saved: true });
  } catch (error) {
    return apiError(error, "notification_settings_update");
  }
}
