import assert from "node:assert/strict";
import { randomBytes } from "node:crypto";
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
const helperEmail = `hearth-helper-${suffix}@example.test`;
const password = `Hearth-${randomBytes(18).toString("base64url")}!`;
const admin = createClient(supabaseUrl, serviceRoleKey, authOptions());
const owner = createClient(supabaseUrl, anonKey, authOptions());
const helper = createClient(supabaseUrl, anonKey, authOptions());
const userIds: string[] = [];
let careSpaceId: string | null = null;

try {
  const ownerUser = await createTemporaryUser(admin, ownerEmail, password, "Acceptance Owner");
  const helperUser = await createTemporaryUser(admin, helperEmail, password, "Acceptance Helper");
  userIds.push(ownerUser.id, helperUser.id);

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
  assert.equal(typeof createdSpace, "string");
  careSpaceId = createdSpace;

  const hiddenBeforeInvite = await helper.from("care_spaces").select("id").eq("id", careSpaceId);
  assert.ifError(hiddenBeforeInvite.error);
  assert.equal(hiddenBeforeInvite.data?.length, 0, "An unrelated account must not see the care space.");

  const { data: invitation, error: invitationError } = await owner
    .from("care_space_members")
    .insert({
      care_space_id: careSpaceId,
      invited_email: helperEmail,
      role: "family_helper",
      status: "invited",
    })
    .select("id")
    .single();
  assert.ifError(invitationError);
  assert.ok(invitation?.id);

  const { data: permission, error: permissionError } = await owner
    .from("permissions")
    .insert({
      care_space_id: careSpaceId,
      member_id: invitation.id,
      purpose: "Synthetic transportation help",
      can_view: true,
      can_edit: false,
      can_receive_alerts: true,
      can_access_documents: false,
      can_contact_professionals: false,
      allowed_categories: ["tasks"],
      withheld_categories: ["diagnoses", "medications", "insurance", "caregiver_private_notes"],
      created_by: ownerUser.id,
    })
    .select("id")
    .single();
  assert.ifError(permissionError);
  assert.ok(permission?.id);

  const listedInvitations = await helper.rpc("list_my_care_space_invitations");
  assert.ifError(listedInvitations.error);
  assert.equal(listedInvitations.data?.length, 1, "The invited account should see one matching invitation.");
  assert.equal(listedInvitations.data?.[0]?.id, invitation.id);

  const hiddenBeforeAcceptance = await helper.from("care_spaces").select("id").eq("id", careSpaceId);
  assert.ifError(hiddenBeforeAcceptance.error);
  assert.equal(hiddenBeforeAcceptance.data?.length, 0, "An invitation must not grant access before acceptance.");

  const accepted = await helper.rpc("accept_care_space_invitation", { invitation_id: invitation.id });
  assert.ifError(accepted.error);
  assert.equal(accepted.data, careSpaceId);

  const visibleAfterAcceptance = await helper.from("care_spaces").select("id").eq("id", careSpaceId);
  assert.ifError(visibleAfterAcceptance.error);
  assert.equal(visibleAfterAcceptance.data?.length, 1, "Accepted membership should reveal the care-space shell.");

  const recipientStillHidden = await helper.from("care_recipients").select("id").eq("care_space_id", careSpaceId);
  assert.ifError(recipientStillHidden.error);
  assert.equal(recipientStillHidden.data?.length, 0, "Task-only permission must not reveal recipient details.");

  const { data: task, error: taskError } = await owner
    .from("care_commitments")
    .insert({
      care_space_id: careSpaceId,
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

  const hiddenAfterMembershipRevoke = await helper.from("care_spaces").select("id").eq("id", careSpaceId);
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
