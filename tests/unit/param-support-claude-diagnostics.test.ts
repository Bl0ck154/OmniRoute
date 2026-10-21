import { test } from "node:test";
import assert from "node:assert/strict";

import { stripUnsupportedParams } from "../../open-sse/translator/paramSupport.ts";
import { findOffendingField } from "../../open-sse/config/providerFieldStrips.ts";

// Newer Claude Code clients send a top-level `diagnostics` telemetry object. It is
// gated behind an Anthropic beta OmniRoute does not advertise, so Anthropic answers
// 400 `diagnostics: Extra inputs are not permitted` on every request carrying it.

const ANTHROPIC_DIAGNOSTICS_400 = JSON.stringify({
  type: "error",
  error: {
    type: "invalid_request_error",
    message: "diagnostics: Extra inputs are not permitted",
  },
});

for (const model of ["claude-opus-5", "claude-haiku-4-5-20251001", "claude-sonnet-5"]) {
  test(`stripUnsupportedParams drops Claude Code diagnostics for ${model}`, () => {
    const body: Record<string, unknown> = {
      model,
      max_tokens: 16,
      messages: [{ role: "user", content: "hi" }],
      diagnostics: { client: "cli" },
    };

    stripUnsupportedParams("claude", model, body);

    assert.equal("diagnostics" in body, false, "diagnostics must be removed for Claude models");
    assert.deepEqual(body.messages, [{ role: "user", content: "hi" }]);
    assert.equal(body.max_tokens, 16);
    assert.equal(body.model, model);
  });
}

test("stripUnsupportedParams leaves diagnostics intact for non-Claude models", () => {
  const body: Record<string, unknown> = {
    model: "gpt-5",
    messages: [{ role: "user", content: "hi" }],
    diagnostics: { client: "cli" },
  };

  stripUnsupportedParams("openai", "gpt-5", body);

  assert.deepEqual(body.diagnostics, { client: "cli" });
});

test("findOffendingField recognizes Anthropic's diagnostics extra-input 400", () => {
  assert.equal(findOffendingField(ANTHROPIC_DIAGNOSTICS_400), "diagnostics");
});

// The upstream reactive retry test depends on fieldDowngradeRecovery.ts,
// which is not present in this fork. The observed 400 classification is
// covered here; reintroduce an end-to-end retry test with the fork executor
// only when that executor behavior is explicitly adapted.
