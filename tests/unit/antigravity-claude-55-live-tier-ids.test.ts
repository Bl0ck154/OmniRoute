// #15691: Google Cloud Code's Claude 5.5 model ID already includes its
// thinking tier. These are *not* synthetic Anthropic reasoning suffixes.
// Connection/live-catalog eligibility is enforced separately by the gateway.
import test from "node:test";
import assert from "node:assert/strict";
import { ANTIGRAVITY_SHARED_MODELS } from "../../open-sse/config/antigravitySharedModels.ts";
import { ANTIGRAVITY_PUBLIC_MODELS, resolveAntigravityModelId } from "../../open-sse/config/antigravityModelAliases.ts";
import { AGY_PUBLIC_MODELS } from "../../open-sse/config/agyModels.ts";
import { applyClaudeEffortVariant } from "../../open-sse/handlers/chatCore/claudeEffortVariant.ts";
import { FORMATS } from "../../open-sse/translator/formats.ts";

for (const family of ["opus", "sonnet"] as const) {
  for (const tier of ["low", "medium", "high"] as const) {
    const model = `claude-${family}-5-5-${tier}`;
    test(`Antigravity + agy advertise literal ${model} only with live eligibility`, () => {
      for (const catalog of [ANTIGRAVITY_SHARED_MODELS, ANTIGRAVITY_PUBLIC_MODELS, AGY_PUBLIC_MODELS]) {
        const found = catalog.find((entry) => entry.id === model);
        assert.ok(found, `${model} missing from surface catalog`);
        assert.equal(found.contextLength, 1048576);
        assert.equal(found.maxOutputTokens, 128000);
      }
      assert.equal(resolveAntigravityModelId(model), model);
    });

    for (const provider of ["antigravity", "agy"]) {
      for (const sourceFormat of [FORMATS.OPENAI, FORMATS.CLAUDE]) {
        test(`${provider}/${sourceFormat}: preserve ${model} without synthetic effort`, () => {
          const body = { model, messages: [] };
          assert.deepEqual(
            applyClaudeEffortVariant({ provider, effectiveModel: model, body, sourceFormat }),
            { effectiveModel: model, log: null }
          );
          assert.deepEqual(body, { model, messages: [] });
        });
      }
    }
  }
}

test("Native Claude API still interprets synthetic effort suffix", () => {
  const body: Record<string, unknown> = { model: "claude-sonnet-5-5-high" };
  const result = applyClaudeEffortVariant({
    provider: "claude",
    effectiveModel: "claude-sonnet-5-5-high",
    body,
    sourceFormat: FORMATS.OPENAI,
  });
  assert.equal(result.effectiveModel, "claude-sonnet-5-5");
  assert.equal(body.model, "claude-sonnet-5-5");
  assert.equal(body.reasoning_effort, "high");
});
