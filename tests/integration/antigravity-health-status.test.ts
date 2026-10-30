import test from "node:test";
import assert from "node:assert/strict";
import { NextRequest } from "next/server";
import { createChatPipelineHarness } from "./_chatPipelineHarness.ts";
import { createManagementSessionHeaders } from "../helpers/managementSession.ts";

const harness = await createChatPipelineHarness("antigravity-health-status");
const { resetStorage } = harness;
const providers = await import("../../src/lib/db/providers.ts");
const { antigravityHealth } = await import("../../open-sse/services/antigravityHealth.ts");
const { GET } = await import("../../src/app/api/resilience/connections/route.ts");

test.beforeEach(async () => { await resetStorage(); });
test.after(async () => harness.cleanup());

test("health endpoint returns bounded structured quarantine data, not provider secrets", async () => {
  const connection = await providers.createProviderConnection({
    provider: "antigravity", authType: "oauth", name: "status-fixture",
    accessToken: "secret-token-test", refreshToken: "secret-refresh-test",
    projectId: "secret-project-test",
    expiresAt: new Date(Date.now() + 3_600_000).toISOString(),
    isActive: true, testStatus: "active", priority: 1,
  });
  for (let i = 0; i < 8; i++) {
    antigravityHealth.begin(connection.id, "gemini-3.8-flash-high")!.finish("timeout");
  }

  const response = await GET(new NextRequest("http://localhost/api/resilience/connections?provider=antigravity", {
    headers: await createManagementSessionHeaders(),
  }));
  assert.equal(response.status, 200);
  const body = await response.json();
  const account = body.connections.find((entry: { id: string }) => entry.id === connection.id);
  assert.ok(account, "authorized admin can view the selected connection");
  const health = account.antigravityHealth[0];
  assert.equal(health.model, "gemini-3.8-flash-high");
  assert.equal(health.state, "quarantined");
  assert.equal(health.reason, "pre_response_timeout_rate");
  assert.equal(health.samples, 8);
  assert.equal(health.timeouts, 8);
  assert.ok(health.cooldownRemainingMs > 0);

  const serialized = JSON.stringify(body);
  for (const secret of [
    "secret-token-test", "secret-refresh-test", "secret-project-test",
    "Authorization", "accessToken", "refreshToken", "providerSpecificData",
  ]) {
    assert.ok(!serialized.includes(secret), `found sensitive field: ${secret}`);
  }
});

test("anonymous user cannot inspect operator-only health status", async () => {
  const response = await GET(new NextRequest("http://localhost/api/resilience/connections"));
  assert.equal(response.status, 401);
});
