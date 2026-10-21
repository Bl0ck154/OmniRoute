import assert from "node:assert/strict";
import { test } from "node:test";
import {
  ANTIGRAVITY_GEMINI_38_PREFERRED_FAILOVER_START_TIMEOUT_MS,
  ANTIGRAVITY_PREFERRED_FAILOVER_START_TIMEOUT_MS,
  resolvePreferredConnectionUpstreamStartTimeoutMs,
} from "../../src/sse/services/preferredConnectionFailover.ts";

const preferred = { selectedByApiKeyPreference: true, preferredFallbackAvailable: true };

test("Gemini 3.8 Tiered receives 12 seconds to first upstream headers", () => {
  assert.equal(ANTIGRAVITY_GEMINI_38_PREFERRED_FAILOVER_START_TIMEOUT_MS, 12_000);
  assert.equal(resolvePreferredConnectionUpstreamStartTimeoutMs("antigravity", preferred, undefined, "gemini-3.8-flash-tiered"), 12_000);
  assert.equal(resolvePreferredConnectionUpstreamStartTimeoutMs("agy", preferred, undefined, "antigravity/gemini-3.8-flash-tiered"), 12_000);
});

test("other Antigravity models keep five-second failover, including default older callers", () => {
  assert.equal(ANTIGRAVITY_PREFERRED_FAILOVER_START_TIMEOUT_MS, 5_000);
  assert.equal(resolvePreferredConnectionUpstreamStartTimeoutMs("antigravity", preferred, undefined, "gemini-3.5-flash-lite"), 5_000);
  assert.equal(resolvePreferredConnectionUpstreamStartTimeoutMs("antigravity", preferred), 5_000);
});

test("explicitly tighter request deadlines win and nonpreferred providers remain unchanged", () => {
  assert.equal(resolvePreferredConnectionUpstreamStartTimeoutMs("antigravity", preferred, 8_000, "gemini-3.8-flash-tiered"), 8_000);
  assert.equal(resolvePreferredConnectionUpstreamStartTimeoutMs("antigravity", preferred, 3_000, "gemini-3.5-flash-lite"), 3_000);
  assert.equal(resolvePreferredConnectionUpstreamStartTimeoutMs("codex", preferred, undefined, "gemini-3.8-flash-tiered"), undefined);
  assert.equal(resolvePreferredConnectionUpstreamStartTimeoutMs("antigravity", { ...preferred, preferredFallbackAvailable: false }, undefined, "gemini-3.8-flash-tiered"), undefined);
  assert.equal(resolvePreferredConnectionUpstreamStartTimeoutMs("antigravity", { ...preferred, selectedByApiKeyPreference: false }, undefined, "gemini-3.8-flash-tiered"), undefined);
});
