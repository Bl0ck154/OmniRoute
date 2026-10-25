import test from "node:test";
import assert from "node:assert/strict";
import { createChatPipelineHarness } from "./_chatPipelineHarness.ts";

const harness = await createChatPipelineHarness("antigravity-resilience-routing");
const { buildRequest, handleChat, settingsDb, resetStorage } = harness;
const providers = await import("../../src/lib/db/providers.ts");
const auth = await import("../../src/sse/services/auth.ts");
const { antigravityHealth } = await import("../../open-sse/services/antigravityHealth.ts");
const { seedAntigravityIdeVersionCache, clearAntigravityVersionCaches } = await import("../../open-sse/services/antigravityVersion.ts");
const MODEL = "gemini-3.8-flash-tiered";
const TIMEOUT_CODE = "ANTIGRAVITY_PRE_RESPONSE_TIMEOUT";

test.beforeEach(async () => {
  await resetStorage();
  seedAntigravityIdeVersionCache("2.1.1");
  await settingsDb.updateSettings({
    requestRetry: 0,
    resilienceSettings: { antigravity: { adaptiveHealthEnabled: true }, waitForCooldown: { enabled: false } },
  });
});
test.afterEach(() => clearAntigravityVersionCaches());
test.after(async () => harness.cleanup());

async function seed(priority: number) {
  return providers.createProviderConnection({
    provider: "antigravity", authType: "oauth", name: `fixture-${priority}`,
    accessToken: `fixture-token-${priority}`, refreshToken: `fixture-refresh-${priority}`,
    projectId: "fixture-project", expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    isActive: true, testStatus: "active", priority,
  });
}
function request(headers: Record<string, string> = {}) {
  return buildRequest({ headers, body: {
    model: `antigravity/${MODEL}`, stream: false,
    messages: [{ role: "user", content: `fixture-${crypto.randomUUID()}` }],
  } });
}
function success() {
  return new Response('data: {"response":{"candidates":[{"content":{"role":"model","parts":[{"text":"fixture success"}]},"finishReason":"STOP"}],"usageMetadata":{"promptTokenCount":4,"candidatesTokenCount":2,"totalTokenCount":6}}}\n\n', {
    headers: { "content-type": "text/event-stream" },
  });
}
function confirmedTimeout(): never {
  throw Object.assign(new Error("fixture header timeout"), { name: "TimeoutError", code: TIMEOUT_CODE });
}
function quarantine(id: string) {
  for (let i = 0; i < 8; i++) antigravityHealth.begin(id, MODEL)!.finish("timeout");
}

test("confirmed pre-response 504 sends once on first account then immediately serves a distinct sibling", async () => {
  const first = await seed(1);
  const second = await seed(2);
  const sends: string[] = [];
  globalThis.fetch = async (_input, init) => {
    const token = new Headers(init?.headers).get("authorization") || "";
    sends.push(token);
    if (token.endsWith("fixture-token-1")) confirmedTimeout();
    return success();
  };
  const response = await handleChat(request());
  assert.equal(response.status, 200);
  await response.text();
  assert.deepEqual(sends, ["Bearer fixture-token-1", "Bearer fixture-token-2"]);
  assert.equal(response.headers.get("X-OmniRoute-Selected-Connection-Id"), second.id);
  assert.equal(response.headers.get("X-OmniRoute-Same-Account-Retries"), null);
  assert.equal(antigravityHealth.snapshot(first.id)[0].timeouts, 1);
  const stored = await providers.getProviderConnectionById(first.id);
  assert.equal(stored?.rateLimitedUntil ?? null, null, "model health must not cool the whole connection");
});

test("exhausted pool cannot revisit either timed-out account via outer cooldown retry", async () => {
  await seed(1);
  await seed(2);
  await settingsDb.updateSettings({ requestRetry: 3, resilienceSettings: {
    antigravity: { adaptiveHealthEnabled: true },
    waitForCooldown: { enabled: true, maxRetries: 3, maxRetryWaitSec: 1, budgetMs: 3000 },
  } });
  let sends = 0;
  globalThis.fetch = async () => { sends++; return confirmedTimeout(); };
  const response = await handleChat(request());
  assert.equal(response.status, 504);
  assert.equal(sends, 2);
});

test("explicit connection pin surfaces original 504 and never rotates", async () => {
  const first = await seed(1);
  await seed(2);
  let sends = 0;
  globalThis.fetch = async () => { sends++; return confirmedTimeout(); };
  const response = await handleChat(request({ "x-omniroute-connection": first.id }));
  assert.equal(response.status, 504);
  const failure = await response.json();
  assert.equal(failure?.error?.code, TIMEOUT_CODE, "public timeout identifier stays from the sanitized safe code vocabulary");
  assert.equal(antigravityHealth.snapshot(first.id)[0].timeouts, 1, "private timeout marker survives non-streaming dispatch for quarantine");
  assert.equal(sends, 1);
});

test("quarantine is model scoped, quota/allowlist constrained, with all-quarantined fallback", async () => {
  const first = await seed(1);
  const second = await seed(2);
  quarantine(first.id);
  const selected = await auth.getProviderCredentials("antigravity", null, null, MODEL);
  assert.equal(selected?.connectionId, second.id);
  const otherModel = await auth.getProviderCredentials("antigravity", null, [first.id], "gemini-3.8-flash-low");
  assert.equal(otherModel?.connectionId, first.id);
  quarantine(second.id);
  const escape = await auth.getProviderCredentials("antigravity", null, [second.id], MODEL);
  assert.equal(escape?.connectionId, second.id);
  assert.equal(escape?.antigravityHealthFallback, true);
  await providers.updateProviderConnection(second.id, { rateLimitedUntil: new Date(Date.now() + 60000).toISOString() });
  const quotaBlocked = await auth.getProviderCredentials("antigravity", null, [second.id], MODEL);
  assert.equal(quotaBlocked?.connectionId, undefined, "health escape cannot override connection cooldown");
});

test("499 never counts as a fault or triggers sibling rotation or persistent cooldown", async () => {
  const first = await seed(1);
  await seed(2);
  let sends = 0;
  globalThis.fetch = async () => { sends++; throw new DOMException("fixture client abort", "AbortError"); };
  const response = await handleChat(request());
  assert.equal(response.status, 499);
  assert.equal(sends, 1);
  assert.equal(antigravityHealth.snapshot(first.id)[0].samples, 0);
  assert.equal(antigravityHealth.snapshot(first.id)[0].inflight, 0);
  assert.equal(((await providers.getProviderConnectionById(first.id))?.rateLimitedUntil ?? null), null);
});
