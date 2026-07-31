import assert from "node:assert/strict";
import { createHash, randomUUID } from "node:crypto";
import { createClient, type SupabaseClient, type User } from "@supabase/supabase-js";
import { commitments, sources } from "../lib/hearth";
import { syntheticHousehold } from "../lib/synthetic-household";

if (process.env.PROVISION_SYNTHETIC_HOUSEHOLD !== "true") {
  throw new Error("Set PROVISION_SYNTHETIC_HOUSEHOLD=true in .env.synthetic.local before running this script.");
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.HEARTH_SYNTHETIC_PASSWORD;
if (!supabaseUrl || !anonKey || !serviceRoleKey || !password) {
  throw new Error("Supabase URL, anonymous key, service-role key, and HEARTH_SYNTHETIC_PASSWORD are required.");
}
if (password.length < 20) throw new Error("HEARTH_SYNTHETIC_PASSWORD must contain at least 20 characters.");

const admin = createClient(supabaseUrl, serviceRoleKey, authOptions());
const owner = createClient(supabaseUrl, anonKey, authOptions());
const helper = createClient(supabaseUrl, anonKey, authOptions());

const ownerUser = await ensureSyntheticUser(admin, {
  email: syntheticHousehold.caregiver.email,
  password,
  displayName: syntheticHousehold.caregiver.displayName,
  timezone: syntheticHousehold.caregiver.timezone,
  role: "primary_caregiver",
});
await ensureSyntheticUser(admin, {
  email: syntheticHousehold.helper.email,
  password,
  displayName: syntheticHousehold.helper.displayName,
  timezone: syntheticHousehold.helper.timezone,
  role: "family_helper",
});

await resetOwnedSyntheticSpace(admin, ownerUser.id);
await signIn(owner, syntheticHousehold.caregiver.email, password);
await signIn(helper, syntheticHousehold.helper.email, password);

const { data: careSpaceId, error: spaceError } = await owner.rpc("create_care_space_with_defaults", {
  space_name: syntheticHousehold.careSpaceName,
  recipient_name: syntheticHousehold.recipient.preferredName,
  relationship: syntheticHousehold.caregiver.relationship,
  preferred_language: syntheticHousehold.recipient.preferredLanguage,
  notifications_enabled: true,
  consent_acknowledged: true,
});
assert.ifError(spaceError);
assert.equal(typeof careSpaceId, "string", "Care-space creation did not return an id.");

const { error: recipientError } = await owner.from("care_recipients").update({
  preferences: syntheticHousehold.recipient.preferences,
}).eq("care_space_id", careSpaceId);
assert.ifError(recipientError);

const { error: ownerMemberError } = await owner.from("care_space_members").update({
  display_name: syntheticHousehold.caregiver.displayName,
}).eq("care_space_id", careSpaceId).eq("user_id", ownerUser.id);
assert.ifError(ownerMemberError);

const { data: invitedHelper, error: helperMemberError } = await owner.from("care_space_members").insert({
  care_space_id: careSpaceId,
  display_name: syntheticHousehold.helper.displayName,
  invited_email: syntheticHousehold.helper.email,
  role: "family_helper",
  status: "invited",
}).select("id").single();
assert.ifError(helperMemberError);
assert.ok(invitedHelper?.id);

const { error: permissionError } = await owner.from("permissions").insert({
  care_space_id: careSpaceId,
  member_id: invitedHelper.id,
  purpose: syntheticHousehold.helperPermission.purpose,
  can_view: true,
  can_edit: true,
  can_receive_alerts: true,
  can_access_documents: false,
  can_contact_professionals: false,
  allowed_categories: syntheticHousehold.helperPermission.allowedCategories,
  withheld_categories: syntheticHousehold.helperPermission.withheldCategories,
  created_by: ownerUser.id,
});
assert.ifError(permissionError);

const { data: acceptedSpaceId, error: acceptanceError } = await helper.rpc("accept_care_space_invitation", {
  invitation_id: invitedHelper.id,
});
assert.ifError(acceptanceError);
assert.equal(acceptedSpaceId, careSpaceId);

await loadValidatedSample(owner, careSpaceId, ownerUser.id, invitedHelper.id);

const { error: notificationError } = await owner.from("notification_preferences").update({
  master_enabled: true,
  email_enabled: false,
  in_app_enabled: true,
  daily_summary: true,
  category_settings: {
    daily_responsibilities: false,
    appointments: true,
    medication_refills: true,
    family_task_updates: true,
    external_responses: false,
    routine_summaries: false,
    professional_review: true,
  },
}).eq("care_space_id", careSpaceId).eq("user_id", ownerUser.id);
assert.ifError(notificationError);

const { error: quietHoursError } = await owner.from("quiet_hours").update({
  enabled: true,
  start_time: "21:30",
  end_time: "07:00",
  days: [0, 1, 2, 3, 4, 5, 6],
  timezone: syntheticHousehold.caregiver.timezone,
}).eq("care_space_id", careSpaceId).eq("user_id", ownerUser.id);
assert.ifError(quietHoursError);

const { error: capacityError } = await owner.from("capacity_snapshots").insert({
  care_space_id: careSpaceId,
  user_id: ownerUser.id,
  input_json: syntheticHousehold.capacity.input,
  required_hours: syntheticHousehold.capacity.requiredHours,
  available_hours: syntheticHousehold.capacity.availableHours,
  deficit_hours: syntheticHousehold.capacity.deficitHours,
  recommendation_json: syntheticHousehold.capacity.recommendation,
});
assert.ifError(capacityError);

await verifyHousehold(owner, helper, careSpaceId, invitedHelper.id);

console.log(`Synthetic household ready: ${syntheticHousehold.careSpaceName}`);
console.log(`Caregiver login: ${syntheticHousehold.caregiver.email}`);
console.log(`Helper login: ${syntheticHousehold.helper.email}`);
console.log("Password: saved only in .env.synthetic.local");
console.log(`Care space id: ${careSpaceId}`);

function authOptions() {
  return { auth: { autoRefreshToken: false, detectSessionInUrl: false, persistSession: false } };
}

async function findUserByEmail(client: SupabaseClient, email: string): Promise<User | null> {
  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await client.auth.admin.listUsers({ page, perPage: 100 });
    assert.ifError(error);
    const match = data.users.find((user) => user.email?.toLowerCase() === email.toLowerCase());
    if (match) return match;
    if (data.users.length < 100) return null;
  }
  throw new Error(`Could not finish searching for ${email}.`);
}

