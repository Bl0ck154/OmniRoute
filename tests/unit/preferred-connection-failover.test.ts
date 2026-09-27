import test from "node:test";
import assert from "node:assert/strict";

import {
  ANTIGRAVITY_PREFERRED_FAILOVER_START_TIMEOUT_MS,
  resolvePreferredConnectionUpstreamStartTimeoutMs,
} from "../../src/sse/services/preferredConnectionFailover.ts";

test("Antigravity preferred account with a sibling gets a bounded start timeout", () => {
  assert.equal(
    resolvePreferredConnectionUpstreamStartTimeoutMs("antigravity", {
      selectedByApiKeyPreference: true,
      preferredFallbackAvailable: true,
    }),
    ANTIGRAVITY_PREFERRED_FAILOVER_START_TIMEOUT_MS
  );
});

test("preferred failover cap never lengthens a stricter trusted request hint", () => {
  assert.equal(
    resolvePreferredConnectionUpstreamStartTimeoutMs(
      "antigravity",
      { selectedByApiKeyPreference: true, preferredFallbackAvailable: true },
      3_000
    ),
    3_000
  );
});

test("no preferred sibling means no implicit start timeout", () => {
  assert.equal(
    resolvePreferredConnectionUpstreamStartTimeoutMs("antigravity", {
      selectedByApiKeyPreference: true,
      preferredFallbackAvailable: false,
    }),
    undefined
  );
  assert.equal(
    resolvePreferredConnectionUpstreamStartTimeoutMs(
      "codex",
      { selectedByApiKeyPreference: true, preferredFallbackAvailable: true },
      4_000
    ),
    4_000
  );
});
