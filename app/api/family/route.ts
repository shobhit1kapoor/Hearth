import { z } from "zod";
import { getServerEnvironment } from "@/lib/config/env";
import { requireCareSpaceMember } from "@/lib/server/auth";
import { sendHearthEmail } from "@/lib/server/email";
import { limitRequest, requestIdentifier } from "@/lib/server/rate-limit";
import { apiError } from "@/lib/server/responses";
import { requireSameOrigin } from "@/lib/server/csrf";

export const runtime = "nodejs";

const inviteSchema = z.object({
  careSpaceId: z.string().uuid(),
  email: z.string().email(),
  purpose: z.string().trim().min(1).max(160),
  canView: z.boolean(),
  canEdit: z.boolean(),
  canReceiveAlerts: z.boolean(),
  canAccessDocuments: z.boolean(),
  canContactProfessionals: z.boolean(),
  allowedCategories: z.array(z.enum(["tasks", "documents", "care_recipient", "appointments", "transportation"])).max(10),
  expiresAt: z.string().datetime().nullable(),
});

const permissionUpdateSchema = z.object({
  careSpaceId: z.string().uuid(),
  permissionId: z.string().uuid(),
  canView: z.boolean().optional(),
  canEdit: z.boolean().optional(),
  canReceiveAlerts: z.boolean().optional(),
  canAccessDocuments: z.boolean().optional(),
  canContactProfessionals: z.boolean().optional(),
  revoke: z.boolean().optional(),
});

export async function GET(request: Request) {
  try {
    const careSpaceId = new URL(request.url).searchParams.get("careSpaceId");
    if (!careSpaceId) return Response.json({ error: "careSpaceId is required." }, { status: 400 });
    const { supabase } = await requireCareSpaceMember(careSpaceId);
    const { data, error } = await supabase
      .from("care_space_members")
      .select("id, user_id, invited_email, role, status, expires_at, permissions(*)")
      .eq("care_space_id", careSpaceId)
      .order("created_at");
    if (error) throw error;
    return Response.json({ members: data });
  } catch (error) {
    return apiError(error, "family_list");
  }
}

export async function POST(request: Request) {
  try {
    requireSameOrigin(request);
    const input = inviteSchema.parse(await request.json());
    const { user, supabase, membership } = await requireCareSpaceMember(input.careSpaceId);
    if (!["primary_caregiver", "care_recipient", "administrator"].includes(membership.role)) {
      return Response.json({ error: "Only a care-space owner can invite helpers." }, { status: 403 });
    }
    const { data: member, error: memberError } = await supabase.from("care_space_members").insert({
      care_space_id: input.careSpaceId,
      invited_email: input.email.toLowerCase(),
      role: "family_helper",
      status: "invited",
      expires_at: input.expiresAt,
    }).select().single();
    if (memberError) throw memberError;
    const { data: permission, error: permissionError } = await supabase.from("permissions").insert({
      care_space_id: input.careSpaceId,
      member_id: member.id,
      purpose: input.purpose,
      can_view: input.canView,
      can_edit: input.canEdit,
      can_receive_alerts: input.canReceiveAlerts,
      can_access_documents: input.canAccessDocuments,
      can_contact_professionals: input.canContactProfessionals,
      allowed_categories: input.allowedCategories,
      withheld_categories: ["diagnoses", "medications", "insurance", "caregiver_private_notes"],
      expires_at: input.expiresAt,
      created_by: user.id,
    }).select().single();
    if (permissionError) throw permissionError;
    const rate = await limitRequest("email", requestIdentifier(request, user.id));
    const email = rate.success ? await sendHearthEmail({
      to: input.email,
      subject: "You have a HEARTH care task invitation",
      text: `A family caregiver invited you to help with a specific care task in HEARTH. Sign in at ${getServerEnvironment().NEXT_PUBLIC_APP_URL} using this email address, then choose Accept invitation. You will only see the information shared for that task.`,
      idempotencyKey: `family-invite-${member.id}`,
    }) : { sent: false as const, reason: "rate_limited" };
    await supabase.from("permission_events").insert({
      care_space_id: input.careSpaceId,
      permission_id: permission.id,
      actor_id: user.id,
      action: "created",
      after_state: permission,
    });
    return Response.json({ member, permission, email }, { status: 201 });
  } catch (error) {
    return apiError(error, "family_invite");
  }
}

export async function PATCH(request: Request) {
  try {
    requireSameOrigin(request);
    const input = permissionUpdateSchema.parse(await request.json());
    const { user, supabase, membership } = await requireCareSpaceMember(input.careSpaceId);
    if (!["primary_caregiver", "care_recipient", "administrator"].includes(membership.role)) {
      return Response.json({ error: "Only a care-space owner can change access." }, { status: 403 });
    }
    const { data: before, error: readError } = await supabase.from("permissions")
      .select("*").eq("id", input.permissionId).eq("care_space_id", input.careSpaceId).single();
    if (readError) throw readError;
    const update = {
      ...(input.canView !== undefined ? { can_view: input.canView } : {}),
      ...(input.canEdit !== undefined ? { can_edit: input.canEdit } : {}),
      ...(input.canReceiveAlerts !== undefined ? { can_receive_alerts: input.canReceiveAlerts } : {}),
      ...(input.canAccessDocuments !== undefined ? { can_access_documents: input.canAccessDocuments } : {}),
      ...(input.canContactProfessionals !== undefined ? { can_contact_professionals: input.canContactProfessionals } : {}),
      ...(input.revoke ? { revoked_at: new Date().toISOString(), can_view: false, can_edit: false } : {}),
    };
    const { data: after, error } = await supabase.from("permissions").update(update).eq("id", input.permissionId).select().single();
    if (error) throw error;
    await supabase.from("permission_events").insert({
      care_space_id: input.careSpaceId,
      permission_id: input.permissionId,
      actor_id: user.id,
      action: input.revoke ? "revoked" : "updated",
      before_state: before,
      after_state: after,
    });
    return Response.json({ permission: after });
  } catch (error) {
    return apiError(error, "permission_update");
  }
}
