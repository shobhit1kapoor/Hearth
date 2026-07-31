import assert from "node:assert/strict";
import { after, before, test } from "node:test";
import { spawn } from "node:child_process";
import { once } from "node:events";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const port = 4399;
let server;

before(async () => {
  server = spawn(process.execPath, ["node_modules/next/dist/bin/next", "start", "-p", String(port)], {
    cwd: root,
    stdio: ["ignore", "pipe", "pipe"],
  });
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(`http://localhost:${port}`);
      if (response.ok) return;
    } catch {}
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Next.js test server did not start.");
});

after(async () => {
  if (!server || server.exitCode !== null) return;
  server.kill();
  await Promise.race([once(server, "exit"), new Promise((resolve) => setTimeout(resolve, 2_000))]);
});

async function render(pathname = "/") {
  return fetch(`http://localhost:${port}${pathname}`, { headers: { accept: "text/html" } });
}

test("server-renders the finished HEARTH application shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>HEARTH · Care, one step at a time<\/title>/i);
  assert.match(html, /Care, one step at a time/);
  assert.match(html, /Turn care instructions into a clear plan/);
  assert.match(html, /Create my care space/);
  assert.match(html, /Try the sample case/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Starter Project/);
});

test("renders accessible landmarks and safety language", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /<main[^>]*class="entry-main"/i);
  assert.match(html, /HEARTH does not diagnose or change treatment/);
  assert.match(html, /Real patient data stays disabled/);
});
