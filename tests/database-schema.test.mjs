import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const migrationUrl = new URL("../supabase/migrations/202607300001_hearth_core.sql", import.meta.url);
const sql = await readFile(migrationUrl, "utf8");
const remediationMigrationUrl = new URL("../supabase/migrations/202607310001_holdout_remediation.sql", import.meta.url);
const remediationSql = await readFile(remediationMigrationUrl, "utf8");

const requiredTables = [
  "profiles", "care_spaces", "care_space_members", "care_recipients",
  "source_documents", "document_pages", "analysis_runs", "care_commitments",
  "commitment_sources", "commitment_events", "permissions", "permission_events",
  "notification_preferences", "notifications", "quiet_hours", "translations",
  "capacity_snapshots", "escalations", "accountability_receipts", "audit_events",
  "export_requests", "deletion_requests", "demo_sessions", "validation_runs",
  "validation_results",
];

test("migration defines every persistent HEARTH domain table", () => {
  for (const table of requiredTables) {
    assert.match(sql, new RegExp(`create table public\\.${table}\\s*\\(`, "i"), table);
  }
});

test("every domain table is included in the row-level security enablement loop", () => {
  assert.match(sql, /execute format\('alter table public\.%I enable row level security'/i);
  for (const table of requiredTables) {
    assert.match(sql, new RegExp(`'${table}'`), table);
  }
});

test("migration provisions private document and export storage", () => {
  for (const bucket of ["care-documents", "caregiver-notes", "generated-exports"]) {
    assert.match(sql, new RegExp(`'${bucket}'\\s*,\\s*'${bucket}'\\s*,\\s*false`, "i"), bucket);
  }
  assert.match(sql, /create policy[\s\S]+storage\.objects/i);
});

test("membership, category access, and revocation are enforced in database policy code", () => {
  assert.match(sql, /create or replace function public\.is_active_care_space_member/i);
  assert.match(sql, /create or replace function public\.can_access_category/i);
  assert.match(sql, /status\s*=\s*'active'/i);
  assert.match(sql, /revoked_at\s+is\s+null/i);
  assert.match(sql, /expires_at\s+is\s+null\s+or\s+\w+\.expires_at\s*>\s*now\(\)/i);
});

test("remediation migration persists interpretation controls and correction conflicts", () => {
  for (const column of ["date_interpretation", "clinical_shorthand", "schedule_rule"]) {
    assert.match(remediationSql, new RegExp(`add column if not exists ${column}`, "i"), column);
  }
  assert.match(remediationSql, /create table if not exists public\.commitment_correction_conflicts/i);
  assert.match(remediationSql, /alter table public\.commitment_correction_conflicts enable row level security/i);
  assert.match(remediationSql, /public\.can_access_category\(care_space_id, 'tasks'\)/i);
  assert.doesNotMatch(remediationSql, /public\.is_care_space_member\(/i);
  assert.match(remediationSql, /create or replace function public\.can_edit_category\(space_id uuid, category text\)/i);
  assert.match(remediationSql, /drop policy if exists "commitments write members"/i);
  assert.match(remediationSql, /create policy "commitments update editors"/i);
  assert.match(remediationSql, /create policy "storage read by minimum disclosure"/i);
  assert.match(remediationSql, /public\.can_access_category\(\(storage\.foldername\(name\)\)\[1\]::uuid, 'documents'\)/i);
  assert.match(remediationSql, /Members can read correction conflicts/i);
  assert.match(remediationSql, /Admins can resolve correction conflicts/i);
  assert.match(remediationSql, /create or replace function public\.list_my_care_space_invitations\(\)/i);
  assert.match(remediationSql, /create or replace function public\.accept_care_space_invitation\(invitation_id uuid\)/i);
  assert.match(remediationSql, /lower\(member\.invited_email\) = lower\(account_email\)/i);
  assert.match(remediationSql, /grant execute on function public\.accept_care_space_invitation\(uuid\) to authenticated/i);
});
