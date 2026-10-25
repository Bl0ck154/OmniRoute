import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const route = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/api/v1/images/edits/route.ts"),
  "utf8"
);

test("combo edit capture is keyed to an authenticated, policy-approved API key", () => {
  const policy = route.indexOf("const comboPolicy = await enforceApiKeyPolicy(request, fullModel)");
  const rejection = route.indexOf("if (comboPolicy.rejection) return comboPolicy.rejection", policy);
  const capture = route.indexOf("const comboArtifactCapture = resolveOrderForgeImageArtifactCapture", rejection);
  assert.ok(policy >= 0 && policy < rejection && rejection < capture);
  assert.match(route, /apiKeyScopes:\s*comboPolicy\.apiKeyInfo\?\.scopes/);
  assert.match(route, /artifactCapture:\s*comboArtifactCapture/);
  assert.match(route, /return imageEditSuccessResponse\(run\.data, ctx\.artifactCapture\)/);
});

test("single-model capture happens only after authorization and on successful edits", () => {
  const policy = route.indexOf("const policy = await enforceApiKeyPolicy(request, fullModel)");
  const reject = route.indexOf("if (policy.rejection) return policy.rejection", policy);
  const capture = route.indexOf("const artifactCapture = resolveOrderForgeImageArtifactCapture", reject);
  assert.ok(policy >= 0 && policy < reject && reject < capture);
  assert.match(route, /apiKeyScopes:\s*policy\.apiKeyInfo\?\.scopes/);
  assert.equal((route.match(/imageEditSuccessResponse\((?:result\.data|\(result as any\)\.data), artifactCapture\)/g) ?? []).length, 5);
  assert.match(route, /return imageEditSuccessResponse\(\(result as \{ data\?: unknown \}\)\.data, artifactCapture\)/);
  assert.match(route, /catch \{\s*log\.warn\("IMAGE", "Optional scoped image-edit artifact retention failed"\)/);
});
