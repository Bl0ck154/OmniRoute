import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test, { afterEach } from "node:test";

import {
  cleanupOrderForgeImageArtifacts,
  drainOrderForgeImageArtifactStream,
  persistOrderForgeImageArtifacts,
  resolveOrderForgeImageArtifactCapture,
} from "../../src/lib/usage/orderForgeImageArtifactSink";

const ENV_KEYS = ["OMNIROUTE_ETSY_IMAGE_ARTIFACT_DIR"] as const;
const previousEnv = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
const tempDirs: string[] = [];

afterEach(() => {
  for (const key of ENV_KEYS) {
    const previous = previousEnv[key];
    if (previous === undefined) delete process.env[key];
    else process.env[key] = previous;
  }
  while (tempDirs.length > 0) {
    fs.rmSync(tempDirs.pop()!, { recursive: true, force: true });
  }
});

function tempDir(): string {
  const value = fs.mkdtempSync(path.join(os.tmpdir(), "omniroute-image-artifact-"));
  tempDirs.push(value);
  return value;
}

function enableSink(baseDir = tempDir()): string {
  process.env.OMNIROUTE_ETSY_IMAGE_ARTIFACT_DIR = baseDir;
  return baseDir;
}

function eligible(overrides: Record<string, unknown> = {}) {
  return resolveOrderForgeImageArtifactCapture({
    apiKeyScopes: ["image_artifact_retention"],
    provider: "codex",
    model: "gpt-5.6-terra-medium",
    endpoint: "/api/v1/responses",
    requestBody: { tools: [{ type: "image_generation", action: "edit" }] },
    headers: new Headers({ "X-EtsyTrello-Artifact-Id": "card-123:composition-1:variant-2" }),
    correlationId: "corr-123",
    ...overrides,
  });
}

test("artifact capture depends only on the Order Forge principal and stable artifact id", () => {
  enableSink();
  assert.deepEqual(eligible(), {
    artifactId: "card-123:composition-1:variant-2",
    correlationId: "corr-123",
  });
  assert.equal(eligible({ apiKeyScopes: [] }), null);
  assert.equal(eligible({ apiKeyScopes: ["manage"] }), null);
  assert.deepEqual(
    eligible({
      provider: "future-provider",
      model: "brand-new-model",
      endpoint: "/v42/future/image/path",
      requestBody: { completely: "different" },
    }),
    {
      artifactId: "card-123:composition-1:variant-2",
      correlationId: "corr-123",
    }
  );
  assert.equal(eligible({ headers: new Headers({ "X-EtsyTrello-Artifact-Id": "../bad" }) }), null);
  assert.equal(eligible({ headers: new Headers() }), null);

});

test("validated image output is written atomically with metadata but no payload or prompt", () => {
  const baseDir = enableSink();
  const capture = eligible();
  assert.ok(capture);
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3]);
  const encoded = png.toString("base64");

  const stored = persistOrderForgeImageArtifacts({
    capture,
    baseDir,
    now: Date.UTC(2026, 7, 9, 18, 0, 0),
    responseBody: {
      id: "resp_123",
      output: [
        { type: "reasoning", summary: [] },
        {
          id: "ig_123",
          type: "image_generation_call",
          result: encoded,
          revised_prompt: "private customer prompt",
        },
      ],
    },
  });

  assert.equal(stored.length, 1);
  assert.deepEqual(fs.readFileSync(stored[0].path), png);
  assert.equal(fs.statSync(stored[0].path).mode & 0o777, 0o600);
  const metadataPath = path.join(path.dirname(stored[0].path), "metadata.json");
  const metadataText = fs.readFileSync(metadataPath, "utf8");
  const metadata = JSON.parse(metadataText);
  assert.equal(metadata.artifactId, "card-123:composition-1:variant-2");
  assert.equal(metadata.images[0].sizeBytes, png.length);
  assert.equal(metadataText.includes(encoded), false);
  assert.equal(metadataText.includes("private customer prompt"), false);
  assert.equal(fs.statSync(metadataPath).mode & 0o777, 0o600);
  assert.deepEqual(
    fs.readdirSync(path.dirname(stored[0].path)).filter((name) => name.endsWith(".tmp")),
    []
  );
});

