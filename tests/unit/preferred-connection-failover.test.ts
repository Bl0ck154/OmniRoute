import test from "node:test";
import assert from "node:assert/strict";

import {
  ANTIGRAVITY_PREFERRED_FAILOVER_START_TIMEOUT_MS,
  resolvePreferredConnectionUpstreamStartTimeoutMs,
} from "../../src/sse/services/preferredConnectionFailover.ts";
import {
  isRequestScopedUpstreamFailure,
  shouldSkipConnDisable,
} from "../../open-sse/services/combo/comboPredicates.ts";

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

test("Codex token_expired 401 remains connection-scoped despite invalid_request_error envelope", () => {
  const result = {
    status: 401,
    errorCode: "token_expired",
    errorType: "invalid_request_error",
    error: "Provided authentication token is expired. Please try signing in again.",
  };

  assert.equal(
    isRequestScopedUpstreamFailure({ code: result.errorCode, type: result.errorType }),
    false
  );
  assert.equal(
    shouldSkipConnDisable(result, true, false, "codex"),
    false,
    "expired OAuth credentials must enter account fallback so a healthy sibling can be tried"
  );
});

test("structured credential codes override generic invalid_request_error classification", () => {
  for (const code of [
    "token_expired",
    "expired_token",
    "invalid_token",
    "invalid_api_key",
    "authentication_error",
    "unauthorized",
  ]) {
    assert.equal(
      isRequestScopedUpstreamFailure({ code, type: "invalid_request_error" }),
      false,
      `${code} must remain a credential failure`
    );
  }
});

test("ordinary invalid_request_error remains request-scoped", () => {
  assert.equal(
    isRequestScopedUpstreamFailure({ code: "invalid_request", type: "invalid_request_error" }),
    true
  );
  assert.equal(
    shouldSkipConnDisable(
      {
        status: 400,
        errorCode: "invalid_request",
        errorType: "invalid_request_error",
        error: "Malformed request body",
      },
      false,
      false,
      "codex"
    ),
    true
  );
});
