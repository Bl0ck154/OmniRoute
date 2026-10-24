# Antigravity resilience: upstream-first port ledger

**Draft phase 3A; not a production integration or release.**

Standalone modules (taken from fork production after PRs #47 and #49):
- `open-sse/services/antigravityHealth.ts`: model-scoped adaptive quarantine and half-open recovery; 499 cancellation excluded.
- `open-sse/services/antigravityTiming.ts`: sanitized request-phase telemetry; PR #49's non-2xx terminal metrics and abandoned-response cleanup.
- `open-sse/services/antigravityTimeout.ts`: precise pre-response timeout classification.
- `src/sse/services/antigravityHealthLifecycle.ts`: stream-aware attempt lifecycle.
- `src/lib/resilience/antigravitySettings.ts`: 5s/12s defaults, opt-in health/telemetry OFF by default, validated timeout values.
- Three unit/regression suites in `tests/unit/antigravity-*.test.ts`.

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
