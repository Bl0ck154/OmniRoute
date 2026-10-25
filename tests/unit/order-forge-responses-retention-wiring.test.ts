import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const source = (name: string) =>
  fs.readFileSync(path.resolve(process.cwd(), "open-sse/handlers/chatCore", name), "utf8");
const nonstream = source("nonStreamingResponse.ts");
const streaming = source("streamingTail.ts");

test("nonstream captures only successful normalized Responses output for the authenticated principal", () => {
  const check = nonstream.indexOf("if (isResponsesEndpoint) {");
  const capture = nonstream.indexOf("const artifactCapture = resolveOrderForgeImageArtifactCapture", check);
  const persist = nonstream.indexOf("persistOrderForgeImageArtifacts({", capture);
  const returned = nonstream.indexOf("return {\n      response: {\n        success: true", persist);
  assert.ok(check >= 0 && check < capture && capture < persist && persist < returned);
  assert.match(nonstream, /apiKeyScopes: apiKeyInfo\?\.scopes/);
  assert.match(nonstream, /headers: clientRawRequest\?\.headers/);
  assert.match(nonstream, /responseBody: translatedResponse/);
  assert.match(nonstream, /Optional Responses image retention failed/);
});

test("streamed Responses capture requires final successful completion, not a 200 header", () => {
  assert.match(streaming, /const orderForgeImageArtifactCapture = isResponsesEndpoint\s*\?/);
  assert.match(streaming, /apiKeyScopes: apiKeyInfo\?\.scopes/);
  assert.match(streaming, /normalizedStreamStatus === 200 &&\s*!streamError &&\s*!streamErrorCode &&\s*_streamInterrupted !== true/);
  assert.match(streaming, /responseBody: clientPayload \?\? streamResponseBody \?\? providerPayload/);
  const persist = streaming.indexOf("persistOrderForgeImageArtifacts({");
  const firstReturn = streaming.indexOf("const onStreamComplete =", 0);
  assert.ok(persist > firstReturn);
});

test("stream tee drains a separate branch without changing client-facing stream", () => {
  assert.match(streaming, /if \(orderForgeImageArtifactCapture\) \{[\s\S]*?finalStream\.tee\(\)/);
  assert.match(streaming, /clientStream = downstreamStream;/);
  assert.match(streaming, /drainOrderForgeImageArtifactStream\(artifactStream\)/);
  assert.match(streaming, /wrapReadableStreamWithFinalize\(clientStream, releaseTurnExecution\)/);
  assert.ok(!streaming.includes("log?.error?.(\n          \"ETSY_IMAGE_ARTIFACT\""));
});
