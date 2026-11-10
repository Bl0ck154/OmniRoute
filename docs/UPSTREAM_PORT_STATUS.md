# Upstream port status — Bl0ck154/OmniRoute

Last verified: **2026-11-10** using GitHub repository/compare, PR metadata, reviews, and exact-head workflow results. This is a handoff snapshot, not a deployment approval. See [the fork patch register](maintenance/FORK_PATCH_REGISTER.md) and [upgrade runbook](maintenance/UPSTREAM_UPGRADE_RUNBOOK.md).

## Repository divergence / synchronization

- Upstream: [`cheaper-inference/OmniRoute`](https://github.com/cheaper-inference/OmniRoute), default branch `release/v3.8.54`.
- Fork: [`Bl0ck154/OmniRoute`](https://github.com/Bl0ck154/OmniRoute), default/deploy source `production` at merge commit **`ca0ac430b4baaad44605819bce21db03578dc949`** ([sync PR #125](https://github.com/Bl0ck154/OmniRoute/pull/125) **MERGED** on 2026-11-10).
- Integration source: `f67644fd4690af3670637526ba93d39edfe45d17`, official upstream `release/v3.8.54` through **`328df30c46322460de28c048c3b66b4a5f536981`**. GitHub merge commit preserves fork-only Order Forge, Antigravity resilience and historical SQLite mappings. It was zero commits behind that pinned upstream release commit when tested. Afterward, upstream advanced **one additional commit `895c0f3571`** (official ChatGPT sign-in #15201), which is **not included** in the verified fork merge; revisit it in a separate incremental sync.
- **Build/verification:** [GitHub Actions candidate #42832054388](https://github.com/Bl0ck154/OmniRoute/actions/runs/42832054388) **PASSED** off-host Next.js build, CLI build, npm package, packaged launcher/dashboard smoke, lint and focused tests. Build log proves `SOURCE_COMMIT=f67644fd4690af3670637526ba93d39edfe45d17`; artifact `omniroute-48-candidate` was retained but **not published or installed**. Exact-head `Codex SSE regression` and `Selected upstream regressions` **PASSED**, including synthetic old-fork SQLite migrations and core typecheck. Initial webpack-failing build #42813742659 was fixed in `009d765f`, and candidate #42828879510 also passed.
- Documentation [PR #135](https://github.com/Bl0ck154/OmniRoute/pull/135) **MERGED** by squash commit `6f831ae4b65d50004d6c720b783c55cf84fa672d`.
- **Live server left unchanged:** `3.8.53-custom.44` was active when checked on 2026-11-10; authenticated status HTTP 200, unauthenticated API guard 401. A GitHub `production` merge is **not** a deployment. Do not run builds on the VPS. Installing this migration-heavy fork release requires the separate manual updater runbook, backup/recovery plan and post-install validation. Package rollback alone does not roll back SQLite.
- **Patch count:** historical `git cherry` returned 212 patch-id-unmatched non-merge fork commits before the sync; this is **not** 212 remaining upstream patches. At the synced upstream snapshot, there were 167 remaining differing paths (50 code, 54 tests, 63 other), many from 13 currently open upstream PRs and intentionally fork-specific integrations. Content-level triage of truly unproposed upstream patches remains pending.

## Accepted upstream contributions (selected, verified merged)

- **New on 2026-11-10:** [#18895](https://github.com/cheaper-inference/OmniRoute/pull/18895) Gemini 3.5 native thinking and [#19259](https://github.com/cheaper-inference/OmniRoute/pull/19259) generalized preferred-account failover settings are merged in official `release/v3.8.54` through `328df30c`. Both were reconciled with the fork-specific implementation in integration PR #125.

| Area | Merged upstream PRs |
| --- | --- |
| Security / auth / import | [#17961](https://github.com/cheaper-inference/OmniRoute/pull/17961) paid-only Codex plan gating; [#18915](https://github.com/cheaper-inference/OmniRoute/pull/18915) admin-scope resilience changes; [#18841](https://github.com/cheaper-inference/OmniRoute/pull/18841) token preservation; [#18848](https://github.com/cheaper-inference/OmniRoute/pull/18848) Gemini billing cooldown |
| Memory / throughput | [#19150](https://github.com/cheaper-inference/OmniRoute/pull/19150), [#19151](https://github.com/cheaper-inference/OmniRoute/pull/19151), [#19152](https://github.com/cheaper-inference/OmniRoute/pull/19152), [#19146](https://github.com/cheaper-inference/OmniRoute/pull/19146), [#19139](https://github.com/cheaper-inference/OmniRoute/pull/19139), [#19138](https://github.com/cheaper-inference/OmniRoute/pull/19138), [#19055](https://github.com/cheaper-inference/OmniRoute/pull/19055), [#19054](https://github.com/cheaper-inference/OmniRoute/pull/19054), [#19053](https://github.com/cheaper-inference/OmniRoute/pull/19053), [#19052](https://github.com/cheaper-inference/OmniRoute/pull/19052) |
| Routing / timeouts / model catalog | [#19163](https://github.com/cheaper-inference/OmniRoute/pull/19163), [#19162](https://github.com/cheaper-inference/OmniRoute/pull/19162), [#18917](https://github.com/cheaper-inference/OmniRoute/pull/18917), [#18916](https://github.com/cheaper-inference/OmniRoute/pull/18916), [#18842](https://github.com/cheaper-inference/OmniRoute/pull/18842), [#18890](https://github.com/cheaper-inference/OmniRoute/pull/18890), [#18052](https://github.com/cheaper-inference/OmniRoute/pull/18052), [#19263](https://github.com/cheaper-inference/OmniRoute/pull/19263) |
| Media, migrations, regressions | [#18891](https://github.com/cheaper-inference/OmniRoute/pull/18891), [#18844](https://github.com/cheaper-inference/OmniRoute/pull/18844), [#18040](https://github.com/cheaper-inference/OmniRoute/pull/18040), [#18100](https://github.com/cheaper-inference/OmniRoute/pull/18100), [#18096](https://github.com/cheaper-inference/OmniRoute/pull/18096), [#19164](https://github.com/cheaper-inference/OmniRoute/pull/19164), [#19180](https://github.com/cheaper-inference/OmniRoute/pull/19180) |

The connected account also has older merged upstream PRs; this is an intentionally concise register of representative accepted patches, not a total contribution count.

## Currently open upstream PRs (13; reviewed 2026-11-10)

| Priority | PR | Verified head / CI / next step |
| --- | --- | --- |
| P0 | [#18733](https://github.com/cheaper-inference/OmniRoute/pull/18733) cgroup-cache false 503 | Head `00f26b3`, mergeable. Maintainer retargeted to v3.8.54. Reviewed feedback addressed. API Typecheck/Semgrep green; fresh CI/Quality Gates **queued**, do not represent as passing. |
| P0 | [#19165](https://github.com/cheaper-inference/OmniRoute/pull/19165) image API-key scope | `049a7725`, mergeable; all four workflow runs **passed**. Previous noauth scope regression fixed with a test. Await review. |
| P0 | [#19134](https://github.com/cheaper-inference/OmniRoute/pull/19134) hosted-image quota isolation | `ab94bf1a`, mergeable; all four workflows **passed**, resolved review threads. Await review. |
| P0 | [#19171](https://github.com/cheaper-inference/OmniRoute/pull/19171) combo prompt-cache account binding | `637f4fcd`, mergeable; all four workflows **passed**, review thread resolved. Await review. |
| P1 | [#19667](https://github.com/cheaper-inference/OmniRoute/pull/19667) 128 verified hosted edits | `60267143`, mergeable. API Typecheck/Semgrep green; CI/Quality Gates **pending/queued**. |
| P1 | [#19680](https://github.com/cheaper-inference/OmniRoute/pull/19680) delayed credential-probe test isolation | `79da76e7`, mergeable; **queued** new CI. Test uses request-local `AsyncLocalStorage` and covers a prior request's delayed probe. |
| P1 | [#19681](https://github.com/cheaper-inference/OmniRoute/pull/19681) combo stale-model badge fault isolation | `f5f2f29f`, mergeable. **New 3-file upstream PR** from current v3.8.54; a provider catalog failure no longer hides badges from other providers; focused regression test added. Four CI workflows **queued**, not yet passed. |
| P1 | [#18738](https://github.com/cheaper-inference/OmniRoute/pull/18738) Terra model support | `2f5532d7`, mergeable; all four workflows **passed**; await review. |
| P1 | [#19132](https://github.com/cheaper-inference/OmniRoute/pull/19132) bounded Antigravity health quarantine | `7b282c6d`, mergeable; CI/Quality Gates red from repository-wide CodeQL ratchet, no confirmed PR-specific failing job; review threads resolved. |
| P1 | [#19258](https://github.com/cheaper-inference/OmniRoute/pull/19258) preferred-account failover | `3a74f399`, mergeable; CodeQL ratchet blocks CI/Quality Gates; the separate hot-settings upstream PR #19259 has **merged**; check remaining overlap before further changes. |
| P1 | [#19167](https://github.com/cheaper-inference/OmniRoute/pull/19167) image quota snapshots | `6d90e02c`, latest visible head; previously observed failures (recheck new head); **one unit shard fails** in unrelated `provider-create-binding-15970.test.ts` from an asynchronous probe of a previous request (expected 0 fetches, observed 1); #19680 addresses this fixture. CodeQL ratchet also fails. Do not duplicate #19680's change inside #19167. |
| P2 | [#19590](https://github.com/cheaper-inference/OmniRoute/pull/19590) opt-in CLI stack traces | `d4fe07c1`, mergeable; Typecheck/Semgrep passed, CI/Quality Gates queued/in progress. |
| P2 | [#19592](https://github.com/cheaper-inference/OmniRoute/pull/19592) opt-in Codex plan header | `f0e8c12f`, mergeable; latest docs-contract fix already pushed, Typecheck/Semgrep passed; CI running/Quality Gates queued. |

**Upstream-wide failure ≠ PR failure.** Several PRs are red solely on the CodeQL alerts ratchet. Do not weaken the security gate merely to green individual PRs. The live release captain/maintainer controls upstream changes.

## Superseded / deliberately not ported

- [#17961](https://github.com/cheaper-inference/OmniRoute/pull/17961) **merged** 2026-11-08; do not duplicate its plan eligibility patch.
- Fork [#46](https://github.com/Bl0ck154/OmniRoute/pull/46) pinned-fetch close repair: equivalent behavior already shipped upstream. Do not re-port.
- Upstream [#19050](https://github.com/cheaper-inference/OmniRoute/pull/19050) closed without merge; superseded by open scoped security fix #19165.
- Upstream [#19166](https://github.com/cheaper-inference/OmniRoute/pull/19166) closed without merge; native thinking changes accepted in **merged #18895**.
- Upstream [#19593](https://github.com/cheaper-inference/OmniRoute/pull/19593) closed without merge; reference-cap work is now in #19667.
- `open-sse/utils/earlyStreamKeepalive.ts`: upstream has additional safe SSE end-of-event boundary logic absent from fork; **do not overwrite upstream** with older fork implementation.
- `open-sse/utils/proxyFetch.ts`: upstream refactored transport into `proxyFetchTransport.ts`/support modules. Fork's monolithic module is not suitable for direct copy/cherry-pick; review each remaining invariant separately.
- `src/lib/usage/orderForgeImageArtifactSink.ts` is a fork-specific Order Forge integration, not an upstream feature by default. Fork SQL 194/900 migration bridge is deployment compatibility infrastructure, not a general upstream cherry-pick.

## Next precise actions

1. Check exact-head CI on new #19681 (four workflows queued), including the provider-fault isolation regression. Let #19680 run to completion, then verify its isolated unit test and re-check #19167 against the newest upstream base; do not duplicate that fixture patch.
2. Check exact-head CI/Quality Gates on #18733, #19667, #19590 and #19592; distinguish actual test failure from queue/CodeQL ratchet. Fix only a reproducible PR-local defect.
3. Fork sync #125 has merged with green exact-head CI and candidate #42832054388. Keep the currently installed package unchanged unless a separately approved release is needed; before installing, verify artifact checksums/manifest, take a safe SQLite backup, and follow the [manual upgrade runbook](maintenance/UPSTREAM_UPGRADE_RUNBOOK.md). The next upstream sync candidate should evaluate new commit `895c0f3571` independently.
4. In a disposable off-host Git checkout, use `git merge-base`, `git log --left-right --cherry-pick`, `git cherry`, `git diff --stat`, and `git patch-id --stable` against current upstream. Exclude merged PRs and already open heads, and inspect only selected small unported code patches; verify equivalent upstream behavior after squash/rebase.
5. Update this file after each meaningful PR merge/fix or fork integration milestone. Create new small upstream PRs only for verified, independent missing behavior with focused tests. Do not install or build on the VPS.
