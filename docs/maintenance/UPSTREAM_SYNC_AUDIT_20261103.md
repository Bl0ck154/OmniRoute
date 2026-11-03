# Fork vs upstream audit — 2026-11-03

Source comparison behind the proposed integration branch **sync/upstream-v3853-20261103**. This document does not authorize a production deployment.

## Exact source refs

| Source | Commit |
| --- | --- |
| Fork production after UI PR #97 | 96593152132728dbbf3bfa0a561357f1bee6ec8f |
| Upstream stable/default release/v3.8.53 | 2502bd693709c7021df8476b392c58ad97c6dd51 |
| Upstream development main (not deployment target) | 26bf6812c06afb33abeb877160585050c0f5ca5d |

The official branch contains **69 upstream-only commits** and the fork **211 fork-only commits** from their merge base. Commit counts include integrations and squash commits; they do not represent a number of missing product features.

Before integration there were **2,988 differing file paths**, of which **1,914** were translated documents under docs/i18n. A three-way merge yielded **80 conflicts**: 66 localized llm.txt mirrors, four other documents, six runtime code files, and four tests.

The proposed merge resolves documentation mirrors using current upstream copies; preserves the fork's AGENTS.md safety instructions; adopts the newer upstream Antigravity and Gemini implementations in conflicting modules; and combines required imports in the central chat handler.

The resulting integration differs from upstream in roughly **210 files**, including approximately **156 source/config/test paths** and fork-specific documentation and release infrastructure. The delta is about 9,000 inserted and under 2,000 removed lines. This is source-level analysis, not a passing runtime certification.

## Important remaining patch groups

| Group | Evidence | Decision |
| --- | --- | --- |
| Adaptive Antigravity health and timing | open-sse/services/antigravityHealth.ts, antigravityTiming.ts, src/lib/resilience/antigravitySettings.ts, health lifecycle, dashboard card | Keep custom model/account health, telemetry and hot settings until fully tested; split upstream-ready behavior into narrow PRs. |
| API-key preferred connections and UI | src/lib/db/apiKeys.ts, src/lib/db/migrations/194_api_key_preferred_connections.sql, ApiManagerPageClient.tsx | Upstream #13102 merged the concept. Keep the legacy schema bridge and working UI pending overlap review; do not re-submit duplicates. |
| SQLite migration compatibility | Fork 194 and upstream proxy-timing 223, migrationRunner, historical migration test | Preserve migration compatibility. Run synthetic old-fork schema rehearsal before shipping; package rollback alone does not restore the database. |
| Transcription URL support | audioTranscription.ts, transcriptionRemoteAudio.ts, SSRF tests | Upstream #18040 merged. Review remaining local delta for additional security coverage, avoid duplicating accepted implementation. |
| Gemini usage and Antigravity 504 | Gemini response parser and timeout handling | Upstream #18100 and #18052 merged. Prefer official implementation where it conflicts, check cache-zero semantics and exact same-account header deadline on CI. |
| Codex/media | codexPlanEligibility.ts, image quota telemetry, image edits/generation, codex import | Keep paid/free routing and refresh behavior. Related upstream #17961 is open; avoid carrying obsolete duplicates after its resolution. |
| Order Forge | src/lib/usage/orderForgeImageArtifactSink.ts, image usage handling | Store/workflow-specific integration; likely remain fork-only. |
| Network and resource safety | proxyFetch.ts, resourcePressurePolicy.ts, timeout/retry regression tests | Fork #95/#96 address real conditions. Compare against new upstream and propose individually if still missing. |
| Local packaging | ops/*, build-custom-release.yml and selected-regression workflow | Fork-only deployment pipeline. Do not submit upstream. |
| API Manager UI size | ApiManagerPageClient.tsx | Roughly 1,708 lines more than official; substantial maintenance risk. Review separately and extract only necessary features before reverting or offering upstream. |

UI PR #97 removes the custom provider-account layout. The standard release/v3.8.53 ConnectionRow markup is again authoritative.

**Regression avoided during integration:** the fork had omitted seven current upstream feature-flag definitions (97 lines). The official featureFlagDefinitions.ts was restored in the candidate branch; this aligns with upstream's test expectation of 114 feature flags. Verify behavior through off-host CI.

## Current upstream contributions by Bl0ck154

Checked on 2026-11-03: **19 upstream PRs**, comprising **16 merged** and **3 open**.

Selected already accepted PRs: [#18040](https://github.com/cheaper-inference/OmniRoute/pull/18040) URL-only secure audio transcription, [#18052](https://github.com/cheaper-inference/OmniRoute/pull/18052) Antigravity timeout, [#18100](https://github.com/cheaper-inference/OmniRoute/pull/18100) buffered Gemini cache/reasoning accounting, [#18096](https://github.com/cheaper-inference/OmniRoute/pull/18096) migration 194 repair, [#13102](https://github.com/cheaper-inference/OmniRoute/pull/13102) API key preferred connections, [#13090](https://github.com/cheaper-inference/OmniRoute/pull/13090) Fish Audio, [#12311](https://github.com/cheaper-inference/OmniRoute/pull/12311) image quota and several Codex repairs.

Open: [#17961](https://github.com/cheaper-inference/OmniRoute/pull/17961) free-plan paid-only Codex model gate, [#18733](https://github.com/cheaper-inference/OmniRoute/pull/18733) false cgroup page-cache 503 pressure, and [#18738](https://github.com/cheaper-inference/OmniRoute/pull/18738) GPT-6.1 Terra support (title marked defer).

No duplicate upstream PR was created from this audit. Future upstream patches should be small, independently tested, and avoid private operational behavior.

## SQLite migration 223 collision discovered by candidate CI

The first off-host regression run failed because upstream added 223_call_logs_queue_wait_ms.sql while an earlier fork release already used 223_proxy_logs_attempt_timing.sql. This makes the entire migration runner refuse to initialize, so ordinary unit failures cascade. Integration correction: retain the **official** queue migration at 223, move the **fork** timing file to 224, and add name-checked 223→224 ledger reconciliation for existing custom installs, as well as independent physical-schema guards for both versions. This is fork-specific migration history, not a change to upstream's official 223.

The repair needs CI on the updated exact commit, a synthetic historical ledger test with an already-applied 223 timing entry, and package smoke before promotion. Future upstream releases may allocate 224; the next synchronization must detect and reconcile the fork-specific slot instead of silently skipping a migration. A namespaced fork-migration system remains preferable to further numeric slot churn.

## Promotion gates

1. Run off-host CI on the exact integration SHA: selected upstream/fork regressions, TypeScript checks, and historical synthetic SQLite 194 to 213 to 223 upgrade.
2. Verify header timeout versus first-event watchdog, same-account retry, 499 exclusion, account/model quotas, cooldowns, runtime settings, and Gemini cached/reasoning tokens.
3. Test API key preferred connections, Codex paid/free eligibility, token rotation, image upload/generation, and safe URL speech transcription.
4. Build a SHA-pinned release candidate off-host; verify packaging and smoke. **No OmniRoute builds or test suites on production zivkr-ai.**
5. Only then promote an integration PR to production and deploy one verified artifact with a separate reversible SQLite backup plan.

See FORK_PATCH_REGISTER.md and UPSTREAM_UPGRADE_RUNBOOK.md for the operational hard gates.
