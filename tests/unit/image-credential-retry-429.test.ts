import assert from "node:assert/strict";
import test from "node:test";

import { executeImageWithCredentialFallback } from "../../src/sse/services/imageCredentialRetry.ts";

interface MockImageCredentials {
  connectionId: string;
  accessToken: string;
}

interface MockImageResult {
  success: boolean;
  status: number;
  error?: unknown;
  data?: unknown;
  retryable?: boolean;
  submissionState?: "ambiguous" | "definitive-failure";
}

test("executeImageWithCredentialFallback rotates to sibling account on Antigravity's quota-exhausted 429 (#14112)", async () => {
  const account1: MockImageCredentials = {
    connectionId: "conn-antigravity-1",
    accessToken: "token-1",
  };
  const account2: MockImageCredentials = {
    connectionId: "conn-antigravity-2",
    accessToken: "token-2",
  };

  const executedAccounts: string[] = [];

  const mockSelectNextCredentials = async (
    _provider: string,
    _requestedModel: string | null,
    excludedConnectionIds: Set<string>
  ) => {
    if (!excludedConnectionIds.has(account2.connectionId)) {
      return account2;
    }
    return { allRateLimited: true, retryAfter: 60 };
  };

  const mockExecute = async (creds: MockImageCredentials): Promise<MockImageResult> => {
    executedAccounts.push(creds.connectionId);
    if (creds.connectionId === "conn-antigravity-1") {
      // Antigravity's explicit exhausted-quota wording — the one 429 signal
      // isAntigravityImageQuotaExhausted() treats as safe to rotate on.
      return {
        success: false,
        status: 429,
        error: {
          error: {
            message: "Individual quota reached. Contact your administrator to enable overages.",
          },
        },
      };
    }
    return {
      success: true,
      status: 200,
      data: {
        created: Date.now(),
        data: [{ b64_json: "base64-image-data-conn2" }],
      },
    };
  };

  const { credentials, result } = await executeImageWithCredentialFallback({
    provider: "antigravity",
    requestedModel: "gemini-3.1-flash-image",
    credentials: account1,
    execute: mockExecute,
    selectNextCredentials: mockSelectNextCredentials,
  });

  assert.equal(result.success, true);
  assert.equal(result.status, 200);
  assert.deepEqual(executedAccounts, ["conn-antigravity-1", "conn-antigravity-2"]);
  assert.equal(credentials.connectionId, "conn-antigravity-2");
});

test("executeImageWithCredentialFallback terminates when all accounts return Antigravity's quota-exhausted 429 (#14112)", async () => {
  const account1: MockImageCredentials = {
    connectionId: "conn-antigravity-1",
    accessToken: "token-1",
  };
  const account2: MockImageCredentials = {
    connectionId: "conn-antigravity-2",
    accessToken: "token-2",
  };

  const executedAccounts: string[] = [];

  const mockSelectNextCredentials = async (
    _provider: string,
    _requestedModel: string | null,
    excludedConnectionIds: Set<string>
  ) => {
    if (!excludedConnectionIds.has(account2.connectionId)) {
      return account2;
    }
    return { allRateLimited: true, retryAfter: 60 };
  };

  const mockExecute = async (creds: MockImageCredentials): Promise<MockImageResult> => {
    executedAccounts.push(creds.connectionId);
    return {
      success: false,
      status: 429,
      error: {
        error: {
          message: "Individual quota reached. Contact your administrator to enable overages.",
        },
      },
    };
  };

  const { result } = await executeImageWithCredentialFallback({
    provider: "antigravity",
    requestedModel: "gemini-3.1-flash-image",
    credentials: account1,
    execute: mockExecute,
    selectNextCredentials: mockSelectNextCredentials,
  });

  assert.equal(result.success, false);
  assert.equal(result.status, 429);
  assert.deepEqual(executedAccounts, ["conn-antigravity-1", "conn-antigravity-2"]);
});

test("executeImageWithCredentialFallback does not rotate on an ordinary (non-quota-exhausted) 429 (#14112)", async () => {
  const account1: MockImageCredentials = {
    connectionId: "conn-antigravity-1",
    accessToken: "token-1",
  };
  const account2: MockImageCredentials = {
    connectionId: "conn-antigravity-2",
    accessToken: "token-2",
  };

  const executedAccounts: string[] = [];

  const mockSelectNextCredentials = async (
    _provider: string,
    _requestedModel: string | null,
    _excludedConnectionIds: Set<string>
  ) => account2;

  const mockExecute = async (creds: MockImageCredentials): Promise<MockImageResult> => {
    executedAccounts.push(creds.connectionId);
    // Image generation is non-idempotent: an ordinary rate-limit 429 (no
    // quota-exhausted evidence) must NOT trigger account rotation.
    return {
      success: false,
      status: 429,
      error: { error: { message: "RESOURCE_EXHAUSTED: too many requests; retry later" } },
    };
  };

  const { result } = await executeImageWithCredentialFallback({
    provider: "antigravity",
    requestedModel: "gemini-3.1-flash-image",
    credentials: account1,
    execute: mockExecute,
    selectNextCredentials: mockSelectNextCredentials,
  });

  assert.equal(result.success, false);
  assert.equal(result.status, 429);
  assert.deepEqual(executedAccounts, ["conn-antigravity-1"]);
});

