# Upstream port status — Bl0ck154/OmniRoute

Verified snapshot: 2026-11-20 04:40 UTC. This file tracks GitHub source and PR work, NOT deployment of the running VPS or production SQLite.

## Fork source synchronization

- Fork PR [#149](https://github.com/Bl0ck154/OmniRoute/pull/149) and [#150](https://github.com/Bl0ck154/OmniRoute/pull/150) MERGED Nov 19; fork [#151](https://github.com/Bl0ck154/OmniRoute/pull/151), [#152](https://github.com/Bl0ck154/OmniRoute/pull/152) and [#153](https://github.com/Bl0ck154/OmniRoute/pull/153) MERGED Nov 20. Source sync at e9cd42b6f0f7 includes official release/v3.8.55 at bd9b1324abb8; Git ancestry verified: upstream behind-count **0**. The 366 fork-side historical commits are NOT missing upstream patches.
- [#151 candidate build](https://github.com/Bl0ck154/OmniRoute/actions/runs/44673297176) passed from exact source SHA 75beeb7; Next.js, CLI, npm pack, packaged smoke and manifest successful. [#151 regressions](https://github.com/Bl0ck154/OmniRoute/actions/runs/44673246007), [#152 regressions](https://github.com/Bl0ck154/OmniRoute/actions/runs/44674902154), and [#153 regressions](https://github.com/Bl0ck154/OmniRoute/actions/runs/44675537956) all passed.
- #151 preserved fork OrderForge artifacts, legacy SQLite compatibility, Codex quota and routing, resolved one Antigravity model conflict by adding four Gemini 4 Hydrogen IDs without duplicates. #152 removed a duplicate header helper and restored upstream response-policy preservation while retaining the selected Codex plan header. #153 brought 22 upstream test-only changes.
- **No deployment, package release, live DB migration or service restart** was performed. Deployment requires a separate explicit backup, migration and rollback review.

## Upstream contributions

Our author has **49 merged upstream PRs, 21 open and four closed unmerged**. All open PRs are mergeable in the latest observed review; none has human maintainer approval. Do not add queue labels or bypass owner review. The list below describes open PRs, not unported Git commit counts.

### P0 — security, correctness, unblock CI

- [#20525](https://github.com/cheaper-inference/OmniRoute/pull/20525) — fix(codex): guard OAuth account identity during refresh and quota fetch | MERGEABLE | CI: green
- [#20178](https://github.com/cheaper-inference/OmniRoute/pull/20178) — fix(codex): sync changed subscription tier from live usage | MERGEABLE | CI: RUNNING
- [#20079](https://github.com/cheaper-inference/OmniRoute/pull/20079) — feat(gemini): native Gemini Decision 1 endpoint with account fallback | MERGEABLE | CI: green
- [#19867](https://github.com/cheaper-inference/OmniRoute/pull/19867) — test(cursor): freeze countdown when asserting unchanged quota-card markup | MERGEABLE | CI: green

- #20178 refreshed with conflict-free additive upstream merge [ca94adaa17ed](https://github.com/Bl0ck154/OmniRoute/commit/ca94adaa17ed49ccf105c2b61ef0c8c30f374fe7), preserving the 5-file +310 feature diff. Upstream independently fixed the previously failing ENOTEMPTY teardown test in commit 1afd7d6135, so external [#20333](https://github.com/cheaper-inference/OmniRoute/pull/20333) is no longer a prerequisite. The updated exact-head CI is underway; ignore old failure runs.
- #19867 separately fixes a live countdown in the Cursor quota UI test; current CI green. #20525 and #20079 also green and await upstream maintainer review.

### P1 — routing, resilience, image and model correctness

- [#20331](https://github.com/cheaper-inference/OmniRoute/pull/20331) — fix(gemini): normalize and validate explicit thinkingLevel overrides | MERGEABLE | CI: green
- [#19940](https://github.com/cheaper-inference/OmniRoute/pull/19940) — fix(gemini): retain stable Flash free-tier models in free-only imports | MERGEABLE | CI: green
- [#19890](https://github.com/cheaper-inference/OmniRoute/pull/19890) — fix(antigravity): preserve pre-response timeout marker for agy alias | MERGEABLE | CI: green
- [#19874](https://github.com/cheaper-inference/OmniRoute/pull/19874) — fix(responses): prune expired pending continuations before reporting count | MERGEABLE | CI: green
- [#19681](https://github.com/cheaper-inference/OmniRoute/pull/19681) — fix(combos): isolate stale model badge failures per provider | MERGEABLE | CI: green
- [#19667](https://github.com/cheaper-inference/OmniRoute/pull/19667) — fix(codex-images): allow 128 verified hosted Responses edit references | MERGEABLE | CI: green
- [#19592](https://github.com/cheaper-inference/OmniRoute/pull/19592) — feat(codex): opt-in selected-account plan header for troubleshooting | MERGEABLE | CI: green
- [#19258](https://github.com/cheaper-inference/OmniRoute/pull/19258) — fix(routing): account for preferred timeout fallback in telemetry | MERGEABLE | CI: green
- [#19167](https://github.com/cheaper-inference/OmniRoute/pull/19167) — feat(images): expose opt-in Codex quota snapshots from successful images | MERGEABLE | CI: green
- [#19132](https://github.com/cheaper-inference/OmniRoute/pull/19132) — feat(antigravity): opt-in bounded per-account/model health quarantine | MERGEABLE | CI: green

### P2 — catalog feature and test stabilization

- [#18738](https://github.com/cheaper-inference/OmniRoute/pull/18738) — feat(models): support GPT-6.1 Terra in OpenAI API and Codex | MERGEABLE | CI: RUNNING
- [#19950](https://github.com/cheaper-inference/OmniRoute/pull/19950) — test(openrouter): cover invalid regex removal predicate and count | MERGEABLE | CI: green
- [#19949](https://github.com/cheaper-inference/OmniRoute/pull/19949) — test(gemini): cover bounded cached input token reporting | MERGEABLE | CI: green
- [#19948](https://github.com/cheaper-inference/OmniRoute/pull/19948) — test(media): ensure DNS-pinned fetch returns before streamed body ends | MERGEABLE | CI: green
- [#19866](https://github.com/cheaper-inference/OmniRoute/pull/19866) — test(proxy): make negative-cache TTL check independent of CI scheduling | MERGEABLE | CI: green
- [#19865](https://github.com/cheaper-inference/OmniRoute/pull/19865) — test(codex): accept independently observed quota cache timestamps | MERGEABLE | CI: green
- [#19680](https://github.com/cheaper-inference/OmniRoute/pull/19680) — test(providers): isolate delayed credential probes across POST assertions | MERGEABLE | CI: green

- #18738 GPT-6.1 Terra conflict repaired with additive merge [01781da04c16](https://github.com/Bl0ck154/OmniRoute/commit/01781da04c16d5cf4adac8b1fd0a5dccbddde046), retaining upstream's equivalent VS Code reasoning metadata. PR now 18 files +253/-28 and CI is underway.

## Previously ported or rejected

- Confirmed upstream merges include [#17961](https://github.com/cheaper-inference/OmniRoute/pull/17961) (Codex paid models), [#18733](https://github.com/cheaper-inference/OmniRoute/pull/18733) (false global 503), [#19165](https://github.com/cheaper-inference/OmniRoute/pull/19165) (image credential scope), [#19171](https://github.com/cheaper-inference/OmniRoute/pull/19171) (Combo identity binding), [#19134](https://github.com/cheaper-inference/OmniRoute/pull/19134) (image/text quota isolation), [#19259](https://github.com/cheaper-inference/OmniRoute/pull/19259) (preferred failover), [#19590](https://github.com/cheaper-inference/OmniRoute/pull/19590) (CLI diagnostics). For all merged PRs, see [the verified author query](https://github.com/cheaper-inference/OmniRoute/pulls?q=is%3Apr+is%3Amerged+author%3ABl0ck154).
- [#20332](https://github.com/cheaper-inference/OmniRoute/pull/20332) was closed as redundant existing tier coverage; [#19593](https://github.com/cheaper-inference/OmniRoute/pull/19593) superseded by open #19667; [#19050](https://github.com/cheaper-inference/OmniRoute/pull/19050) superseded by merged #19165; [#19166](https://github.com/cheaper-inference/OmniRoute/pull/19166) by merged #18895. Avoid reintroducing retired Sonnet 4.5 or old Antigravity hot-settings.
- After current source sync, 41 runtime files differ between fork and upstream; only 14 paths are untouched by the 21 open PRs. These include fork-specific OrderForge artifact capture, CI packaging, SQLite compatibility, image quota telemetry and minor alias adaptations. **Path counts are not missing patch counts.** No additional independently reproducible upstream-worthy patch confirmed.

## Next specific actions

1. Recheck exact-head CI for upstream #20178 and #18738. Repair introduced failures only; separate unrelated existing CI flakes. Do not re-open #20333 or create test-fix duplicates without a new reproducer.
2. Keep green P0 #20525, #20079 and #19867 ready for diegosouzapw's requested human review; then P1 and P2 in the table. Never self-queue upstream PRs.
3. If official upstream advances again, sync source in a small, validated GitHub-only PR, keeping local custom patches intact. Do not infer live deployment from GitHub merges.

Historical details remain available in Git history and [fork patch register](maintenance/FORK_PATCH_REGISTER.md).
