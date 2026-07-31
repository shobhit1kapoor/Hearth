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
