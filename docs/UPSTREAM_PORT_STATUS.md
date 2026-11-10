# Upstream port status — Bl0ck154/OmniRoute

Last verified: **2026-11-10** using GitHub repository/compare, PR metadata, reviews, and exact-head workflow results. This is a handoff snapshot, not a deployment approval. See [the fork patch register](maintenance/FORK_PATCH_REGISTER.md) and [upgrade runbook](maintenance/UPSTREAM_UPGRADE_RUNBOOK.md).

## Repository divergence / synchronization

- Upstream: [`cheaper-inference/OmniRoute`](https://github.com/cheaper-inference/OmniRoute), default branch `release/v3.8.54`.
- Fork: [`Bl0ck154/OmniRoute`](https://github.com/Bl0ck154/OmniRoute), default/deploy source `production` @ `44227d2b842d`.
- GitHub compare `cheaper-inference:release/v3.8.54...production`: **257 ahead / 421 behind**, merge base `96eb88c1ee48`. These numbers do not mean 257 still-unported patches; old history, cherry-picks, squash merges, and fork-only integrations are mixed together.
- [Fork sync PR #125](https://github.com/Bl0ck154/OmniRoute/pull/125) is **OPEN, mergeable, NOT integrated** into `production`; head **`009d765f72de`** follows two-parent upstream merge `d9c088b4c193`, incorporating official upstream **through `96bf7457b049`**. Its integration branch is **0 commits behind** the checked upstream default. Thirteen conflicted files were reconciled; the candidate build [#42813742659](https://github.com/Bl0ck154/OmniRoute/actions/runs/42813742659) caught two duplicate imports. Both were removed in `009d765f`; new off-host build [#42828879510](https://github.com/Bl0ck154/OmniRoute/actions/runs/42828879510) was started with `custom_revision=47`, `publish_release=false`. No live deployment.
- **Do not** blind-sync `production`, change production, or run builds on the VPS. For the `d9c088b4` integration head, [Codex SSE regression](https://github.com/Bl0ck154/OmniRoute/actions/runs/42813643142) and [Selected upstream regressions](https://github.com/Bl0ck154/OmniRoute/actions/runs/42813643173) **passed**, including synthetic SQLite migration compatibility rehearsal. The first full off-host build [#42813742659](https://github.com/Bl0ck154/OmniRoute/actions/runs/42813742659) **FAILED** due to two duplicate imports; the fixed-head candidate [#42828879510](https://github.com/Bl0ck154/OmniRoute/actions/runs/42828879510) is pending. **Do not merge #125 or deploy until the new exact-head build passes**.
- Git now reports **212 patch-id-unmatched non-merge commits** on fork `production` against current upstream (0 exact patch-id matches). **These are historical commits, not 212 outstanding feature patches**: many have been merged via squash or differently implemented. After the integration merge, `git diff upstream..sync-head` finds **167 changed paths (50 code paths, 54 tests, 63 others)**. Preserve fork-only integrations; a behavioral inventory is required before assigning a true unported-patch count.

## Accepted upstream contributions (selected, verified merged)

| Area | Merged upstream PRs |
| --- | --- |
| Security / auth / import | [#17961](https://github.com/cheaper-inference/OmniRoute/pull/17961) paid-only Codex plan gating; [#18915](https://github.com/cheaper-inference/OmniRoute/pull/18915) admin-scope resilience changes; [#18841](https://github.com/cheaper-inference/OmniRoute/pull/18841) token preservation; [#18848](https://github.com/cheaper-inference/OmniRoute/pull/18848) Gemini billing cooldown |
| Memory / throughput | [#19150](https://github.com/cheaper-inference/OmniRoute/pull/19150), [#19151](https://github.com/cheaper-inference/OmniRoute/pull/19151), [#19152](https://github.com/cheaper-inference/OmniRoute/pull/19152), [#19146](https://github.com/cheaper-inference/OmniRoute/pull/19146), [#19139](https://github.com/cheaper-inference/OmniRoute/pull/19139), [#19138](https://github.com/cheaper-inference/OmniRoute/pull/19138), [#19055](https://github.com/cheaper-inference/OmniRoute/pull/19055), [#19054](https://github.com/cheaper-inference/OmniRoute/pull/19054), [#19053](https://github.com/cheaper-inference/OmniRoute/pull/19053), [#19052](https://github.com/cheaper-inference/OmniRoute/pull/19052) |
| Routing / timeouts / model catalog | [#19163](https://github.com/cheaper-inference/OmniRoute/pull/19163), [#19162](https://github.com/cheaper-inference/OmniRoute/pull/19162), [#18917](https://github.com/cheaper-inference/OmniRoute/pull/18917), [#18916](https://github.com/cheaper-inference/OmniRoute/pull/18916), [#18842](https://github.com/cheaper-inference/OmniRoute/pull/18842), [#18890](https://github.com/cheaper-inference/OmniRoute/pull/18890), [#18052](https://github.com/cheaper-inference/OmniRoute/pull/18052), [#19263](https://github.com/cheaper-inference/OmniRoute/pull/19263) |
| Media, migrations, regressions | [#18891](https://github.com/cheaper-inference/OmniRoute/pull/18891), [#18844](https://github.com/cheaper-inference/OmniRoute/pull/18844), [#18040](https://github.com/cheaper-inference/OmniRoute/pull/18040), [#18100](https://github.com/cheaper-inference/OmniRoute/pull/18100), [#18096](https://github.com/cheaper-inference/OmniRoute/pull/18096), [#19164](https://github.com/cheaper-inference/OmniRoute/pull/19164), [#19180](https://github.com/cheaper-inference/OmniRoute/pull/19180) |

The connected account also has older merged upstream PRs; this is an intentionally concise register of representative accepted patches, not a total contribution count.

## Currently open upstream PRs (15; reviewed 2026-11-10)

| Priority | PR | Verified head / CI / next step |
| --- | --- | --- |
| P0 | [#18733](https://github.com/cheaper-inference/OmniRoute/pull/18733) cgroup-cache false 503 | Head `00f26b3`, mergeable. Maintainer retargeted to v3.8.54. Reviewed feedback addressed. API Typecheck/Semgrep green; fresh CI/Quality Gates **queued**, do not represent as passing. |
| P0 | [#19165](https://github.com/cheaper-inference/OmniRoute/pull/19165) image API-key scope | `049a7725`, mergeable; all four workflow runs **passed**. Previous noauth scope regression fixed with a test. Await review. |
| P0 | [#19134](https://github.com/cheaper-inference/OmniRoute/pull/19134) hosted-image quota isolation | `ab94bf1a`, mergeable; all four workflows **passed**, resolved review threads. Await review. |
| P0 | [#19171](https://github.com/cheaper-inference/OmniRoute/pull/19171) combo prompt-cache account binding | `637f4fcd`, mergeable; all four workflows **passed**, review thread resolved. Await review. |
| P1 | [#19667](https://github.com/cheaper-inference/OmniRoute/pull/19667) 128 verified hosted edits | `60267143`, mergeable. API Typecheck/Semgrep green; CI/Quality Gates **pending/queued**. |
| P1 | [#19680](https://github.com/cheaper-inference/OmniRoute/pull/19680) delayed credential-probe test isolation | `79da76e7`, mergeable; **queued** new CI. Test uses request-local `AsyncLocalStorage` and covers a prior request's delayed probe. |
| P1 | [#19681](https://github.com/cheaper-inference/OmniRoute/pull/19681) combo stale-model badge fault isolation | `f5f2f29f`, mergeable. **New 3-file upstream PR** from current v3.8.54; a provider catalog failure no longer hides badges from other providers; focused regression test added. Four CI workflows **queued**, not yet passed. |
| P1 | [#18895](https://github.com/cheaper-inference/OmniRoute/pull/18895) Gemini 3.5 Flash-Lite thinkingLevel | `d4e39762`, mergeable. Focused tests/build passed, but CI/Quality Gates red on **repository-wide CodeQL alerts ratchet**; no confirmed PR-specific failure. |
| P1 | [#18738](https://github.com/cheaper-inference/OmniRoute/pull/18738) Terra model support | `2f5532d7`, mergeable; all four workflows **passed**; await review. |
| P1 | [#19132](https://github.com/cheaper-inference/OmniRoute/pull/19132) bounded Antigravity health quarantine | `7b282c6d`, mergeable; CI/Quality Gates red from repository-wide CodeQL ratchet, no confirmed PR-specific failing job; review threads resolved. |
| P1 | [#19258](https://github.com/cheaper-inference/OmniRoute/pull/19258) preferred-account failover | `3a74f399`, mergeable; CodeQL ratchet blocks CI/Quality Gates; dependent settings are in #19259. |
| P1 | [#19259](https://github.com/cheaper-inference/OmniRoute/pull/19259) preferred failover hot settings | `2d75e1b8`, mergeable; CodeQL ratchet blocks CI/Quality Gates, review thread resolved. |
| P1 | [#19167](https://github.com/cheaper-inference/OmniRoute/pull/19167) image quota snapshots | `16a7327a`, mergeable; **one unit shard fails** in unrelated `provider-create-binding-15970.test.ts` from an asynchronous probe of a previous request (expected 0 fetches, observed 1); #19680 addresses this fixture. CodeQL ratchet also fails. Do not duplicate #19680's change inside #19167. |
| P2 | [#19590](https://github.com/cheaper-inference/OmniRoute/pull/19590) opt-in CLI stack traces | `d4fe07c1`, mergeable; Typecheck/Semgrep passed, CI/Quality Gates queued/in progress. |
| P2 | [#19592](https://github.com/cheaper-inference/OmniRoute/pull/19592) opt-in Codex plan header | `f0e8c12f`, mergeable; latest docs-contract fix already pushed, Typecheck/Semgrep passed; CI running/Quality Gates queued. |

**Upstream-wide failure ≠ PR failure.** Several PRs are red solely on the CodeQL alerts ratchet. Do not weaken the security gate merely to green individual PRs. The live release captain/maintainer controls upstream changes.

## Superseded / deliberately not ported

- [#17961](https://github.com/cheaper-inference/OmniRoute/pull/17961) **merged** 2026-11-08; do not duplicate its plan eligibility patch.
- Fork [#46](https://github.com/Bl0ck154/OmniRoute/pull/46) pinned-fetch close repair: equivalent behavior already shipped upstream. Do not re-port.
- Upstream [#19050](https://github.com/cheaper-inference/OmniRoute/pull/19050) closed without merge; superseded by open scoped security fix #19165.
- Upstream [#19166](https://github.com/cheaper-inference/OmniRoute/pull/19166) closed without merge; native thinking changes tracked in #18895.
- Upstream [#19593](https://github.com/cheaper-inference/OmniRoute/pull/19593) closed without merge; reference-cap work is now in #19667.
- `open-sse/utils/earlyStreamKeepalive.ts`: upstream has additional safe SSE end-of-event boundary logic absent from fork; **do not overwrite upstream** with older fork implementation.
- `open-sse/utils/proxyFetch.ts`: upstream refactored transport into `proxyFetchTransport.ts`/support modules. Fork's monolithic module is not suitable for direct copy/cherry-pick; review each remaining invariant separately.
- `src/lib/usage/orderForgeImageArtifactSink.ts` is a fork-specific Order Forge integration, not an upstream feature by default. Fork SQL 194/900 migration bridge is deployment compatibility infrastructure, not a general upstream cherry-pick.

## Next precise actions

1. Check exact-head CI on new #19681 (four workflows queued), including the provider-fault isolation regression. Let #19680 run to completion, then verify its isolated unit test and re-check #19167 against the newest upstream base; do not duplicate that fixture patch.
2. Check exact-head CI/Quality Gates on #18733, #19667, #19590 and #19592; distinguish actual test failure from queue/CodeQL ratchet. Fix only a reproducible PR-local defect.
3. Before merging the now-current #125, verify all exact-head workflows, the off-host custom candidate's source SHA/manifest and full migration rehearsals for fork 194/900 plus official 223/224/233. **No production promotion on Git conflict resolution alone**.
4. In a disposable off-host Git checkout, use `git merge-base`, `git log --left-right --cherry-pick`, `git cherry`, `git diff --stat`, and `git patch-id --stable` against current upstream. Exclude merged PRs and already open heads, and inspect only selected small unported code patches; verify equivalent upstream behavior after squash/rebase.
5. Update this file after each meaningful PR merge/fix or fork integration milestone. Create new small upstream PRs only for verified, independent missing behavior with focused tests. Do not install or build on the VPS.
