# Antigravity resilience overhaul audit

This branch starts at production commit `44fdae6b4b9d63fa41f62a1941e3ff2f366743f6`.
It is a code and static review only. The production host was not built, started, or
used for tests, and no upstream model calls were made.

## Root cause and baseline

The request loop classified every Antigravity 504 as a pre-response timeout in one
branch, but the generic same-account transport retry remained reachable in other
paths. Its transport status set included 504, so a confirmed header timeout could
send the same account again before account rotation. The change requires both
`errorType=upstream_timeout` and
`errorCode=ANTIGRAVITY_PRE_RESPONSE_TIMEOUT` for the specialized path, excludes
confirmed Antigravity timeouts from same-account retry, and keeps 502, 503 and
socket-reset handling separate.

The owner supplied the baseline for the last 24 hours: about 2,824 Gemini 3.8
records, 261 HTTP 504, 576 HTTP 499 and 1,874 HTTP 200. Prefix summaries were
04572930: 303 requests (97 504, 106 499, 93 429, 7 200), 96c44b1c: 2,099
(100 504, 375 499, 1,612 200), and 42684230: 232 (59 504, 57 499, 116 200).
The prefixes are not account numbers. The 113 same-account repeats reported by
the owner were treated as the regression signal. 499 cancellations are excluded
from health denominators and do not mark accounts; 429 remains quota/rate-limit
state.

## Implemented behavior

`open-sse/services/antigravityHealth.ts` provides a bounded process-local
connection + normalized-model rolling window. It requires eight completed samples,
uses a 50% timeout ratio or three consecutive confirmed timeouts, quarantines for
30 seconds with exponential backoff capped at five minutes, admits one half-open
probe, and requires two sequential successes for recovery. 499, quota, auth and
local rejection outcomes are ignored. Entries and history are bounded, and a
generation fence prevents a stale concurrent result from undoing a newer state.
Selection applies health after existing quota, terminal, model and forced-connection
rules. If every eligible pair is quarantined, one real demand-driven request is
allowed as an escape probe. The feature is off by default.

The connections API exposes only bounded model, state, counts, ratios, cooldown,
backoff and inflight fields. It does not expose credentials, upstream text, URLs or
PII. The dashboard connection detail renders these fields. The API requires the
existing management authentication policy and access-token write scope.

`open-sse/services/antigravityTiming.ts` records optional phase telemetry with a
bounded hashed account label and bounded event count. Idle duration, inflight
count, header latency and first meaningful Gemini delta are measured from actual
phase boundaries. DNS, connect and TLS phases are explicitly `null` when the
available fetch API cannot measure them. Timing is disabled by default and emits no
request body, bearer token, URL or user content. Existing dispatcher keepalive and
fresh-socket recovery paths remain in control; no synthetic paid probes were added.

Preferred failover defaults remain exported as 5,000 and 12,000 ms for compatibility.
The runtime settings object adds bounded, persisted values (500..120,000 ms),
adaptive-health and timing switches. `/api/resilience` validates the patch, requires
management auth, writes the settings atomically with the existing revision conflict
guard, and reads settings for each new request. The dashboard exposes the four
values.

## Tradeoffs and operator knobs

The health tracker is process-local, so a restart clears observations and does not
create a migration. This avoids persisting ephemeral per-account state or secrets.
The default feature gate is conservative. Operators can enable adaptive health and
timing telemetry from Settings → Resilience. Preferred timeout values are clamped to
500..120,000 ms. Recovery uses real traffic only, so an idle account may remain
quarantined until the next request reaches its half-open window.

## Verification

Added focused unit coverage for exact timeout classification, forced/pinned behavior,
bounded transport retry, model normalization, low-sample protection, 499 exclusion,
rolling expiry, backoff, half-open concurrency, recovery hysteresis, bounded state,
stream completion and timing lifecycle. Added the two test files to
`.github/workflows/selected-upstream-regression.yml`.

Only static checks were performed in this worktree: source inspection and
`git diff --check`. CI has not run yet. This report intentionally does not claim
typecheck, lint, unit, integration, build, browser or deployment verification.

## Remaining uncertainties and limitations

The owner-provided aggregate counts do not identify Antigravity accounts, and this
branch cannot establish the Gemini 3.8 account #2 idle-restart diagnosis from
production. The telemetry will distinguish idle, concurrency, header and first-delta
phases after CI and an approved deployment. DNS/connect/TLS remain null unless the
selected dispatcher exposes safe phase hooks. The adaptive tracker is not shared
between multiple worker processes. No deployment, merge or production setting change
is included in this PR.