test("executeImageWithCredentialFallback handles 401 and retryable flags correctly", async () => {
  const account1: MockImageCredentials = { connectionId: "conn-1", accessToken: "token-1" };
  const account2: MockImageCredentials = { connectionId: "conn-2", accessToken: "token-2" };

  const executedAccounts: string[] = [];

  const mockSelectNextCredentials = async (
    _provider: string,
    _requestedModel: string | null,
    excludedConnectionIds: Set<string>
  ) => {
    if (!excludedConnectionIds.has(account2.connectionId)) {
      return account2;
    }
    return null;
  };

  // 1. Test 401 rotation
  const result401 = await executeImageWithCredentialFallback({
    provider: "codex",
    requestedModel: "gpt-5.6-sol",
    credentials: account1,
    execute: async (creds: MockImageCredentials): Promise<MockImageResult> => {
      executedAccounts.push(creds.connectionId);
      if (creds.connectionId === "conn-1") {
        return { success: false, status: 401, error: "Unauthorized" };
      }
      return { success: true, status: 200, data: { ok: true } };
    },
    selectNextCredentials: mockSelectNextCredentials,
  });

  assert.equal(result401.result.success, true);
  assert.deepEqual(executedAccounts, ["conn-1", "conn-2"]);

  // 2. Non-retryable 400 error does NOT rotate
  executedAccounts.length = 0;
  const result400 = await executeImageWithCredentialFallback({
    provider: "codex",
    requestedModel: "gpt-5.6-sol",
    credentials: account1,
    execute: async (creds: MockImageCredentials): Promise<MockImageResult> => {
      executedAccounts.push(creds.connectionId);
      return { success: false, status: 400, error: "Invalid prompt format" };
    },
    selectNextCredentials: mockSelectNextCredentials,
  });

  assert.equal(result400.result.success, false);
  assert.equal(result400.result.status, 400);
  assert.deepEqual(executedAccounts, ["conn-1"]); // did not rotate

  // 3. Retryable 400 error DOES rotate
  executedAccounts.length = 0;
  const result400Retryable = await executeImageWithCredentialFallback({
    provider: "codex",
    requestedModel: "gpt-5.6-sol",
    credentials: account1,
    execute: async (creds: MockImageCredentials): Promise<MockImageResult> => {
      executedAccounts.push(creds.connectionId);
      if (creds.connectionId === "conn-1") {
        return {
          success: false,
          status: 400,
          retryable: true,
          error: "Model not supported on this account",
        };
      }
      return { success: true, status: 200, data: { ok: true } };
    },
    selectNextCredentials: mockSelectNextCredentials,
  });

  assert.equal(result400Retryable.result.success, true);
  assert.deepEqual(executedAccounts, ["conn-1", "conn-2"]);
});


test("image fallback passes the allowed API-key connection scope and rejects an out-of-scope account", async () => {
  const executed: string[] = [];
  let nextSelectorScope: string[] | null = null;
  const first: MockImageCredentials = { connectionId: "allowed-1", accessToken: "first" };
  const outside: MockImageCredentials = { connectionId: "outside-2", accessToken: "outside" };
  const result = await executeImageWithCredentialFallback({
    provider: "codex",
    requestedModel: "gpt-image-2",
    credentials: first,
    allowedConnections: ["allowed-1"],
    execute: async (credentials: MockImageCredentials): Promise<MockImageResult> => {
      executed.push(credentials.connectionId);
      return { success: false, status: 401, error: "access denied" };
    },
    selectNextCredentials: async (_provider, _model, _excluded, allowed) => {
      nextSelectorScope = allowed;
      return outside;
    },
  });
  assert.deepEqual(nextSelectorScope, ["allowed-1"]);
  assert.deepEqual(executed, ["allowed-1"], "fallback must never execute a disallowed account");
  assert.equal(result.result.status, 403);
});

test("image requests fail closed before a disallowed initial credential is executed", async () => {
  let executed = false;
  const result = await executeImageWithCredentialFallback({
    provider: "codex",
    requestedModel: "gpt-image-2",
    credentials: { connectionId: "outside", accessToken: "outside" },
    allowedConnections: ["allowed"],
    execute: async (): Promise<MockImageResult> => {
      executed = true;
      return { success: true, status: 200 };
    },
  });
  assert.equal(executed, false);
  assert.equal(result.result.status, 403);
});

test("ambiguous paid image submission is never retried on another credential", async () => {
  const executed: string[] = [];
  let selectorCalls = 0;
  const result = await executeImageWithCredentialFallback({
    provider: "codex",
    requestedModel: "gpt-image-2",
    credentials: { connectionId: "allowed-1", accessToken: "first" },
    allowedConnections: ["allowed-1", "allowed-2"],
    execute: async (credentials: MockImageCredentials): Promise<MockImageResult> => {
      executed.push(credentials.connectionId);
      return {
        success: false,
        status: 502,
        retryable: true,
        submissionState: "ambiguous",
        error: "upstream connection closed after POST",
      };
    },
    selectNextCredentials: async () => {
      selectorCalls++;
      return { connectionId: "allowed-2", accessToken: "second" };
    },
  });
  assert.deepEqual(executed, ["allowed-1"]);
  assert.equal(selectorCalls, 0, "a second POST could result in double billing");
  assert.equal(result.result.status, 502);
});
