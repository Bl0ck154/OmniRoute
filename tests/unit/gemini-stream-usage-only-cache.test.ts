import test from "node:test";
import assert from "node:assert/strict";

const { geminiToOpenAIResponse } =
  await import("../../open-sse/translator/response/gemini-to-openai.ts");

for (const wrap of [false, true]) {
  test(`Gemini stream forwards cached usage from candidate-less final event (wrapped=${wrap})`, () => {
    const state = { toolCalls: new Map() };
    const initial = {
      responseId: "gemini-usage-only-test",
      modelVersion: "gemini-3.8-flash",
      candidates: [{ content: { parts: [{ text: "hello" }] }, finishReason: "STOP" }],
    };
    const first = geminiToOpenAIResponse(wrap ? { response: initial } : initial, state);
    assert.ok(first?.some((part: any) => part.choices?.[0]?.finish_reason === "stop"));

    const final = {
      responseId: "gemini-usage-only-test",
      modelVersion: "gemini-3.8-flash",
      candidates: [],
      usageMetadata: {
        promptTokenCount: 5000,
        candidatesTokenCount: 20,
        totalTokenCount: 5020,
        cachedContentTokenCount: 4096,
      },
    };
    const chunks = geminiToOpenAIResponse(wrap ? { response: final } : final, state);
    assert.equal(chunks?.length, 1);
    assert.deepEqual(chunks[0].choices, []);
    assert.deepEqual(chunks[0].usage, {
      prompt_tokens: 5000,
      completion_tokens: 20,
      total_tokens: 5020,
      prompt_tokens_details: { cached_tokens: 4096 },
    });
  });
}

test("candidate-less usage before the model finishes is retained without a premature terminal chunk", () => {
  const state: any = { toolCalls: new Map() };
  const early = geminiToOpenAIResponse(
    {
      modelVersion: "gemini-3.8-flash",
      usageMetadata: { promptTokenCount: 5000, cachedContentTokenCount: 4096 },
    },
    state
  );
  assert.equal(early, null);
  const final = geminiToOpenAIResponse(
    {
      responseId: "gemini-early-usage",
      modelVersion: "gemini-3.8-flash",
      candidates: [{ content: { parts: [{ text: "ok" }] }, finishReason: "STOP" }],
    },
    state
  );
  assert.equal(final?.at(-1)?.usage?.prompt_tokens_details?.cached_tokens, 4096);
});

test("candidate-less Gemini stream error is not mistaken for cache usage", () => {
  const state: any = { toolCalls: new Map() };
  const chunks = geminiToOpenAIResponse(
    { error: { code: 503, status: "UNAVAILABLE", message: "unavailable" } },
    state
  );
  assert.equal(chunks, null);
  assert.equal(state.upstreamError?.status, 503);
});
