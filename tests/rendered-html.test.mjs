import assert from "node:assert/strict";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${path}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the finished HEARTH application shell", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<title>HEARTH · Care execution assurance<\/title>/i);
  assert.match(html, /Care execution assurance/);
  assert.match(html, /Synthetic data/);
  assert.match(html, /NOT EXECUTABLE/);
  assert.match(html, /Eleanor/);
  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|Starter Project/);
});

test("renders accessible landmarks and safety language", async () => {
  const response = await render();
  const html = await response.text();
  assert.match(html, /<nav[^>]*aria-label="HEARTH sections"/i);
  assert.match(html, /<main[^>]*id="main-content"/i);
  assert.match(html, /Skip to main content/);
  assert.match(html, /Not for clinical use/);
  assert.match(html, /Controlled Phase 1 simulation/);
});
