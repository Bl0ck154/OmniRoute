# Upstream port status — Bl0ck154/OmniRoute

Verified snapshot: 2026-11-21 07:15 UTC. Source and PR status verified through GitHub and local Git ancestry. No live service restart, SQLite migration, package publication, or VPS deployment.

## Fork source synchronization

- Fork PRs #149–[#156](https://github.com/Bl0ck154/OmniRoute/pull/156) are MERGED. Current fork production commit [e4d05f8c](https://github.com/Bl0ck154/OmniRoute/commit/e4d05f8cab95b5b02c9f870df3ad9e3146498874) contains official release/v3.8.55 through a78e2a87ccb8. Git ancestry confirmed: **0 official commits behind, 376 fork-side historical/custom commits ahead**. Those 376 commits are NOT a count of unported changes.
- [#155](https://github.com/Bl0ck154/OmniRoute/pull/155) integrated 206 upstream-side commits including security, usage and bounded SQLite retry improvements. Two test conflicts reconciled; authenticated image catalog now uses a stable API key across upstream cold-build retries. [Exact-head regressions](https://github.com/Bl0ck154/OmniRoute/actions/runs/44877476733) and [nonpublishing packaged candidate build](https://github.com/Bl0ck154/OmniRoute/actions/runs/44877487452) PASSED, source SHA 2fa963b725e0 verified directly in build log. Next.js, CLI, npm pack, install, packaged smoke and manifest all succeeded; release publication was skipped.
- [#156](https://github.com/Bl0ck154/OmniRoute/pull/156) merged one newer upstream MCP/A2A UI test stabilization and added this exact Vitest fixture to the selected fork CI workflow. [Exact-head CI](https://github.com/Bl0ck154/OmniRoute/actions/runs/44879001853) PASSED, including MCP/A2A Vitest, core typecheck and historical SQLite migration rehearsal. Fork-only OrderForge artifact sink, Codex quota/routing policy, legacy SQLite migration compatibility and upstream security guards were preserved. Prior validated fork sync PRs #149–#154 remain merged.
- **No deployment, package release, live DB migration or service restart** was performed. Deployment requires a separate explicit backup, migration and rollback review.

## Upstream contributions

Our author has **49 merged upstream PRs, 19 open (14 implementation and 5 test-only), 6 closed unmerged**. Exact counts checked via GitHub; do not infer unported patch count from fork commit history. Requested human review and hold labels belong to upstream maintainers; no self-queue.

### P0 — security, correctness, unblock CI

- [#20525](https://github.com/cheaper-inference/OmniRoute/pull/20525) — fix(codex): guard OAuth account identity during refresh and quota fetch | MERGEABLE | CI: green (8d31012faf4d)
- [#20178](https://github.com/cheaper-inference/OmniRoute/pull/20178) — fix(codex): sync changed subscription tier from live usage | MERGEABLE | CI: green (ca94adaa17ed)
- [#20079](https://github.com/cheaper-inference/OmniRoute/pull/20079) — feat(gemini): native Gemini Decision 1 endpoint with account fallback | MERGEABLE | CI: green
- [#19867](https://github.com/cheaper-inference/OmniRoute/pull/19867) — test(cursor): freeze countdown when asserting unchanged quota-card markup | MERGEABLE | CI: green

- #20178 refreshed with conflict-free additive upstream merge [ca94adaa17ed](https://github.com/Bl0ck154/OmniRoute/commit/ca94adaa17ed49ccf105c2b61ef0c8c30f374fe7), preserving the 5-file +310 feature diff. Upstream independently fixed the previously failing ENOTEMPTY teardown test in commit 1afd7d6135, so external [#20333](https://github.com/cheaper-inference/OmniRoute/pull/20333) is no longer a prerequisite. The updated exact-head CI is underway; ignore old failure runs.
- #20525 OAuth identity-fence PR updated to upstream through additive merge 8d31012faf (six-file +315/-1 implementation, redundant old timestamp-test hunk dropped), CI restarted. #19867 and #20079 remain green and await maintainer review.

### P1 — routing, resilience, image and model correctness

- [#20331](https://github.com/cheaper-inference/OmniRoute/pull/20331) — fix(gemini): normalize and validate explicit thinkingLevel overrides | MERGEABLE | CI: green
- [#19940](https://github.com/cheaper-inference/OmniRoute/pull/19940) — fix(gemini): retain stable Flash free-tier models in free-only imports | MERGEABLE | CI: green
- [#19890](https://github.com/cheaper-inference/OmniRoute/pull/19890) — fix(antigravity): preserve pre-response timeout marker for agy alias | MERGEABLE | CI: green
- [#19874](https://github.com/cheaper-inference/OmniRoute/pull/19874) — fix(responses): prune expired pending continuations before reporting count | MERGEABLE | CI: green
- [#19681](https://github.com/cheaper-inference/OmniRoute/pull/19681) — fix(combos): isolate stale model badge failures per provider | MERGEABLE | CI: green
- [#19667](https://github.com/cheaper-inference/OmniRoute/pull/19667) — fix(codex-images): allow 128 verified hosted Responses edit references | MERGEABLE | CI: green
- [#19592](https://github.com/cheaper-inference/OmniRoute/pull/19592) — feat(codex): opt-in selected-account plan header for troubleshooting | MERGEABLE | CI: green
- [#19258](https://github.com/cheaper-inference/OmniRoute/pull/19258) — fix(routing): account for preferred timeout fallback in telemetry | MERGEABLE | CI: RUNNING after c247ad050f18 conflict resolution (2-file +75/-3 diff; removed upstream-superseded negative-TTL test hunk).
- [#19167](https://github.com/cheaper-inference/OmniRoute/pull/19167) — feat(images): expose opt-in Codex quota snapshots from successful images | MERGEABLE | CI: green
- [#19132](https://github.com/cheaper-inference/OmniRoute/pull/19132) — feat(antigravity): opt-in bounded per-account/model health quarantine | MERGEABLE | CI: RUNNING after 74bdcd5288b5 fix of maintainer-reported shadow-queue resilience API key-set regression. Integration test now asserts stored antigravityAdaptiveHealth is only a boolean enabled config; [maintainer response](https://github.com/cheaper-inference/OmniRoute/pull/19132#issuecomment-7058901025). Hold label remains until maintainer validates rerun.

### P2 — catalog feature and test stabilization

- [#18738](https://github.com/cheaper-inference/OmniRoute/pull/18738) — feat(models): support GPT-6.1 Terra in OpenAI API and Codex | MERGEABLE | CI: green (01781da04c16)
- [#19950](https://github.com/cheaper-inference/OmniRoute/pull/19950) — test(openrouter): cover invalid regex removal predicate and count | MERGEABLE | CI: green
- [#19949](https://github.com/cheaper-inference/OmniRoute/pull/19949) — test(gemini): cover bounded cached input token reporting | MERGEABLE | CI: green
- [#19948](https://github.com/cheaper-inference/OmniRoute/pull/19948) — test(media): ensure DNS-pinned fetch returns before streamed body ends | MERGEABLE | CI: green
- [#19680](https://github.com/cheaper-inference/OmniRoute/pull/19680) — test(providers): isolate delayed credential probes across POST assertions | MERGEABLE | CI: green

- #18738 Terra PR updated at 01781da04c16, 18-file +253/-28 feature diff, **31 successful checks**. #20178 Codex live-plan PR at ca94adaa17ed, 5-file +310 diff, **31 successful checks**. Both CLEAN/MERGEABLE and awaiting maintainer review.

## Previously ported or rejected

- Confirmed upstream merges include [#17961](https://github.com/cheaper-inference/OmniRoute/pull/17961) (Codex paid models), [#18733](https://github.com/cheaper-inference/OmniRoute/pull/18733) (false global 503), [#19165](https://github.com/cheaper-inference/OmniRoute/pull/19165) (image credential scope), [#19171](https://github.com/cheaper-inference/OmniRoute/pull/19171) (Combo identity binding), [#19134](https://github.com/cheaper-inference/OmniRoute/pull/19134) (image/text quota isolation), [#19259](https://github.com/cheaper-inference/OmniRoute/pull/19259) (preferred failover), [#19590](https://github.com/cheaper-inference/OmniRoute/pull/19590) (CLI diagnostics). For all merged PRs, see [the verified author query](https://github.com/cheaper-inference/OmniRoute/pulls?q=is%3Apr+is%3Amerged+author%3ABl0ck154).
- [#20332](https://github.com/cheaper-inference/OmniRoute/pull/20332) was closed as redundant existing tier coverage; [#19593](https://github.com/cheaper-inference/OmniRoute/pull/19593) superseded by open #19667; [#19050](https://github.com/cheaper-inference/OmniRoute/pull/19050) superseded by merged #19165; [#19166](https://github.com/cheaper-inference/OmniRoute/pull/19166) by merged #18895. Avoid reintroducing retired Sonnet 4.5 or old Antigravity hot-settings. [#19865](https://github.com/cheaper-inference/OmniRoute/pull/19865) closed Nov 20 as superseded by upstream 1ebb33cc2f, which now asserts exact per-scope Codex quota observations. [#19866](https://github.com/cheaper-inference/OmniRoute/pull/19866) was closed Nov 21 as superseded by upstream 31be32598e, which mock-timers the negative proxy-cache TTL without changing global Date.now.
- Runtime patch review after source sync: 41 runtime files differ from upstream, with 14 file paths not touched by any active upstream PR. Those are predominantly fork-specific OrderForge artifact handling, packaging, SQLite compatibility, image telemetry and aliases. **These path counts do not measure missing patches.** No new independently reproduced upstream-worthy fix confirmed.

## Next specific actions

1. Prioritize upstream #19132 shadow-queue regression: fix submitted at 74bdcd5288, exact-head CI running, request maintainer to rerun Integration Tests (2/2) and remove hold only after success. Also check #19258 exact-head tests.
2. Keep green #20525, #20178, #18738, #20079, #19867 and remaining PRs ready for upstream human review. Reviews already requested; avoid duplicate requests, self-queue or manipulating hold labels.
3. Fork source sync #155 and #156 are complete. Before any separate production deployment, require an explicit backup, migration, canary and rollback plan; no live deployment was performed here. When official upstream advances again, review diffs before a new source-only sync.

Historical details remain available in Git history and [fork patch register](maintenance/FORK_PATCH_REGISTER.md).
