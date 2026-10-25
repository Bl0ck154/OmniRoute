import test from "node:test";
import assert from "node:assert/strict";
import { geminiToOpenAIResponse } from "../../open-sse/translator/response/gemini-to-openai.ts";

function collect(usageMetadata: Record<string, unknown>) {
  const events = geminiToOpenAIResponse({
    response: {
      responseId: "cache-presence-fixture",
      modelVersion: "gemini-3.8-flash",
      candidates: [{ content: { parts: [{ text: "reply" }] }, finishReason: "STOP" }],
      usageMetadata,
    },
  }, { toolCalls: new Map() });
  return events.find((item: any) => item.usage)?.usage as Record<string, any>;
}

test("streaming Gemini reports an explicit cache zero", () => {
  const usage = collect({ promptTokenCount: 6000, candidatesTokenCount: 20,
    cachedContentTokenCount: 0, totalTokenCount: 6020 });
  assert.equal(usage.prompt_tokens, 6000);
  assert.deepEqual(usage.prompt_tokens_details, { cached_tokens: 0 });
});

test("streaming Gemini does not manufacture cache metadata when absent", () => {
  const usage = collect({ promptTokenCount: 6000, candidatesTokenCount: 20,
    totalTokenCount: 6020 });
  assert.equal(Object.hasOwn(usage, "prompt_tokens_details"), false);
});

test("streaming Gemini preserves positive cached tokens", () => {
  const usage = collect({ promptTokenCount: 16000, candidatesTokenCount: 20,
    cachedContentTokenCount: 8175, totalTokenCount: 16020 });
  assert.deepEqual(usage.prompt_tokens_details, { cached_tokens: 8175 });
});
