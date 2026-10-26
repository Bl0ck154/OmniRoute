import test from "node:test";
import assert from "node:assert/strict";
import { geminiToOpenAIResponse } from "../../open-sse/translator/response/gemini-to-openai.ts";

type GeminiUsage = {
  prompt_tokens: number;
  prompt_tokens_details?: { cached_tokens: number };
};


function collect(usageMetadata: Record<string, unknown>) {
  const events = geminiToOpenAIResponse({
    response: {
      responseId: "cache-presence-fixture",
      modelVersion: "gemini-3.8-flash",
      candidates: [{ content: { parts: [{ text: "reply" }] }, finishReason: "STOP" }],
      usageMetadata,
    },
  }, { toolCalls: new Map() });
  const usageEvent = events.find((item) =>
    typeof item === "object" && item !== null && "usage" in item
  );
  if (!usageEvent) throw new Error("Gemini fixture did not emit usage metadata");
  return (usageEvent as { usage: GeminiUsage }).usage;
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

test("streaming Gemini retains a previously reported cache count across partial metadata chunks", () => {
  const state = { toolCalls: new Map() };
  const mkChunk = (metadata: Record<string, unknown>) => ({
    response: {
      responseId: "partial-cache-metadata-fixture",
      modelVersion: "gemini-3.8-flash",
      candidates: [{ content: { parts: [{ text: "reply" }] }, finishReason: "STOP" }],
      usageMetadata: metadata,
    },
  });
  geminiToOpenAIResponse(mkChunk({
    promptTokenCount: 6000, candidatesTokenCount: 20,
    cachedContentTokenCount: 64, totalTokenCount: 6020,
  }), state);
  const trailing = geminiToOpenAIResponse(mkChunk({
    promptTokenCount: 6000, candidatesTokenCount: 20, totalTokenCount: 6020,
  }), state);
  const usageEvent = trailing.find((item) =>
    typeof item === "object" && item !== null && "usage" in item
  );
  if (!usageEvent) throw new Error("Trailing Gemini fixture dropped usage");
  const usage = (usageEvent as { usage: GeminiUsage }).usage;
  assert.deepEqual(usage.prompt_tokens_details, { cached_tokens: 64 });
});
