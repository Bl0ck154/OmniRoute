import test from "node:test";
import assert from "node:assert/strict";
import { makeManagementSessionRequest } from "../helpers/managementSession.ts";
import { getDbInstance, resetDbInstance } from "../../src/lib/db/core.ts";
import { getSettings, getSettingsRevision, updateSettings, SettingsRevisionConflictError } from "../../src/lib/db/settings.ts";
import { invalidateDbCache } from "../../src/lib/db/readCache.ts";
import { createAccessToken } from "../../src/lib/db/accessTokens.ts";
import { resolveAntigravitySettings } from "../../src/lib/resilience/antigravitySettings.ts";
import { resolvePreferredConnectionUpstreamStartTimeoutMs } from "../../src/sse/services/preferredConnectionFailover.ts";
import { GET, PATCH } from "../../src/app/api/resilience/route.ts";

const url = "http://localhost/api/resilience";
const preferred = { selectedByApiKeyPreference: true, preferredFallbackAvailable: true };
test.beforeEach(() => {
  getDbInstance().prepare("DELETE FROM key_value WHERE namespace = 'settings'").run();
  invalidateDbCache();
});
test.after(() => resetDbInstance());

async function patch(antigravity: Record<string, unknown>) {
  return PATCH(await makeManagementSessionRequest(url, { method: "PATCH", body: { antigravity } }));
}

test("hot persisted timeout updates affect new request snapshots without a restart", async () => {
  const before = resolveAntigravitySettings(await getSettings());
  assert.equal(resolvePreferredConnectionUpstreamStartTimeoutMs("agy", preferred, undefined, "gemini-3.8-flash", before), 12000);
  assert.equal((await patch({ preferredTimeoutMs: 7000, gemini38PreferredTimeoutMs: 19000 })).status, 200);
  const after = resolveAntigravitySettings(await getSettings());
  assert.equal(resolvePreferredConnectionUpstreamStartTimeoutMs("agy", preferred, undefined, "gemini-3.8-flash-high", after), 19000);
  assert.equal(resolvePreferredConnectionUpstreamStartTimeoutMs("agy", preferred, undefined, "claude-sonnet-4-6", after), 7000);
  assert.equal(resolvePreferredConnectionUpstreamStartTimeoutMs("agy", preferred, 1000, "gemini-3.8-flash-low", after), 1000);
  assert.equal(before.gemini38PreferredTimeoutMs, 12000, "in-flight request snapshot remains stable");
  const response = await GET(await makeManagementSessionRequest(url));
  assert.equal((await response.json()).antigravity.gemini38PreferredTimeoutMs, 19000);
  resetDbInstance();
  invalidateDbCache();
  assert.equal(resolveAntigravitySettings(await getSettings()).gemini38PreferredTimeoutMs, 19000, "persists across DB reopen");
});

test("all fields validate before the atomic write; invalid paired values cannot partially persist", async () => {
  const before = await getSettingsRevision();
  for (const value of [499, 120001, 12.5, "5000", null]) {
    const response = await patch({ preferredTimeoutMs: 8000, gemini38PreferredTimeoutMs: value });
    assert.equal(response.status, 400);
    assert.equal(await getSettingsRevision(), before);
    assert.equal(resolveAntigravitySettings(await getSettings()).preferredTimeoutMs, 5000);
  }
  assert.equal((await patch({ preferredTimeoutMs: 500, gemini38PreferredTimeoutMs: 120000 })).status, 200);
  assert.equal((await patch({ unknownKnob: 10 })).status, 400);
});

test("mutation requires admin-grade credentials even when login is disabled", async () => {
  await updateSettings({ requireLogin: false });
  const anonymous = await PATCH(new Request(url, {
    method: "PATCH", body: JSON.stringify({ antigravity: { preferredTimeoutMs: 8000 } }),
    headers: { "content-type": "application/json" },
  }));
  assert.equal(anonymous.status, 401);
  const token = createAccessToken({ name: "write-only-fixture", scope: "write" });
  const denied = await PATCH(new Request(url, {
    method: "PATCH", body: JSON.stringify({ antigravity: { preferredTimeoutMs: 8000 } }),
    headers: { authorization: `Bearer ${token.secret}`, "content-type": "application/json" },
  }));
  assert.equal(denied.status, 403);
  assert.equal(resolveAntigravitySettings(await getSettings()).preferredTimeoutMs, 5000);
  assert.equal(JSON.stringify(await denied.json()).includes("at /"), false);
});

test("revision conflict preserves the newer complete settings row", async () => {
  const revision = await getSettingsRevision();
  await updateSettings({ resilienceSettings: { antigravity: { preferredTimeoutMs: 9000 } } });
  await assert.rejects(updateSettings({ resilienceSettings: { antigravity: { preferredTimeoutMs: 6000 } } }, {
    expectedRevision: revision,
  }), SettingsRevisionConflictError);
  assert.equal(resolveAntigravitySettings(await getSettings()).preferredTimeoutMs, 9000);
});

test("partial updates preserve other timeout and gate values", async () => {
  assert.equal((await patch({ preferredTimeoutMs: 6000, adaptiveHealthEnabled: true })).status, 200);
  assert.equal((await patch({ timingTelemetryEnabled: true })).status, 200);
  const settings = resolveAntigravitySettings(await getSettings());
  assert.deepEqual(settings, {
    preferredTimeoutMs: 6000, gemini38PreferredTimeoutMs: 12000,
    adaptiveHealthEnabled: true, timingTelemetryEnabled: true,
  });
});
