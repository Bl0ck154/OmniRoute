import test from "node:test";
import assert from "node:assert/strict";

import { codexProvider } from "../../open-sse/config/providers/registry/codex/index.ts";
import { openaiProvider } from "../../open-sse/config/providers/registry/openai/index.ts";
import { splitCodexReasoningSuffix } from "../../open-sse/executors/codex/reasoningSuffix.ts";
import { CodexExecutor } from "../../open-sse/executors/codex.ts";
import { CODEX_NATIVE_UNPREFIXED_MODELS } from "../../open-sse/services/model.ts";
import { DEFAULT_CODEX_CLIENT_VERSION } from "../../src/shared/constants/codexClient.ts";
import { CODEX_FAST_TIER_DEFAULT_SUPPORTED_MODELS } from "../../src/lib/providers/codexFastTier.ts";
import {
  enrichCodexModelsFromGithubCatalog,
  type CodexDiscoveryModel,
} from "../../src/app/api/providers/[id]/models/discovery/codex.ts";
import { getPricingForModel } from "../../src/shared/constants/pricing.ts";
import { getModelSpec } from "../../src/shared/constants/modelSpecs.ts";

const BASE = "gpt-6.1-sol";
const LEVELS = ["ultra", "max", "xhigh", "high", "medium", "low"];
const IDS = [BASE, ...LEVELS.map((level) => `${BASE}-${level}`)];

test("GPT-6.1 Sol exposes all seven Codex ids with correct OAuth limits", () => {
  const entries = codexProvider.models.filter((model) => model.id === BASE || model.id.startsWith(`${BASE}-`));
  assert.deepEqual(entries.map((model) => model.id).sort(), [...IDS].sort());
  assert.equal(DEFAULT_CODEX_CLIENT_VERSION, "0.159.2");
  for (const row of entries) {
    assert.equal(CODEX_NATIVE_UNPREFIXED_MODELS.has(row.id), true, row.id);
    const price = getPricingForModel("cx", row.id);
    assert.ok(price, `missing cx pricing for ${row.id}`);
    assert.equal(price.input, 2);
    assert.equal(price.cached, 0.1);
    assert.equal(price.output, 10);
  }
  assert.ok(CODEX_FAST_TIER_DEFAULT_SUPPORTED_MODELS.includes(BASE));
});

test("the OpenAI API model remains separate from the Codex OAuth model", () => {
  const row = openaiProvider.models.find((model) => model.id === BASE);
  assert.ok(row);
  assert.equal(row.contextLength, 1050000);
  assert.equal(getModelSpec(`openai/${BASE}`)?.contextWindow, 1050000);
  assert.equal(getPricingForModel("openai", BASE)?.cached, 0.1);
});

test("reasoning suffixes route to the base model and keep the correct effort", () => {
  for (const level of LEVELS) {
    assert.deepEqual(splitCodexReasoningSuffix(`${BASE}-${level}`), {
      baseModel: BASE,
      effort: level,
    });
  }
  for (const level of ["medium", "high", "xhigh", "max"] as const) {
    const body = new CodexExecutor().transformRequest(
      `${BASE}-${level}`,
      { model: `${BASE}-${level}`, input: [] },
      false,
      { requestEndpointPath: "/responses" }
    ) as { model: string; reasoning?: { effort?: string } };
    assert.equal(body.model, BASE);
    assert.equal(body.reasoning?.effort, level);
  }
});

test("GitHub catalog fills missing live inventory only when there are no live rows", () => {
  const model = (id: string): CodexDiscoveryModel => ({
    id,
    name: id,
    owned_by: "codex",
    apiFormat: "responses",
    supportedEndpoints: ["responses"],
  });
  const github = [model("gpt-6-sol"), model(BASE)];
  const fallback = enrichCodexModelsFromGithubCatalog([], github);
  assert.deepEqual(fallback.map((item) => item.id), ["gpt-6-sol", BASE]);
  const live = enrichCodexModelsFromGithubCatalog([model("gpt-6-sol")], github);
  assert.deepEqual(live.map((item) => item.id), ["gpt-6-sol"]);
});
