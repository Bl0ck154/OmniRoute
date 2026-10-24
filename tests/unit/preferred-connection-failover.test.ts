import assert from "node:assert/strict";
import test from "node:test";

import {
  getPreferredAntigravityStartTimeoutCapMs as cap,
  DEFAULT_PREFERRED_CONNECTION_TIMEOUT_MS,
  DEFAULT_GEMINI38_PREFERRED_CONNECTION_TIMEOUT_MS,
} from "../../src/sse/services/preferredConnectionFailover.ts";

const preferred = { selectedByApiKeyPreference: true, preferredFallbackAvailable: true };

test("soft preferred connection gets a 12s 3.8 header cap; other models 5s", () => {
  assert.equal(cap("antigravity", preferred, "gemini-3.8-flash-high"), 12000);
  assert.equal(cap("antigravity", preferred, "gemini-3.8-flash-tiered"), 12000);
  assert.equal(cap("agy", preferred, "antigravity/gemini-3.8-flash-low"), 12000);
  assert.equal(cap("antigravity", preferred, "gemini-3.7-flash-low"), 5000);
  assert.equal(DEFAULT_PREFERRED_CONNECTION_TIMEOUT_MS, 5000);
  assert.equal(DEFAULT_GEMINI38_PREFERRED_CONNECTION_TIMEOUT_MS, 12000);
});
test("forced/singleton/unpreferred/non-Antigravity never gets a cap", () => {
  assert.equal(cap("antigravity", { ...preferred, preferredFallbackAvailable: false }, "gemini-3.8-flash-high"), undefined);
  assert.equal(cap("antigravity", { ...preferred, selectedByApiKeyPreference: false }, "gemini-3.8-flash-high"), undefined);
  assert.equal(cap("codex", preferred, "gemini-3.8-flash-high"), undefined);
  assert.equal(cap("gemini", preferred, "gemini-3.8-flash-high"), undefined);
  assert.equal(cap("antigravity", null, "gemini-3.8-flash-high"), undefined);
});
test("hot DB-backed overrides validate bounds and reject malicious strings", () => {
  assert.equal(cap("antigravity", preferred, "gemini-3.8-flash-high", {
    resilienceSettings: { antigravity: { gemini38PreferredTimeoutMs: 17000 } },
  }), 17000);
  assert.equal(cap("antigravity", preferred, "gemini-3.7-flash-low", {
    resilienceSettings: { antigravity: { preferredTimeoutMs: 7000 } },
  }), 7000);
  assert.equal(cap("antigravity", preferred, "gemini-3.8-flash-low", {
    resilienceSettings: { antigravity: { gemini38PreferredTimeoutMs: -1 } },
  }), 12000);
  assert.equal(cap("antigravity", preferred, "gemini-3.8-flash-high", {
    resilienceSettings: { antigravity: { gemini38PreferredTimeoutMs: "900" } },
  }), 12000);
});

test("executor uses preferred header cap without extending a stricter connection timeout", async () => {
  const { executeWithUpstreamStartTimeout } = await import("../../open-sse/handlers/chatCore/upstreamTimeouts.ts");
  let upstreamAborted = false;
  const start = Date.now();
  await assert.rejects(
    () => executeWithUpstreamStartTimeout({
      executor: { getTimeoutMs: () => 30_000 },
      provider: "antigravity",
      model: "gemini-3.8-flash-high",
      connectionTimeoutMs: 55,
      preferredHeaderTimeoutCapMs: 500,
      signal: new AbortController().signal,
      execute: async (signal) => {
        signal.addEventListener("abort", () => { upstreamAborted = true; }, { once: true });
        return new Promise<never>(() => {});
      },
    }),
    (err: unknown) => err instanceof Error && err.name === "TimeoutError",
  );
  assert.equal(upstreamAborted, true);
  assert.ok(Date.now() - start < 2_000);
});

test("preferred timeout caps an otherwise long Antigravity header wait", async () => {
  const { executeWithUpstreamStartTimeout } = await import("../../open-sse/handlers/chatCore/upstreamTimeouts.ts");
  const start = Date.now();
  await assert.rejects(
    () => executeWithUpstreamStartTimeout({
      executor: { getTimeoutMs: () => 30_000 },
      provider: "antigravity",
      model: "gemini-3.8-flash-high",
      preferredHeaderTimeoutCapMs: 500,
      signal: new AbortController().signal,
      execute: async () => new Promise<never>(() => {}),
    }),
    (err: unknown) => err instanceof Error &&
      err.name === "TimeoutError" &&
      (err as Error & { code?: string }).code === "ANTIGRAVITY_PRE_RESPONSE_TIMEOUT",
  );
  assert.ok(Date.now() - start < 3_000);
});
