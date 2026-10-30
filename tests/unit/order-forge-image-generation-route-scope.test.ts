import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

/** Source guard complements the sink's runtime access-control tests: retention
 * must be authorized by the API-key policy, not just a caller-controlled header. */
const source = fs.readFileSync(
  path.resolve(process.cwd(), "src/app/api/v1/images/generations/route.ts"),
  "utf8"
);

test("optional image retention is gated by authenticated principal and success", () => {
  const auth = source.indexOf("await enforceClientApiRouteAuth(request)");
  const policy = source.indexOf("await enforceApiKeyPolicy(request, body.model)");
  const keyScope = source.indexOf("await resolveKeyConnectionScope(policy.apiKeyInfo)");
  const capture = source.indexOf("const artifactCapture = resolveOrderForgeImageArtifactCapture");
  const success = source.indexOf("if (result.success) {");
  const comboPersisted = source.indexOf("persistOrderForgeImageArtifacts({", capture);
  const directPersisted = source.indexOf("persistOrderForgeImageArtifacts({", success);
  assert.ok(auth >= 0 && auth < policy);
  assert.ok(policy < keyScope && keyScope < capture);
  assert.ok(comboPersisted > capture && comboPersisted < success, "combo hook is authorized first");
  assert.ok(success > capture && directPersisted > success, "direct success hook is authorized first");
  assert.match(source, /apiKeyScopes:\s*policy\.apiKeyInfo\?\.scopes/);
  assert.match(source, /headers:\s*request\.headers/);
  assert.match(source, /catch \{[\s\S]*?Optional image artifact retention failed/);
});
