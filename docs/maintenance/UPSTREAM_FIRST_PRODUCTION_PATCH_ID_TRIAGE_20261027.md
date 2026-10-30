# Production-only patch-id triage snapshot — Oct 27, 2026

**Measured Git refs:** production `d641017972ea23884ea1569bcbcb20affcd48158` and inspected migration parent `a7d1097e469e3ec5fff9a36cef3607fbfa081fc6`. Created by `git log --right-only --cherry-pick --no-merges` across the two diverged branches using *read-only* repository metadata. The lower-level `git rev-list --right-only --cherry-pick --count` yielded **141** commit objects including merges; **110** non-merge patch-id-distinct commits are inventoried below. These are NOT synonymous with missing features; changed code can be implemented differently in upstream and Git may not recognize equivalence.

- Non-runtime documentation/CI/test/chore entries by subject: **34**.
- Heuristically prioritized security/routing/image/provider/runtime topics: **57** (overlaps other group, not additive).
- Potentially immediately release-affecting commit subjects: **24**. These need source-to-source semantic inspection.
- Classification is intentionally conservative: no entry is labeled "ported", "upstream equivalent", or "obsolete" purely by a commit title. Use `docs/maintenance/UPSTREAM_FIRST_MIGRATION_REGISTRY_20261027.md` for the feature-level preliminary mapping.

## Reproduction

```sh
git log --right-only --cherry-pick --no-merges --format='%h%x09%s' \
  a7d1097e469e3ec5fff9a36cef3607fbfa081fc6...d641017972ea23884ea1569bcbcb20affcd48158
```

## Entries to resolve before production

