import test from "node:test";
import assert from "node:assert/strict";
import { withAntigravityTiming } from "../../open-sse/services/antigravityTiming.ts";
import {
  fetchAntigravityWithReadinessTimeout,
} from "../../open-sse/executors/antigravity/executeAttempt.ts";

const frame = 'data: {"response":{"candidates":[{"content":{"parts":[{"text":"ok"}]}}]}}\n\n';
const url = "https://fixture.invalid/v1/streamGenerateContent";

test("Antigravity physical fetch includes headers + useful deltas without changing payload", async () => {
  const events: Record<string, unknown>[] = [];
  const originalFetch = globalThis.fetch;
  let sends = 0;
  globalThis.fetch = async (_input, init) => {
    sends++;
    assert.ok(init?.signal, "existing abort+header watchdog stays in place");
    return new Response(frame, { headers: { "content-type": "text/event-stream" } });
  };
  try {
    const result = await withAntigravityTiming({
      enabled: true,
      connectionId: "super-private-account",
      model: "gemini-3.8-flash-high",
      emit: (event) => events.push(event),
    }, () => fetchAntigravityWithReadinessTimeout(url, { method: "POST" }, 2_000));
    assert.equal(await result.text(), frame);
    assert.equal(sends, 1);
    assert.ok(events.some((event) => event.phase === "headers"));
    assert.ok(events.some((event) => event.phase === "first_meaningful_delta"));
    assert.ok(events.some((event) => event.phase === "complete"));
    const logged = JSON.stringify(events);
    for (const forbidden of [url, "super-private-account", "candidates", "parts"]) {
      assert.ok(!logged.includes(forbidden), `secret/payload leaked: ${forbidden}`);
    }
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("timing disabled keeps fetch response identity and emits nothing", async () => {
  const originalFetch = globalThis.fetch;
  const source = new Response("fixture", { status: 200 });
  const events: Record<string, unknown>[] = [];
  globalThis.fetch = async () => source;
  try {
    const result = await withAntigravityTiming({
      enabled: false,
      connectionId: "secret",
      model: "gemini-3.8-flash-high",
      emit: (event) => events.push(event),
    }, () => fetchAntigravityWithReadinessTimeout(url, { method: "POST" }, 2_000));
    assert.equal(result, source);
    assert.deepEqual(events, []);
  } finally {
    globalThis.fetch = originalFetch;
  }
});
