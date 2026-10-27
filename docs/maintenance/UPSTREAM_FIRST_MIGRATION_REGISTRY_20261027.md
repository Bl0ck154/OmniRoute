# Upstream-first candidate — custom capability registry (2026-10-27)

**Review candidate:** `integration/rc-upstream-first-20261027`, Draft PR #92. **Official base:** `cheaper-inference/OmniRoute:release/v3.8.53` at `1ac00b05e2d507d416a3e9c4c278ab625ce1dbf2`, an actual Git ancestor at branch creation. The candidate additionally includes the Oct 25–27 fork patch chain. This is a **feature-level review register**, not a claim that every production-only patch or provider behavior has been regression-tested.

Key: **U** = implemented by merged official upstream; **P** = fork-only code ported into candidate; **V** = still needs exact-head/realistic validation; **?** = behavior has not yet been mapped; **N** = no reason to retain a duplicate private implementation. Tests named below are deterministic probes or planned checks; “present” is not “passed on current SHA”.

| Feature | State | Keep for our setup? | Evidence / exact-head test | Decision |
| --- | --- | --- | --- | --- |
| Per-API-key preferred connections | U + P bridge | Yes | Official PR #13102 merged; `tests/unit/api-key-preferred-migration-bridge.test.ts`; real account order, allowed filter, fallback/affinity V | Use upstream routing; retain only legacy 170/194→213 repair until no databases need it |
| Gemini 3.8 preferred-account header budget (12 seconds) | P | Yes | `open-sse/services/preferredConnectionFailover.ts`; test timed timeout / 2 eligible accounts V | Retain isolated policy |
| Antigravity confirmed header-timeout / 504 retry | U | Yes | Official PR #18052 merged; same-account retry and failover focused tests V | Remove duplicate fork implementation when source parity verified |
| Antigravity per-account/per-model adaptive health, quarantine | P | Yes | `open-sse/services/antigravityHealth.ts`; consecutive failures, per-model independence, quarantine TTL V | Retain opt-in module; test no broad provider suspension |
| Antigravity latency/timing + optional management controls/UI | P | Yes | `open-sse/services/antigravityTiming.ts`; authz and model-health settings/UI, account status V | Retain, default OFF where optional |
| Gemini SSE explicit zero vs absent cached tokens, reasoning | P; official #18100 open | Yes | `tests/unit/gemini-buffered-sse-cache-usage.test.ts`, `gemini-stream-cache-usage-presence.test.ts`, `gemini-buffered-cache-usage.test.ts` | Retain until accepted upstream; 0 vs absent and total=0 must remain distinct |
| URL-only speech transcription, SSRF-safe remote download | U | Yes | Official PR #18040 merged; `tests/unit/audio-transcription-url.test.ts` | Use official implementation; never fetch intranet/metadata IPs |
| Codex Sol/Astra paid/free eligibility | P | Yes | `open-sse/services/codexPlanEligibility.ts`; account routing and legacy/reimport tests V | Retain fail-closed policy; don't make Free accounts eligible to fix fixtures |
| Codex reimport, token refresh, account fallback | U + ? | Yes | Authentic reimport, token expiry, retry and shared connection limits V | Audit diffs against production before final sign-off |
| Codex image quota from the account that SERVED the image | P | Yes | `tests/unit/codex-image-quota-{attempt,route-wiring,telemetry}.test.ts`; actual account + 5h reset V | Retain opt-in, default OFF; never infer from failed attempt |
| Order Forge direct image generations/artifact scope | P | Yes | `tests/unit/order-forge-image-generation-route-scope.test.ts` | Retain scoped write; verify no double requests |
| Order Forge image edits + Firefly artifacts | P | Yes | `tests/unit/order-forge-image-edits-retention-scope.test.ts`; `order-forge-image-firefly-edit-retention.test.ts` | Retain scoped storage |
| Order Forge Responses image nonstream / SSE | P | Yes | `tests/unit/order-forge-image-artifact-sink.test.ts`; stream cancel and completion V | Retain only confirmed outputs; test duplicate-free late SSE |
| Order Forge image combos + fallback | P | Yes | `tests/unit/combo/image-combo-empty-200-fallback.test.ts` | Retain winning artifacts, no duplicate image inference |
| Legacy `GET /api/resilience` clients | P | Yes | #62/#73; read-only management scope and PATCH authz V | Retain compatibility projection without widening access |
| Disconnect, timeout, empty response, provider errors | U + P; V | Yes | Focused streaming cancellation/EOF/fallback, logs and billing parity V | Treat as a blocking cross-feature release scenario |
| Other production patch-id differences (historically >100) | ? | Selectively | Per-file code/behavior audit vs `production`, `git range-diff`, `git patch-id`, provider ownership map V | Don't bulk cherry-pick; mark each omitted item as upstream-equivalent, obsolete or missing |

## Current verification facts

- Oct 25 old candidate `c8c55351`: focused API Route Typecheck #40185574035 **success**, Fast Production Build #40185575968 **success**.
- Oct 27 head `a7d1097e`, wide CI #40487374194: security, lint, extended quality, Bun SQLite, i18n, ecosystem E2E jobs succeeded at inspection time; many unit, Vitest, docs-sync, and integration shards failed or were still running. Not release-green.
- Fixing a test assertion by itself does **not** establish live runtime compatibility. Every listed V requires a passing check at the exact final SHA or a documented staging exercise.

## Closure criteria

1. Expand this register with every production-only behavioral hunk; deduplicate upstream equivalents explicitly.
2. Finish live-schema OFFLINE SQLite migration rehearsal and repeat-boot / injected failure, with verified restore.
3. Exact-head broad CI/Quality Gates, full TS, release artifact, isolated packaged boot, security review.
4. Staging/canary Oscar and Order Forge traces and measurable rollback.
5. Separate owner approval before changing production.
