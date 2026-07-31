import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
import { createServerClient } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

if (process.env.RUN_PRODUCTION_ACCEPTANCE !== "true") {
  throw new Error("Set RUN_PRODUCTION_ACCEPTANCE=true to run this temporary-user production check.");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !anonKey || !serviceRoleKey) {
  throw new Error("Supabase URL, anonymous key, and service-role key are required.");
}

const suffix = `${Date.now()}-${randomBytes(3).toString("hex")}`;
const ownerEmail = `hearth-owner-${suffix}@example.test`;
const helperEmail = process.env.HEARTH_TEST_EMAIL ?? `hearth-helper-${suffix}@example.test`;
const acceptanceUrl = process.env.HEARTH_ACCEPTANCE_URL?.replace(/\/$/, "");
const password = `Hearth-${randomBytes(18).toString("base64url")}!`;
const admin = createClient(supabaseUrl, serviceRoleKey, authOptions());
const owner = createClient(supabaseUrl, anonKey, authOptions());
const helper = createClient(supabaseUrl, anonKey, authOptions());
const userIds: string[] = [];
let careSpaceId: string | null = null;

try {
  const ownerUser = await createTemporaryUser(admin, ownerEmail, password, "Acceptance Owner");
  userIds.push(ownerUser.id);
  const helperUser = await createTemporaryUser(admin, helperEmail, password, "Acceptance Helper");
  userIds.push(helperUser.id);

  await signIn(owner, ownerEmail, password);
  await signIn(helper, helperEmail, password);

  const { data: createdSpace, error: spaceError } = await owner.rpc("create_care_space_with_defaults", {
    space_name: "HEARTH acceptance check",
    recipient_name: "Synthetic Person",
    relationship: "Synthetic caregiver",
    preferred_language: "en",
    notifications_enabled: true,
    consent_acknowledged: true,
  });
  assert.ifError(spaceError);
  if (typeof createdSpace !== "string") throw new Error("Care-space creation returned no id.");
  careSpaceId = createdSpace;
  const activeCareSpaceId = createdSpace;

  const hiddenBeforeInvite = await helper.from("care_spaces").select("id").eq("id", activeCareSpaceId);
  assert.ifError(hiddenBeforeInvite.error);
  assert.equal(hiddenBeforeInvite.data?.length, 0, "An unrelated account must not see the care space.");

  const invitationResult = acceptanceUrl
    ? await createInvitationThroughApi({
      acceptanceUrl,
      supabaseUrl,
      anonKey,
      owner,
      email: ownerEmail,
      password,
      careSpaceId: activeCareSpaceId,
      helperEmail,
    })
    : await createInvitationDirectly({
      owner,
      ownerUserId: ownerUser.id,
      careSpaceId: activeCareSpaceId,
      helperEmail,
    });
  const { invitation, permission } = invitationResult;

  const listedInvitations = await helper.rpc("list_my_care_space_invitations");
  assert.ifError(listedInvitations.error);
  assert.equal(listedInvitations.data?.length, 1, "The invited account should see one matching invitation.");
  assert.equal(listedInvitations.data?.[0]?.id, invitation.id);

  const hiddenBeforeAcceptance = await helper.from("care_spaces").select("id").eq("id", activeCareSpaceId);
  assert.ifError(hiddenBeforeAcceptance.error);
  assert.equal(hiddenBeforeAcceptance.data?.length, 0, "An invitation must not grant access before acceptance.");

  const accepted = await helper.rpc("accept_care_space_invitation", { invitation_id: invitation.id });
  assert.ifError(accepted.error);
  assert.equal(accepted.data, activeCareSpaceId);

  const visibleAfterAcceptance = await helper.from("care_spaces").select("id").eq("id", activeCareSpaceId);
  assert.ifError(visibleAfterAcceptance.error);
  assert.equal(visibleAfterAcceptance.data?.length, 1, "Accepted membership should reveal the care-space shell.");

  const recipientStillHidden = await helper.from("care_recipients").select("id").eq("care_space_id", activeCareSpaceId);
  assert.ifError(recipientStillHidden.error);
  assert.equal(recipientStillHidden.data?.length, 0, "Task-only permission must not reveal recipient details.");

  const { data: task, error: taskError } = await owner
    .from("care_commitments")
    .insert({
      care_space_id: activeCareSpaceId,
      title: "Synthetic ride check",
      plain_language_description: "Confirm a synthetic ride.",
      category: "transportation",
      evidence_kind: "verified_source_fact",
      requires_human_review: false,
      completion_evidence_rule: "Record synthetic confirmation.",
    })
    .select("id")
    .single();
  assert.ifError(taskError);
  assert.ok(task?.id);

  const visibleTask = await helper.from("care_commitments").select("id").eq("id", task.id);
  assert.ifError(visibleTask.error);
  assert.equal(visibleTask.data?.length, 1, "Task permission should reveal the assigned work category.");

  const revokePermission = await owner
    .from("permissions")
    .update({ can_view: false, can_edit: false, revoked_at: new Date().toISOString() })
    .eq("id", permission.id);
  assert.ifError(revokePermission.error);

  const hiddenAfterPermissionRevoke = await helper.from("care_commitments").select("id").eq("id", task.id);
  assert.ifError(hiddenAfterPermissionRevoke.error);
  assert.equal(hiddenAfterPermissionRevoke.data?.length, 0, "Revoked permission must immediately hide tasks.");

  const revokeMember = await owner
    .from("care_space_members")
    .update({ status: "revoked", revoked_at: new Date().toISOString() })
    .eq("id", invitation.id);
  assert.ifError(revokeMember.error);

  const hiddenAfterMembershipRevoke = await helper.from("care_spaces").select("id").eq("id", activeCareSpaceId);
  assert.ifError(hiddenAfterMembershipRevoke.error);
  assert.equal(hiddenAfterMembershipRevoke.data?.length, 0, "Revoked membership must immediately hide the care space.");

  console.log("Production acceptance: invitation, acceptance, minimum disclosure, permission revocation, and membership revocation passed.");
} finally {
  if (careSpaceId) {
    await admin.from("care_spaces").delete().eq("id", careSpaceId);
  }
  for (const userId of userIds.reverse()) {
    await admin.auth.admin.deleteUser(userId);
  }
}

