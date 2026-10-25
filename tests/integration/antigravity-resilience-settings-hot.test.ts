import test from "node:test";
import assert from "node:assert/strict";
import { makeManagementSessionRequest } from "../helpers/managementSession.ts";
import { getDbInstance, resetDbInstance } from "../../src/lib/db/core.ts";
import {
  getSettings, getSettingsRevision, updateSettings,
} from "../../src/lib/db/settings.ts";
import { invalidateDbCache } from "../../src/lib/db/readCache.ts";
import { createAccessToken } from "../../src/lib/db/accessTokens.ts";
import { resolveAntigravitySettings } from "../../src/lib/resilience/antigravitySettings.ts";
import { GET, PATCH } from "../../src/app/api/resilience/route.ts";

const url = "http://localhost/api/resilience";

test.beforeEach(() => {
  getDbInstance().prepare("DELETE FROM key_value WHERE namespace = 'settings'").run();
  invalidateDbCache();
});
test.after(() => resetDbInstance());

const patch = async (antigravity: Record<string, unknown>) =>
  PATCH(await makeManagementSessionRequest(url, { method: "PATCH", body: { antigravity } }));

test("hot settings persist with defaults off and support a partial update", async () => {
  const before = resolveAntigravitySettings(await getSettings());
  assert.equal(before.adaptiveHealthEnabled, false);
  assert.equal(before.timingTelemetryEnabled, false);
  assert.equal(before.gemini38PreferredTimeoutMs, 12_000);
  assert.equal((await patch({ preferredTimeoutMs: 7_000, gemini38PreferredTimeoutMs: 19_000 })).status, 200);
  const after = resolveAntigravitySettings(await getSettings());
  assert.equal(after.preferredTimeoutMs, 7_000);
  assert.equal(after.gemini38PreferredTimeoutMs, 19_000);
  assert.equal(after.adaptiveHealthEnabled, false);
  assert.equal((await patch({ adaptiveHealthEnabled: true })).status, 200);
  assert.equal(resolveAntigravitySettings(await getSettings()).adaptiveHealthEnabled, true);
  const response = await GET(await makeManagementSessionRequest(url));
  assert.equal(response.status, 200);
  assert.equal((await response.json()).antigravity.gemini38PreferredTimeoutMs, 19_000);
  resetDbInstance();
  invalidateDbCache();
  assert.equal(resolveAntigravitySettings(await getSettings()).adaptiveHealthEnabled, true);
});

test("strict validation rejects malformed settings atomically", async () => {
  const beforeRevision = await getSettingsRevision();
  for (const invalid of [499, 120_001, 12.5, "5000", null]) {
    const response = await patch({ preferredTimeoutMs: 8_000, gemini38PreferredTimeoutMs: invalid });
    assert.equal(response.status, 400);
    assert.equal(await getSettingsRevision(), beforeRevision);
    assert.equal(resolveAntigravitySettings(await getSettings()).preferredTimeoutMs, 5_000);
  }
  assert.equal((await patch({ preferredTimeoutMs: 500, gemini38PreferredTimeoutMs: 120_000 })).status, 200);
  assert.equal((await patch({ unknownKnob: 10 })).status, 400);
});

test("management-only access remains required when login is disabled", async () => {
  await updateSettings({ requireLogin: false });
  const anonymous = await PATCH(new Request(url, {
    method: "PATCH", body: JSON.stringify({ antigravity: { timingTelemetryEnabled: true } }),
    headers: { "content-type": "application/json" },
  }));
  assert.equal(anonymous.status, 401);
  const anonymousRead = await GET(new Request(url));
  assert.equal(anonymousRead.status, 401);
  const token = createAccessToken({ name: "write-only-fixture", scope: "write" });
  const denied = await PATCH(new Request(url, {
    method: "PATCH", body: JSON.stringify({ antigravity: { adaptiveHealthEnabled: true } }),
    headers: { authorization: `Bearer ${token.secret}`, "content-type": "application/json" },
  }));
  assert.equal(denied.status, 403);
  assert.equal(resolveAntigravitySettings(await getSettings()).adaptiveHealthEnabled, false);
});
