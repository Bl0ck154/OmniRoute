import assert from "node:assert/strict";
import test from "node:test";

import {
  attachCodexImageQuotaHeaders,
  mergeFreshCodexImageQuotaBaseline,
} from "../../src/lib/images/codexImageQuotaTelemetry";

test("fresh Codex image quota baseline replaces stale before value in the same 5h window", () => {
  const telemetry = mergeFreshCodexImageQuotaBaseline(
    {
      connectionId: "old",
      fiveHourBeforeRemainingPercent: 42,
      fiveHourAfterRemainingPercent: 87.75,
      fiveHourResetAt: "2026-09-05T18:00:00.000Z",
      observedAt: "2026-09-05T14:00:02.000Z",
    },
    {
      connectionId: "served-account",
      fiveHourPercentUsed: 0.11,
      fiveHourResetAt: "2026-09-05T18:00:00.000Z",
      observedAt: "2026-09-05T14:00:00.000Z",
    }
  );

  assert.equal(telemetry.connectionId, "served-account");
  assert.equal(telemetry.fiveHourBeforeRemainingPercent, 89);
  assert.equal(telemetry.fiveHourAfterRemainingPercent, 87.75);
  const headers = new Headers();
  attachCodexImageQuotaHeaders(headers, telemetry);
  assert.equal(headers.get("x-omniroute-codex-5h-before-remaining"), "89");
  assert.equal(headers.get("x-omniroute-codex-5h-after-remaining"), "87.75");
  assert.equal(headers.get("x-omniroute-codex-5h-delta-used"), "1.25");
});

test("5h rollover suppresses a misleading cross-window image consumption delta", () => {
  const telemetry = mergeFreshCodexImageQuotaBaseline(
    {
      connectionId: "served-account",
      fiveHourAfterRemainingPercent: 99.5,
      fiveHourResetAt: "2026-09-05T23:00:00.000Z",
    },
    {
      connectionId: "served-account",
      fiveHourPercentUsed: 0.98,
      fiveHourResetAt: "2026-09-05T18:00:00.000Z",
    }
  );

  assert.equal(telemetry.fiveHourBeforeRemainingPercent, null);
  assert.equal(telemetry.fiveHourAfterRemainingPercent, 99.5);
  assert.equal(telemetry.fiveHourResetAt, "2026-09-05T23:00:00.000Z");
  const headers = new Headers();
  attachCodexImageQuotaHeaders(headers, telemetry);
  assert.equal(headers.get("x-omniroute-codex-5h-before-remaining"), null);
  assert.equal(headers.get("x-omniroute-codex-5h-after-remaining"), "99.5");
  assert.equal(headers.get("x-omniroute-codex-5h-delta-used"), null);
});
