# Antigravity resilience: upstream-first port ledger

**Draft phase 3A; not a production integration or release.**

Standalone modules (taken from fork production after PRs #47 and #49):
- `open-sse/services/antigravityHealth.ts`: model-scoped adaptive quarantine and half-open recovery; 499 cancellation excluded.
- `open-sse/services/antigravityTiming.ts`: sanitized request-phase telemetry; PR #49's non-2xx terminal metrics and abandoned-response cleanup.
- `open-sse/services/antigravityTimeout.ts`: precise pre-response timeout classification.
- `src/sse/services/antigravityHealthLifecycle.ts`: stream-aware attempt lifecycle.
- `src/lib/resilience/antigravitySettings.ts`: 5s/12s defaults, opt-in health/telemetry OFF by default, validated timeout values.
- **Two standalone unit/regression suites** for adaptive health and timing. Runtime retry tests remain a blocking phase-3B acceptance gate.

**None of these modules is currently wired to the live upstream selection/dispatch or admin UI.** Unit tests cannot establish production behavior. No deploy, no DB migration and no production service changes.

## Trial cherry-pick of fork feature commit 6714745473

An isolated disposable no-commit trial identified TEN conflicting files:
`.github/workflows/selected-upstream-regression.yml`;
`open-sse/executors/antigravity.ts`;
`src/app/(dashboard)/dashboard/resilience/connections/components/ConnectionDetail.tsx`;
`src/app/(dashboard)/dashboard/settings/components/ResilienceTab.tsx`;
`src/app/api/resilience/route.ts`;
`src/lib/resilience/settings.ts`;
`src/shared/validation/schemas/settings.ts`;
`src/sse/handlers/chat.ts` (six overlapping blocks);
`src/sse/services/auth.ts`;
`src/sse/services/preferredConnectionFailover.ts`.

The trial was discarded cleanly. Do **not** take older fork versions wholesale or bring back the obsolete GitHub regression workflow.

## Remaining phase 3B acceptance

Wire adaptive account+model health only *after* access, quota, cooldown, lease and terminal eligibility filtering; preserve forced pin, 499 cancellation and partial-stream semantics. Connect timing observation at the HTTP egress boundary, ensure 403/429/5xx release metrics slots and the watchdog never consumes/aborts an unowned stream. Port hot DB settings and management UI using the new upstream PATCH/merge-prune and validation contract. Test 8-sample minimum, 30s–5m cooldown, half-open single probe, 2-success recovery, cross-model isolation and failover concurrency. Finally require full off-host integration CI, an isolated DB upgrade rehearsal, a canary/rollback plan, and approval before modifying production.


## 2026-10-25 first hosted CI evidence
Hosted [run 40133459138](https://github.com/Bl0ck154/OmniRoute/actions/runs/40133459138)
passed API route typechecking, prior preferred-connection/migration suite (26/26)
and adaptive-health/timing standalone cases, but failed **three assertions** in the
old `tests/unit/antigravity-timeout-retry.test.ts`: same-account suppression for
confirmed timeout, preservation of exact timeout in Pro fallback, and no URL/Pro
replay after the confirmed timeout. That test exercises existing executor/runtime
logic and is **not** a standalone-core test. It is deliberately deferred to
phase 3B rather than changing its assertions or treating this stage as a pass.
The test remains in fork production and must be ported unchanged when wiring
live Antigravity retries. Do not deploy before these assertions pass.


## 2026-10-25 phase 3B-2 integration candidate

Isolated draft branch (not deployed) implements:
- Credential selection health filtering **only after** allowlists, quota, terminal/cooldown and lease filtering, with per-model quarantine and single-probe guard.
- Per-attempt health tickets in current upstream `chat.ts`; exactly-once settlement on header timeout vs 499/abort vs ordinary transport, and stream completion rather than HTTP 200 response headers.
- Opt-in behavior using `resilienceSettings.antigravity.adaptiveHealthEnabled` (default OFF); prevents a model health timeout from inducing a global account cooldown.
- First five end-to-end request-path cases from fork #47, adapted to current upstream API. State API and settings UI are not yet included.

This integration is only a **candidate** until hosted checks pass. Next:
- Transport-level timing wiring, including #49's unconsumed-response cleanup, is separate.
- Hot validated resilience admin settings API, UI and health status endpoint remain TODO.
- Full CI, migration rehearsal, canary and explicit deployment approval remain REQUIRED.
