import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const route = fs.readFileSync(path.resolve(process.cwd(), "src/app/api/v1/images/edits/route.ts"), "utf8");
const firefly = fs.readFileSync(path.resolve(process.cwd(), "src/lib/images/adobeFireflyEdit.ts"), "utf8");

test("edit capture is only constructed after policy admission for combo and direct paths", () => {
  const comboAuth = route.indexOf("const comboPolicy = await enforceApiKeyPolicy");
  const comboCapture = route.indexOf("artifactCapture: resolveOrderForgeImageArtifactCapture");
  const directAuth = route.indexOf("const policy = await enforceApiKeyPolicy(request, fullModel)");
  const directCapture = route.indexOf("const artifactCapture = resolveOrderForgeImageArtifactCapture");
  assert.ok(comboAuth > 0 && comboCapture > comboAuth);
  assert.ok(directAuth > comboCapture && directCapture > directAuth);
  assert.equal((route.match(/apiKeyScopes: (?:comboPolicy|policy)\.apiKeyInfo\?\.scopes/g) ?? []).length, 2);
  assert.equal((route.match(/headers: request\.headers/g) ?? []).length, 2);
});

test("every edit route success path persists only through scoped helper", () => {
  assert.equal((route.match(/return capturedEditJsonResponse\(/g) ?? []).length, 7);
  assert.ok(!/return jsonResponse\((?:run\.data|result\.data|\(result as any\)\.data)/.test(route));
  assert.match(route, /if \(!capture\) return;/);
  assert.match(route, /persistOrderForgeImageArtifacts\(\{ capture, responseBody: data \}\)/);
  assert.match(route, /Optional image edit retention failed/);
  assert.match(route, /return jsonResponse\(data\)/);
});

test("Firefly edit success invokes gated callback without changing provider response", () => {
  assert.match(route, /onSuccessfulResult: \(data\) => captureSuccessfulEdit\(data, artifactCapture\)/);
  assert.match(firefly, /onSuccessfulResult\?: \(data: unknown\) => void/);
  assert.match(firefly, /onSuccessfulResult\?\.\(\(result as \{ data\?: unknown \}\)\.data\)/);
});

test("combo edit success carries authenticated combo capability", () => {
  assert.match(route, /artifactCapture: resolveOrderForgeImageArtifactCapture\(\{\s*apiKeyScopes: comboPolicy\.apiKeyInfo\?\.scopes/);
  assert.match(route, /capturedEditJsonResponse\(run\.data, ctx\.artifactCapture\)/);
  assert.match(route, /return jsonResponse\(\s*toJsonErrorPayload/);
});