async function ensureSyntheticUser(client: SupabaseClient, input: {
  email: string;
  password: string;
  displayName: string;
  timezone: string;
  role: "primary_caregiver" | "family_helper";
}) {
  const existing = await findUserByEmail(client, input.email);
  if (existing && existing.user_metadata?.hearth_synthetic_marker !== syntheticHousehold.marker) {
    throw new Error(`Refusing to change existing non-synthetic account: ${input.email}`);
  }
  const attributes = {
    password: input.password,
    email_confirm: true,
    user_metadata: {
      display_name: input.displayName,
      timezone: input.timezone,
      hearth_synthetic_marker: syntheticHousehold.marker,
    },
  };
  const result = existing
    ? await client.auth.admin.updateUserById(existing.id, attributes)
    : await client.auth.admin.createUser({ email: input.email, ...attributes });
  assert.ifError(result.error);
  assert.ok(result.data.user);
  const { error: profileError } = await client.from("profiles").upsert({
    id: result.data.user.id,
    display_name: input.displayName,
    preferred_language: "en",
    timezone: input.timezone,
    role: input.role,
  });
  assert.ifError(profileError);
  return result.data.user;
}

async function resetOwnedSyntheticSpace(client: SupabaseClient, ownerId: string) {
  const { data: spaces, error } = await client.from("care_spaces")
    .select("id, name, allow_identifiable_data")
    .eq("owner_id", ownerId)
    .eq("name", syntheticHousehold.careSpaceName);
  assert.ifError(error);
  for (const space of spaces ?? []) {
    if (space.allow_identifiable_data) throw new Error("Refusing to reset a space that permits identifiable data.");
    const { data: documents, error: documentError } = await client.from("source_documents")
      .select("storage_bucket, storage_path")
      .eq("care_space_id", space.id);
    assert.ifError(documentError);
    for (const bucket of ["care-documents", "caregiver-notes", "generated-exports"]) {
      const paths = (documents ?? []).filter((item) => item.storage_bucket === bucket).map((item) => item.storage_path);
      if (paths.length > 0) {
        const { error: removeError } = await client.storage.from(bucket).remove(paths);
        assert.ifError(removeError);
      }
    }
    const { error: deleteError } = await client.from("care_spaces").delete().eq("id", space.id);
    assert.ifError(deleteError);
  }
}

async function signIn(client: SupabaseClient, email: string, userPassword: string) {
  const { error } = await client.auth.signInWithPassword({ email, password: userPassword });
  assert.ifError(error);
}

