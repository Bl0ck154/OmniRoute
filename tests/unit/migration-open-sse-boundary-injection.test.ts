import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const read = (p: string) => fs.readFileSync(path.resolve(process.cwd(), p), "utf8");

test("engine request paths never import app-only artifact sink or preference timeout policy", () => {
  for (const path of [
    "open-sse/handlers/chatCore/nonStreamingResponse.ts",
    "open-sse/handlers/chatCore/streamingTail.ts",
    "open-sse/handlers/chatCore/executeProviderRequest.ts",
  ]) {
    const src = read(path);
    assert.ok(!src.includes('from "@/lib/usage/orderForgeImageArtifactSink"'), path);
    assert.ok(!src.includes('from "@/sse/services/preferredConnectionFailover"'), path);
  }
});

test("trusted app injects scoped optional hooks into both engine response branches", () => {
  const app = read("src/sse/handlers/chatHelpers.ts");
  const core = read("open-sse/handlers/chatCore.ts");
  const nonstream = read("open-sse/handlers/chatCore/nonStreamingResponse.ts");
  const streaming = read("open-sse/handlers/chatCore/streamingTail.ts");
  for (const member of [
    "resolveCapture: resolveOrderForgeImageArtifactCapture",
    "persist: persistOrderForgeImageArtifacts",
    "drain: drainOrderForgeImageArtifactStream",
  ]) assert.ok(app.includes(member), member);
  assert.equal(core.split("orderForgeImageArtifacts,").length - 1, 2);
  assert.match(nonstream, /deps\.orderForgeImageArtifacts\?\.resolveCapture\?\.\(/);
  assert.match(nonstream, /deps\.orderForgeImageArtifacts\?\.persist\?\.\(/);
  assert.match(streaming, /deps\.orderForgeImageArtifacts\?\.resolveCapture\?\.\(/);
  assert.match(streaming, /deps\.orderForgeImageArtifacts\.drain\(artifactStream\)/);
});

test("preferred timeout policy is engine-owned while old app export remains compatible", async () => {
  const engine = await import("../../open-sse/services/preferredConnectionFailover.ts");
  const app = await import("../../src/sse/services/preferredConnectionFailover.ts");
  assert.equal(engine.getPreferredAntigravityStartTimeoutCapMs, app.getPreferredAntigravityStartTimeoutCapMs);
  const eligible = { selectedByApiKeyPreference: true, preferredFallbackAvailable: true };
  assert.equal(engine.getPreferredAntigravityStartTimeoutCapMs(
    "antigravity", eligible, "gemini-3.8-flash-tiered", {}
  ), 12_000);
  assert.equal(engine.getPreferredAntigravityStartTimeoutCapMs(
    "codex", eligible, "gpt-6", {}
  ), undefined);
});
