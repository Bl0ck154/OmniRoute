import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const route = fs.readFileSync(path.resolve(process.cwd(), "src/app/api/v1/images/edits/route.ts"), "utf8");
const firefly = fs.readFileSync(path.resolve(process.cwd(), "src/lib/images/adobeFireflyEdit.ts"), "utf8");

test("Firefly only receives a scoped retention side effect after API-key policy", () => {
  const auth = route.indexOf("const policy = await enforceApiKeyPolicy(request, fullModel)");
  const capture = route.indexOf("const artifactCapture = resolveOrderForgeImageArtifactCapture");
  const fireflyDispatch = route.indexOf('if (providerConfig?.format === "adobe-firefly-image")', capture);
  assert.ok(auth >= 0 && auth < capture && capture < fireflyDispatch);
  assert.match(route, /onSuccessfulResult: \(data\) => retainImageEditSuccess\(data, artifactCapture\)/);
  assert.match(route, /apiKeyScopes:\s*policy\.apiKeyInfo\?\.scopes/);
});

test("Firefly callback runs only after successful image edit, preserving original JSON", () => {
  assert.match(firefly, /onSuccessfulResult\?: \(data: unknown\) => void/);
  assert.match(firefly, /if \(\(result as \{ success\?: boolean \}\)\.success\) \{\s*await clearRecoveredProviderState\(credentials\);\s*onSuccessfulResult\?\.\(\(result as \{ data\?: unknown \}\)\.data\);\s*return jsonResponse\(\(result as \{ data\?: unknown \}\)\.data\)/);
  const callbackPosition = firefly.indexOf("onSuccessfulResult?.(");
  const errorPosition = firefly.indexOf("toJsonErrorPayload", callbackPosition);
  assert.ok(errorPosition > callbackPosition);
});

test("optional persistence errors are contained without double-serializing success", () => {
  assert.match(route, /function retainImageEditSuccess\(/);
  assert.match(route, /if \(!capture\) return;/);
  assert.match(route, /catch \{\s*log\.warn\("IMAGE", "Optional scoped image-edit artifact retention failed"\)/);
  assert.match(route, /function imageEditSuccessResponse\([\s\S]*?retainImageEditSuccess\(data, capture\);\s*return jsonResponse\(data, 200, quotaHeaders\)/);
  assert.match(route, /return imageEditSuccessResponse\(result\.data, artifactCapture, quotaHeaders\)/);
  assert.match(route, /attachCodexImageQuotaHeaders\(\s*quotaHeaders,/);
});