function authOptions() {
  return {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  };
}

async function createTemporaryUser(
  client: SupabaseClient,
  email: string,
  userPassword: string,
  displayName: string,
) {
  const { data, error } = await client.auth.admin.createUser({
    email,
    password: userPassword,
    email_confirm: true,
    user_metadata: { display_name: displayName },
  });
  assert.ifError(error);
  assert.ok(data.user);
  return data.user;
}

async function signIn(client: SupabaseClient, email: string, userPassword: string) {
  const { error } = await client.auth.signInWithPassword({ email, password: userPassword });
  assert.ifError(error);
}

async function createInvitationDirectly(input: {
  owner: SupabaseClient;
  ownerUserId: string;
  careSpaceId: string;
  helperEmail: string;
}) {
  const { data: invitation, error: invitationError } = await input.owner
    .from("care_space_members")
    .insert({
      care_space_id: input.careSpaceId,
      invited_email: input.helperEmail,
      role: "family_helper",
      status: "invited",
    })
    .select("id")
    .single();
  assert.ifError(invitationError);
  assert.ok(invitation?.id);

  const { data: permission, error: permissionError } = await input.owner
    .from("permissions")
    .insert({
      care_space_id: input.careSpaceId,
      member_id: invitation.id,
      purpose: "Synthetic transportation help",
      can_view: true,
      can_edit: false,
      can_receive_alerts: true,
      can_access_documents: false,
      can_contact_professionals: false,
      allowed_categories: ["tasks"],
      withheld_categories: ["diagnoses", "medications", "insurance", "caregiver_private_notes"],
      created_by: input.ownerUserId,
    })
    .select("id")
    .single();
  assert.ifError(permissionError);
  assert.ok(permission?.id);
  return { invitation, permission };
}

async function createInvitationThroughApi(input: {
  acceptanceUrl: string;
  supabaseUrl: string;
  anonKey: string;
  owner: SupabaseClient;
  email: string;
  password: string;
  careSpaceId: string;
  helperEmail: string;
}) {
  const cookieValues = new Map<string, string>();
  const serverClient = createServerClient(input.supabaseUrl, input.anonKey, {
    cookies: {
      getAll: () => [...cookieValues].map(([name, value]) => ({ name, value })),
      setAll: (cookies) => {
        for (const cookie of cookies) cookieValues.set(cookie.name, cookie.value);
      },
    },
  });
  const { error: signInError } = await serverClient.auth.signInWithPassword({
    email: input.email,
    password: input.password,
  });
  assert.ifError(signInError);

  const response = await fetch(`${input.acceptanceUrl}/api/family`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: [...cookieValues].map(([name, value]) => `${name}=${value}`).join("; "),
      Origin: input.acceptanceUrl,
    },
    body: JSON.stringify({
      careSpaceId: input.careSpaceId,
      email: input.helperEmail,
      purpose: "Synthetic transportation help",
      canView: true,
      canEdit: false,
      canReceiveAlerts: true,
      canAccessDocuments: false,
      canContactProfessionals: false,
      allowedCategories: ["tasks"],
      expiresAt: null,
    }),
  });
  const payload = await response.json() as {
    error?: string;
    member?: { id: string };
    permission?: { id: string };
    email?: { sent: boolean; reason?: string };
  };
  if (response.status !== 201) {
    const members = await input.owner
      .from("care_space_members")
      .select("id, permissions(id)")
      .eq("care_space_id", input.careSpaceId)
      .eq("invited_email", input.helperEmail);
    const invitationPersisted = Boolean(members.data?.[0]?.id);
    const permissionPersisted = Array.isArray(members.data?.[0]?.permissions)
      && members.data[0].permissions.length > 0;
    throw new Error(
      `${payload.error ?? "Family invitation API failed."} invitationPersisted=${invitationPersisted} permissionPersisted=${permissionPersisted}`,
    );
  }
  assert.equal(response.status, 201, payload.error ?? "Family invitation API failed.");
  assert.ok(payload.member?.id);
  assert.ok(payload.permission?.id);
  assert.equal(payload.email?.sent, true, `Invitation email was not sent: ${payload.email?.reason ?? "unknown"}`);
  return {
    invitation: payload.member,
    permission: payload.permission,
  };
}
