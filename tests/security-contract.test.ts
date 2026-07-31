import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";

const read = (path: string) => readFile(new URL(path, import.meta.url), "utf8");

test("upload route requires membership, same-origin mutation, validation, and private storage", async () => {
  const source = await read("../app/api/uploads/route.ts");
  assert.match(source, /requireSameOrigin\(request\)/);
  assert.match(source, /requireCareSpaceMember/);
  assert.match(source, /validateUpload\(file\)/);
  assert.match(source, /sha256File\(file\)/);
  assert.match(source, /\.from\("care-documents"\)/);
  assert.doesNotMatch(source, /createSignedUrl|publicUrl/i);
});

test("file handling limits type, size, names, and analysis payload", async () => {
  const source = await read("../lib/server/files.ts");
  assert.match(source, /10 \* 1024 \* 1024/);
  assert.match(source, /application\/pdf/);
  assert.match(source, /image\/jpeg/);
  assert.match(source, /image\/png/);
  assert.match(source, /text\/plain/);
  assert.match(source, /replace\(\/\[\^a-zA-Z0-9\._-\]\+\/g/);
  assert.match(source, /Math\.min\(document\.numPages, 50\)/);
});

test("readiness response exposes service state without returning credentials", async () => {
  const route = await read("../app/api/readiness/route.ts");
  const env = await read("../lib/config/env.ts");
  assert.match(route, /getServiceReadiness/);
  assert.doesNotMatch(route, /NVIDIA_API_KEY|SERVICE_ROLE_KEY|RESEND_API_KEY/);
  assert.match(env, /realPatientDataAllowed/);
  assert.match(env, /publicDemo/);
});

test("upload analysis applies ambiguity, shorthand, and recurring-exception controls", async () => {
  const source = await read("../app/api/uploads/route.ts");
  assert.match(source, /resolveNumericDate\(sourceText\)/);
  assert.match(source, /assessClinicalShorthand\(sourceText\)/);
  assert.match(source, /modelRecurringSchedule\(sourceText\)/);
  assert.match(source, /due_at: item\.dueDate && !dateNeedsReview/);
  assert.match(source, /state = shorthandNeedsReview[\s\S]*"escalated"/);
});

test("AI routes allow enough time for production document processing", async () => {
  const uploadRoute = await read("../app/api/uploads/route.ts");
  const translationRoute = await read("../app/api/translations/route.ts");
  const vercel = JSON.parse(await read("../vercel.json")) as {
    functions: Record<string, { maxDuration: number }>;
  };

  assert.match(uploadRoute, /maxDuration = 180/);
  assert.match(translationRoute, /maxDuration = 180/);
  assert.equal(vercel.functions["app/api/uploads/route.ts"].maxDuration, 180);
  assert.equal(vercel.functions["app/api/translations/route.ts"].maxDuration, 180);
});

test("corrections use optimistic concurrency and persist disagreements", async () => {
  const source = await read("../app/api/commitments/[id]/route.ts");
  assert.match(source, /current\.version !== input\.baseVersion/);
  assert.match(source, /\.eq\("version", input\.baseVersion\)/);
  assert.match(source, /\.from\("commitment_correction_conflicts"\)/);
  assert.match(source, /code: "CORRECTION_CONFLICT"/);
});

test("family invitations require sign-in, same-origin acceptance, and a database claim function", async () => {
  const source = await read("../app/api/family/invitations/route.ts");
  assert.match(source, /requireUser\(\)/);
  assert.match(source, /requireSameOrigin\(request\)/);
  assert.match(source, /list_my_care_space_invitations/);
  assert.match(source, /accept_care_space_invitation/);
});

test("task actions enforce manager and assigned-helper ownership", async () => {
  const source = await read("../app/api/commitments/[id]/route.ts");
  assert.match(source, /isAssignedOwner/);
  assert.match(source, /Only the assigned helper can accept this task/);
  assert.match(source, /Only the care-space owner can make this change/);
});

test("family member and permission listings are restricted to care-space managers", async () => {
  const source = await read("../app/api/family/route.ts");
  assert.match(source, /Only a care-space owner can view family access/);
  assert.match(source, /display_name/);
});

test("caregiver receives a clear manual step when invitation email is unavailable", async () => {
  const source = await read("../app/CaregiverApp.tsx");
  assert.match(source, /Access is saved, but the email could not be sent/);
  assert.match(source, /open HEARTH and sign in with/);
});

test("public demo mode opens without authentication and stays separate from caregiver mode", async () => {
  const entry = await read("../app/AppEntry.tsx");
  const demo = await read("../app/HearthApp.tsx");
  const demoPage = await read("../app/demo/page.tsx");
  assert.match(entry, /Open demo — no sign in/);
  assert.match(entry, /href="\/demo"/);
  assert.doesNotMatch(entry, /CaregiverApp|signInWith|create an account/);
  assert.match(demoPage, /<HearthApp/);
  assert.match(demo, /Made-up household\. No account is needed/);
  assert.match(demo, /setResolution\(initialResolution\)/);
  assert.doesNotMatch(demo, /createSupabase|requireUser|signInWith/);
});

test("validated sample waits for a helper selection before acceptance", async () => {
  const source = await read("../app/api/demo/load/route.ts");
  assert.match(source, /"Awaiting acceptance": "assigned"/);
});

test("rate limiting prefers the atomic database limiter and keeps safe fallbacks", async () => {
  const source = await read("../lib/server/rate-limit.ts");
  assert.match(source, /createSupabaseAdminClient/);
  assert.match(source, /\.from\("service_rate_limits"\)/);
  assert.match(source, /\.eq\("request_count", current\.request_count\)/);
  assert.match(source, /Ratelimit\.slidingWindow/);
  assert.match(source, /memoryWindows/);
});