| # | Prod commit | Subject | Audit priority | Candidate/source equivalence | Decision / test |
| ---: | --- | --- | --- | --- | --- |
| 1 | `de31f0ef47` | fix(gemini): distinguish explicit zero cache usage from missing usage | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 2 | `4578dfd30b` | fix(antigravity): retain Gemini cache and reasoning usage in buffered SSE | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 3 | `df0a46c8b8` | docs(ops): allow agents to mark completed Netcup worktrees for cleanup | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 4 | `01c9bc9194` | docs(agents): block blind upstream upgrades over SQLite migration 194 collision | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 5 | `b4af2b5ca1` | docs(fork): make upstream parity gap and migration 194 a release gate | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 6 | `ee5eb02d87` | docs(fork): make upstream parity gap and migration 194 a release gate | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 7 | `0183673722` | docs(fork): audit 3.8.52 partial backport and blocking SQLite migration 194 collision | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 8 | `e3398b7b48` | fix(antigravity): close telemetry lifecycle for discarded responses (#49) | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 9 | `ebf27a9087` | docs(audit): mark earlier static-only report historical after custom.34 production verification | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 10 | `79ff7b3f6a` | docs(agents): direct future maintainers to fork patch register and upstream upgrade runbook | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 11 | `809b6447b3` | docs(fork): safe upstream integration, off-host release and database rollback runbook | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 12 | `4f3155789b` | docs(fork): record custom releases, upstream PR status and patch preservation | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 13 | `be16121fe4` | test(api): align timeout code and optional connection state assertions with actual contract | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 14 | `bce04a5022` | fix(antigravity): preserve exact header timeout across non-streaming leg | High-risk behavioral diff | Potentially superseded by official PR (#13102 / #18040 / #18052); prove at code level | Pending code and exact-SHA behavior review |
| 15 | `17606c2b40` | test(api): verify exact upstream timeout marker across dispatch and 499 nullish state | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 16 | `6714745473` | feat(api): adaptive Antigravity model resilience and hot failover controls | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 17 | `f25ce1a433` | test(ci): cover pinned streaming download regression | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 18 | `f09a5b7c6c` | refactor(api): match upstream pinned-fetch connection cleanup | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 19 | `acd45524c0` | test(api): ensure pinned fetch releases streaming headers before body consumption | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 20 | `9dec654b21` | fix(api): do not await pinned HTTP agent close before response body drains | Other runtime or release delta | Not yet established | Pending code and exact-SHA behavior review |
| 21 | `c538cafbdb` | test(ci): run audio URL regression alongside existing transcription tests | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 22 | `3ba86e1a36` | fix(api): accept URL-only speech transcription without leaking remote URL | High-risk behavioral diff | Potentially superseded by official PR (#13102 / #18040 / #18052); prove at code level | Pending code and exact-SHA behavior review |
| 23 | `0399575320` | chore(release): align fork and workspace version with v3.8.52 | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 24 | `a343cf77fb` | fix(fork): recognize handled pooled relay timeout in crash guard | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 25 | `c948697699` | fix(schema): respect explicit preserve-unknown protobuf type option | Other runtime or release delta | Not yet established | Pending code and exact-SHA behavior review |
| 26 | `d8fd91dbb6` | fix(fork): reconcile Gemini schema aliases and Claude diagnostics tests with custom executors | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 27 | `273150d36b` | ci(upstream): cover empty-response crash-guard recovery | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 28 | `c5f0feb99c` | fix(resilience): keep empty_response stream errors from killing the server via the crash guard (#16347) (#16359) | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 29 | `c80a2edb49` | ci(upstream): cover phase-3 schemas, Claude controls and streaming | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 30 | `1520c3c2ea` | fix(sse): normalize OpenAI tool-call IDs longer than 64 characters (#16490) | Other runtime or release delta | Not yet established | Pending code and exact-SHA behavior review |
| 31 | `31f06b5959` | fix(sse): keep generated-image deltas in OpenAI-format streams (#16540) | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 32 | `a87a8c6d00` | fix(claude): drop the Claude Code diagnostics telemetry field Anthropic rejects (#16543) | Other runtime or release delta | Not yet established | Pending code and exact-SHA behavior review |
| 33 | `a7f7929678` | ci(upstream): run phase-2 Codex, resilience, security and usage regressions | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 34 | `df91fb74b1` | fix(usage): retry a usage write once when the database is locked (#16276) | Other runtime or release delta | Not yet established | Pending code and exact-SHA behavior review |
| 35 | `d1521f4c68` | fix(logging): mask URL query credentials and secret headers in request capture, write call-log artifacts 0600 (#16484) | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 36 | `972f5f1560` | fix(codex): retry once without undecryptable reasoning ciphertext (#16288) | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 37 | `f2f61992ef` | fix(codex): convert the fake-200 "servers are currently overloaded" output stream into a 503 (#16287) | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 38 | `540da935fb` | ci(upstream): gate phase-1 retry, SSE tail and Codex replay fixes | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 39 | `403d469e6a` | fix(sse): surface Codex replay-reasoning rejections instead of masking them as STREAM_EARLY_EOF (#16364) (#16375) | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 40 | `486a5ba61f` | fix(sse): honor Google RPC ErrorInfo quota-reset metadata as an upstream retry hint (#16529) | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 41 | `cf149dc6ab` | fix: extend Gemini 3.8 preferred upstream startup to 12s | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 42 | `c42e2614bf` | feat(codex): backport GPT-6.1 Sol catalog, reasoning and identity (#36) | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 43 | `489bd2b421` | fix(codex-images): lift image edit reference cap to 16 in production (#35) | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 44 | `cff3d53ce5` | ci(claude): run Haiku 5.5 node:test via Node instead of Vitest | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 45 | `4b4d7d4659` | test(claude): match fork pricing result shape in Opus 5.5 regression | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 46 | `07fe271727` | feat(antigravity): route Claude 5.5 live effort tiers with regression coverage | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 47 | `42446aecfa` | feat(providers): add Claude Opus 5.5 support (#14546) | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 48 | `948bea0474` | fix(codex-images): isolate ten-minute upstream deadlines | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 49 | `dfce44d971` | fix(codex-images): 5m dedicated no-replay generation timeout | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 50 | `99afac8df3` | fix(codex-images): dedicated GPT Image routes with preserved custom patches (#29) | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 51 | `c9788a464e` | fix(antigravity): dedupe fork existing Gemini 3.7 live catalog aliases | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 52 | `da9e56e37c` | ci: run availability UI regression with Vitest, not node:test | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 53 | `7c6fbdfd99` | ci(release): gate selected upstream backports before one production build | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 54 | `f2da0a7528` | fix(resilience): scope explicit Codex overload cooldown to exact model (#16014) | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 55 | `f6eea5464f` | feat(combos): opt-in auto-prune of stale combo steps after a model sync (#15925) | Other runtime or release delta | Not yet established | Pending code and exact-SHA behavior review |
| 56 | `9b766f505a` | fix(combo): drop malformed custom models from the auto candidate pool (#16069) | Other runtime or release delta | Not yet established | Pending code and exact-SHA behavior review |
| 57 | `00b6ffa29a` | fix(antigravity): accept Gemini Flash tier ids on tiered-only accounts (#15659) (#15735) | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 58 | `cba3d405ed` | ci(codex): scope lint to new files; legacy executor has existing warning | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 59 | `997eb98e78` | ci(codex): gate streaming regressions before production merge | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 60 | `46f8da0a70` | fix(codex): port upstream SSE readiness handoff (#15094) | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 61 | `721f0adc0d` | test(telemetry): isolate account fallback harness | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 62 | `954e997a9d` | feat(telemetry): expose selected Codex account plan | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 63 | `2f5c2b8252` | feat(telemetry): expose account fallback routing diagnostics | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 64 | `aff37f576e` | test(sse): cover expired-token account failover in release gate | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 65 | `c2be16c3fb` | fix(sse): keep expired OAuth tokens in account fallback | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 66 | `3dd781a3c1` | fix(gemini): keep current Flash free-tier models in auto-fetch | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 67 | `dfee30f655` | fix: use native thinking levels for Gemini 3.5 Flash-Lite | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 68 | `1d24c773ff` | ci: gate preferred Antigravity failover | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 69 | `e695fc6ea5` | fix: make preferred Antigravity routing fail over softly | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 70 | `1b99cb29ee` | fix: preserve live-backed Antigravity model aliases | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 71 | `f02788f623` | fix: rebuild foreign Request safely in packaged runtime | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 72 | `7836a3f6f7` | fix: allow trusted upstream start timeout hints | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 73 | `07e92ceb83` | ci: fix Playwright version diagnostic quoting | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 74 | `dba0def270` | ci: install browser for packaged smoke Playwright version | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 75 | `292d188dfa` | fix(cli): normalize unknown port discovery before serve | Other runtime or release delta | Not yet established | Pending code and exact-SHA behavior review |
| 76 | `388104f102` | docs: sync fork migration count | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 77 | `befee7bd04` | ci: cover abort guard and upstream hook isolation | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 78 | `3c8fa2b6c2` | fix(release): avoid migration slot collision and expose CI stack | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 79 | `c4f1a19e95` | fix(docs): sync upstream env and llm mirrors | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 80 | `7b97e4e5e8` | fix(db): rehome preferred-connections after upstream 191 | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 81 | `a2013583f6` | fix(sync): clear upstream quality gate regressions | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 82 | `9b06d5c3ba` | fix(sync): align fork tests with upstream policies | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 83 | `ec487f158f` | fix(db): rehome preferred-connections migration after upstream sync | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 84 | `f925f95080` | feat(antigravity): expose Gemini 3.5 Flash Lite | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 85 | `c1d92fe508` | Resolve upstream integration conflicts | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 86 | `c439dabbfb` | Route Codex Sol only through paid accounts | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 87 | `190d6c0703` | Forward Gemini per-image media resolution | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 88 | `390ef0c5b5` | fix(ci): take the two hosted-runner builds off the PR rail (#11946, option 3) (#11962) | Other runtime or release delta | Not yet established | Pending code and exact-SHA behavior review |
| 89 | `02afe39791` | perf(compression): OOM mitigations for large payload hashing, memoization, and token estimation (#7847) (#11844) | Other runtime or release delta | Not yet established | Pending code and exact-SHA behavior review |
| 90 | `c0f5605abc` | Revert "fix(admission): refresh stale resource pressure observations" | Other runtime or release delta | Not yet established | Pending code and exact-SHA behavior review |
| 91 | `b64dd4c1bd` | fix(resilience): resource_pressure admission gate actively re-samples instead of reading a stale cache (#13823) | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 92 | `da0d5cb1b9` | fix(admission): refresh stale resource pressure observations | Other runtime or release delta | Not yet established | Pending code and exact-SHA behavior review |
| 93 | `91a0838060` | feat(ui): configure per-key connection preference | Other runtime or release delta | Not yet established | Pending code and exact-SHA behavior review |
| 94 | `8230638d51` | fix(auth): expose connection preference in key policy metadata | Other runtime or release delta | Not yet established | Pending code and exact-SHA behavior review |
| 95 | `15242def73` | feat(auth): add per-api-key connection preference | Other runtime or release delta | Potentially superseded by official PR (#13102 / #18040 / #18052); prove at code level | Pending code and exact-SHA behavior review |
| 96 | `9856a59d64` | feat(audio): expand Fish Audio S2.1 and voice cloning | Other runtime or release delta | Not yet established | Pending code and exact-SHA behavior review |
| 97 | `3c2a8c228f` | Preserve paid image artifacts across gateway ambiguity | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 98 | `564095a1ab` | Harden image quota telemetry and artifact retention | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 99 | `17d05f4a26` | Expose Codex image quota telemetry | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 100 | `55d864ecfb` | Remove accidental connector scratch file | Other runtime or release delta | Not yet established | Pending code and exact-SHA behavior review |
| 101 | `581c79c1ad` | x | Other runtime or release delta | Not yet established | Pending code and exact-SHA behavior review |
| 102 | `b7f0ffe55b` | Fail over Codex images on ChatGPT usage limits | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 103 | `1e2c3cf26f` | Fix Codex image routing across account quotas | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 104 | `7e862ce328` | fix(codex): rotate image edits on account quota | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 105 | `6add6aa80a` | fix(codex): import accounts with usable access tokens | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 106 | `83e0dbc814` | fix(codex): make repeated imports idempotent | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |
| 107 | `c22fbab841` | docs(ops): document fork CI policy | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 108 | `c97d21ab3a` | fix(ops): probe canonical home route | Other runtime or release delta | Not yet established | Pending code and exact-SHA behavior review |
| 109 | `a96bd314f7` | ci: build and verify production fork releases | Non-runtime documentation / CI / test | Not yet established | Pending code and exact-SHA behavior review |
| 110 | `aa6a13c466` | feat(usage): preserve scoped Codex image artifacts | High-risk behavioral diff | Not yet established | Pending code and exact-SHA behavior review |

## Completion standard

For each runtime entry, inspect the patch and its touched paths; assign one of **upstream equivalent (with upstream SHA/test)**, **custom ported (with candidate SHA/test)**, **consciously obsolete (reason)**, or **missing (blocker)**. Keep code-level decisions per feature, not by assuming 1 commit = 1 feature. Verify Oscar/Order Forge production behavior with a canary and old-DB compatibility. This register is **an inventory**, not a release-green checklist.
