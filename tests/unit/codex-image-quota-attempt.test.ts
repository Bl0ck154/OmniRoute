import assert from "node:assert/strict";
import test from "node:test";
import {
  withCodexImageQuotaAttempt,
  mergeCodexImageQuotaSamples,
} from "../../src/lib/images/codexImageQuotaAttempt.ts";
import { attachCodexImageQuotaHeaders } from "../../src/lib/images/codexImageQuotaTelemetry.ts";

const before = { window5h: { percentUsed: 0.1, resetAt: "2026-10-25T12:00:00Z" } };
const after = { window5h: { percentUsed: 0.115, resetAt: "2026-10-25T12:00:00Z" } };

test("disabled by default, does not make any quota request or alter image dispatch", async () => {
  let attempts = 0;
  let quotaCalls = 0;
  const result = await withCodexImageQuotaAttempt({
    provider: "codex", connectionId: "A", requestedModel: "gpt-image-2",
    enabled: false,
    fetchQuota: async () => { quotaCalls++; return before; },
    execute: async () => { attempts++; return { success: true, data: "ok" }; },
  });
  assert.equal(attempts, 1);
  assert.equal(quotaCalls, 0);
  assert.deepEqual(result, { success: true, data: "ok" });
});

test("enabled samples exact serving account without retrying inference or mixing accounts", async () => {
  let dispatched = 0;
  const seen: string[] = [];
  const result = await withCodexImageQuotaAttempt({
    provider: "codex", connectionId: "winner-B", requestedModel: "gpt-image-2",
    credentials: { accessToken: "private-fixture" }, enabled: true,
    fetchQuota: async (id, ctx) => {
      seen.push(id);
      assert.equal(ctx.accessToken, "private-fixture");
      return seen.length === 1 ? before : after;
    },
    execute: async () => { dispatched++; return { success: true, data: { data: [1] } }; },
  });
  assert.equal(dispatched, 1);
  assert.deepEqual(seen, ["winner-B", "winner-B"]);
  const h = new Headers();
  attachCodexImageQuotaHeaders(h, result.telemetry?.codexQuota);
  assert.equal(h.get("x-omniroute-codex-connection-id"), "winner-B");
  assert.equal(h.get("x-omniroute-codex-5h-before-remaining"), "90");
  assert.equal(h.get("x-omniroute-codex-5h-after-remaining"), "88.5");
  assert.equal(h.get("x-omniroute-codex-5h-delta-used"), "1.5");
});

test("quota fetch failure never replays image or destroys response", async () => {
  let attempts = 0;
  const result = await withCodexImageQuotaAttempt({
    provider: "codex", connectionId: "B", requestedModel: "gpt-image-2", enabled: true,
    fetchQuota: async () => { throw new Error("fixture quota outage"); },
    execute: async () => { attempts++; return { success: true, data: "original" }; },
  });
  assert.equal(attempts, 1);
  assert.equal(result.data, "original");
  assert.equal(result.telemetry, undefined);
});

test("no delta if 5-hour boundary rolled over or either window unverified", () => {
  for (const lhs of [
    { window5h: { percentUsed: 0.96, resetAt: "2026-10-25T12:00:00Z" } },
    { window5h: { percentUsed: 0.96, resetAt: null } },
  ]) {
    const t = mergeCodexImageQuotaSamples(
      "B", lhs, { window5h: { percentUsed: 0.01, resetAt: "2026-10-25T17:00:00Z" } },
      "2026-10-25T12:01:00Z"
    );
    const h = new Headers();
    attachCodexImageQuotaHeaders(h, t);
    assert.equal(h.get("x-omniroute-codex-5h-delta-used"), null);
  }
});

test("non-Codex providers and failed Codex image attempts never sample post-quota", async () => {
  let calls = 0;
  for (const provider of ["gemini", "antigravity", "codex"]) {
    const r = await withCodexImageQuotaAttempt({
      provider, connectionId: "A", requestedModel: "image", enabled: true,
      fetchQuota: async () => { calls++; return before; },
      execute: async () => ({ success: false, status: 502 }),
    });
    assert.equal(r.success, false);
  }
  assert.equal(calls, 1, "only Codex pre-attempt quota was sampled");
});