async function loadValidatedSample(client: SupabaseClient, careSpaceId: string, userId: string, helperMemberId: string) {
  const stateMap: Record<string, string> = {
    Identified: "identified", "Needs review": "needs_review", Assigned: "assigned",
    "Awaiting acceptance": "awaiting_acceptance", Accepted: "accepted", "In progress": "in_progress",
    "Awaiting external response": "awaiting_external_response", Blocked: "blocked", Escalated: "escalated",
    Completed: "completed", Verified: "verified", Cancelled: "cancelled", Superseded: "superseded",
  };
  const bundleId = randomUUID();
  const sourceText = sources.map((source) => `${source.id}: ${source.title}\n${source.date} · ${source.origin}`).join("\n\n");
  const sampleHash = createHash("sha256").update("hearth-synthetic-launch-household-2026-07-31.1").digest("hex");
  const fileName = "hearth-realistic-synthetic-care-bundle.txt";
  const storagePath = `${careSpaceId}/${bundleId}/${fileName}`;
  const { error: uploadError } = await client.storage.from("care-documents").upload(
    storagePath,
    new Blob([sourceText], { type: "text/plain" }),
    { contentType: "text/plain", upsert: false },
  );
  assert.ifError(uploadError);
  const { error: documentError } = await client.from("source_documents").insert({
    id: bundleId,
    care_space_id: careSpaceId,
    uploaded_by: userId,
    storage_bucket: "care-documents",
    storage_path: storagePath,
    original_file_name: fileName,
    file_hash: sampleHash,
    mime_type: "text/plain",
    byte_size: Buffer.byteLength(sourceText),
    document_type: "validated_synthetic_bundle",
    document_date: "2026-07-27",
    processing_status: "review_ready",
    synthetic: true,
  });
  assert.ifError(documentError);
  const runId = randomUUID();
  const { error: runError } = await client.from("analysis_runs").insert({
    id: runId,
    care_space_id: careSpaceId,
    source_document_id: bundleId,
    requested_by: userId,
    provider: "validated_cache",
    model: "hearth-deterministic-compiler-v0.3",
    prompt_version: "synthetic-launch-household-2026-07-31.1",
    status: "completed",
    input_hash: sampleHash,
    output_json: { sourceCount: sources.length, commitmentCount: commitments.length, liveAI: false, synthetic: true },
    started_at: new Date().toISOString(),
    completed_at: new Date().toISOString(),
  });
  assert.ifError(runError);
  const { data: rows, error: commitmentError } = await client.from("care_commitments").insert(
    commitments.map((item) => ({
      care_space_id: careSpaceId,
      analysis_run_id: runId,
      title: item.responsibility,
      plain_language_description: item.excerpt,
      category: item.privacy.toLowerCase().replace(" ", "_"),
      state: stateMap[item.state] ?? "needs_review",
      risk_level: item.risk.toLowerCase(),
      owner_member_id: item.id === "CCO-005" ? helperMemberId : null,
      time_window: item.dueWindow,
      confidence: item.confidence === "High" ? 0.95 : item.confidence === "Medium" ? 0.75 : 0.45,
      evidence_kind: item.confidence === "Low" ? "unknown" : "verified_source_fact",
      possible_conflict: item.verification === "Unresolved conflict" ? "The source instructions conflict and need human review." : null,
      requires_human_review: item.approvalRequired,
      escalation_target: item.escalation,
      required_equipment: item.equipment,
      required_skill: item.skill ? [item.skill] : [],
      dependencies: item.dependencies,
      completion_evidence_rule: item.completionCriteria,
    })),
  ).select("id, title");
  assert.ifError(commitmentError);
  assert.equal(rows?.length, 26);
  const { error: sourceError } = await client.from("commitment_sources").insert(
    (rows ?? []).map((row, index) => ({
      care_space_id: careSpaceId,
      commitment_id: row.id,
      source_document_id: bundleId,
      source_excerpt: commitments[index].excerpt,
      source_date: "2026-07-27",
    })),
  );
  assert.ifError(sourceError);
}

async function verifyHousehold(ownerClient: SupabaseClient, helperClient: SupabaseClient, careSpaceId: string, helperMemberId: string) {
  const ownerTasks = await ownerClient.from("care_commitments").select("id, title, state, requires_human_review, possible_conflict, owner_member_id").eq("care_space_id", careSpaceId);
  assert.ifError(ownerTasks.error);
  assert.equal(ownerTasks.data?.length, 26, "The caregiver must see all 26 responsibilities.");
  const conflict = ownerTasks.data?.find((task) => task.title.toLowerCase().includes("insulin glargine"));
  assert.equal(conflict?.state, "blocked");
  assert.equal(conflict?.requires_human_review, true);
  assert.ok(conflict?.possible_conflict);
  const helperTasks = await helperClient.from("care_commitments").select("id, title, state, owner_member_id").eq("care_space_id", careSpaceId);
  assert.ifError(helperTasks.error);
  assert.equal(helperTasks.data?.length, 1, "The helper must see only the assigned transportation task.");
  assert.equal(helperTasks.data?.[0]?.owner_member_id, helperMemberId);
  assert.match(helperTasks.data?.[0]?.title ?? "", /transportation/i);
  const helperRecipients = await helperClient.from("care_recipients").select("id").eq("care_space_id", careSpaceId);
  assert.ifError(helperRecipients.error);
  assert.equal(helperRecipients.data?.length, 0, "Recipient details must stay hidden from the task-only helper.");
  const helperDocuments = await helperClient.from("source_documents").select("id").eq("care_space_id", careSpaceId);
  assert.ifError(helperDocuments.error);
  assert.equal(helperDocuments.data?.length, 0, "Documents must stay hidden from the task-only helper.");
}