test("OpenAI-style image payloads are retained without provider or route knowledge", () => {
  const baseDir = enableSink();
  const capture = eligible({ provider: "future-provider", model: "future-model", endpoint: "/future" });
  assert.ok(capture);
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 9, 8, 7]);
  const encoded = png.toString("base64");
  const stored = persistOrderForgeImageArtifacts({
    capture,
    baseDir,
    responseBody: { created: 123, data: [{ b64_json: encoded }] },
  });
  assert.equal(stored.length, 1);
  assert.deepEqual(fs.readFileSync(stored[0].path), png);
  assert.equal(stored[0].artifactId, "card-123:composition-1:variant-2");
});

test("data-URL image payloads are retained too", () => {
  const baseDir = enableSink();
  const capture = eligible();
  assert.ok(capture);
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 3, 2, 1]);
  const stored = persistOrderForgeImageArtifacts({
    capture,
    baseDir,
    responseBody: { data: [{ url: `data:image/png;base64,${png.toString("base64")}` }] },
  });
  assert.equal(stored.length, 1);
  assert.deepEqual(fs.readFileSync(stored[0].path), png);
});

test("invalid base64, unsupported bytes, and oversized declarations are not stored", () => {
  const baseDir = enableSink();
  const capture = eligible();
  assert.ok(capture);
  const result = persistOrderForgeImageArtifacts({
    capture,
    baseDir,
    responseBody: {
      output: [
        { type: "image_generation_call", result: "not-base64" },
        { type: "image_generation_call", result: Buffer.from("plain text").toString("base64") },
        { type: "message", result: Buffer.from([0x89, 0x50]).toString("base64") },
      ],
    },
  });
  assert.deepEqual(result, []);
});

test("private tee drain finishes after the downstream branch is cancelled", async () => {
  let sent = 0;
  const source = new ReadableStream<Uint8Array>({
    async pull(controller) {
      if (sent === 4) {
        controller.close();
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 2));
      controller.enqueue(Uint8Array.of(++sent));
    },
  });
  const [downstream, privateBranch] = source.tee();
  const drained = drainOrderForgeImageArtifactStream(privateBranch);
  await downstream.cancel("client timeout");
  await drained;
  assert.equal(sent, 4);
});

test("cleanup enforces retention and total byte cap by deleting oldest attempts", () => {
  const baseDir = enableSink();
  const dateDir = path.join(baseDir, "2026-08-09");
  const oldDir = path.join(dateDir, "old");
  const firstDir = path.join(dateDir, "first");
  const secondDir = path.join(dateDir, "second");
  for (const dir of [oldDir, firstDir, secondDir]) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(oldDir, "x.png"), Buffer.alloc(6));
  fs.writeFileSync(path.join(firstDir, "x.png"), Buffer.alloc(6));
  fs.writeFileSync(path.join(secondDir, "x.png"), Buffer.alloc(6));
  fs.utimesSync(path.join(oldDir, "x.png"), new Date(1_000), new Date(1_000));
  fs.utimesSync(path.join(firstDir, "x.png"), new Date(8_000), new Date(8_000));
  fs.utimesSync(path.join(secondDir, "x.png"), new Date(9_000), new Date(9_000));

  const result = cleanupOrderForgeImageArtifacts({
    baseDir,
    now: 10_000,
    retentionMs: 5_000,
    maxStoreBytes: 6,
  });
  assert.equal(result.deletedAttempts, 2);
  assert.equal(result.remainingBytes, 6);
  assert.equal(fs.existsSync(oldDir), false);
  assert.equal(fs.existsSync(firstDir), false);
  assert.equal(fs.existsSync(secondDir), true);
});
