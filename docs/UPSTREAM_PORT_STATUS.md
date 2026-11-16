# Upstream port status — Bl0ck154/OmniRoute

## Current checkpoint — 2026-11-16

**Authoritative live snapshot; historical notes below are dated.** GitHub inventory: **49 merged, 21 open, 3 closed-unmerged** upstream PRs by `Bl0ck154`, including two newly opened PRs in this pass. Upstream `release/v3.8.54` at `225bedf8b5e2`; fork `production` at `5f1dd9f1fa72`; merge-base `b002cf45dcf1`. Historical counts of 22 open or 44 merged below are superseded.

### New upstream ports

- **[#20331](https://github.com/cheaper-inference/OmniRoute/pull/20331)** — `fix(gemini): normalize and validate explicit thinkingLevel overrides`, head `56892c1d6da0`, 2 files +52/−5; 3 translator regressions. Stops unsupported thinking-level strings reaching Gemini and normalizes valid casing. GitHub mergeable; exact-head API Route Typecheck and Semgrep passed; CI queued and Quality Gates in progress at checkpoint. Adapted **only the useful enum-validation hunk** from the fork to current upstream, not the older translator.
- **[#20332](https://github.com/cheaper-inference/OmniRoute/pull/20332)** — `test(antigravity): prove exact quota locks span 3.7 tier aliases`, head `38a4fa4797ee`, 1 file +18/−1. The diff's stable patch-id matches the fork exactly: `8c136b80a4cd0b7174f1c11cd5dd8544f9adf057`. Existing runtime canonicalization stays untouched. GitHub mergeable; all exact-head CI jobs in progress at checkpoint.
- Both PR branches are based on upstream `225bedf8b5e2`, pushed without force, with no live worktree edits or production changes. Never infer green CI from mere mergeability.

### Accepted upstream changes since last checkpoint

- **Merged 2026-11-12:** false global 503 [#18733](https://github.com/cheaper-inference/OmniRoute/pull/18733), API-key-scoped image credential fallback [#19165](https://github.com/cheaper-inference/OmniRoute/pull/19165), Codex hosted-image quota [#19134](https://github.com/cheaper-inference/OmniRoute/pull/19134), Combo account binding [#19171](https://github.com/cheaper-inference/OmniRoute/pull/19171), CLI diagnostics [#19590](https://github.com/cheaper-inference/OmniRoute/pull/19590). Do not port or fix these again. Additional accepted PRs may exist; recheck GitHub.

### Remaining fork deltas — content triage

- After excluding paths touched by the **19 upstream PRs that were already open before this pass**, 970 executable-code files differ across current fork/upstream trees. Most are new **upstream-only** changes: among 937 non-overlapping paths, **912 changed only upstream**, **15 only in the fork**, **10 on both sides** since the common ancestor. These are path counts, **not unported-patch counts**.
- Ported in this pass: the isolated Gemini explicit-level validation and the missing Antigravity 3.7 tier-quota regression.
- **Do not blindly port:** `orderForgeImageArtifactSink.ts` / streaming hooks (fork-specific), SQLite migrations 194/900 (fork compatibility), old Antigravity model registry (diverged/retired catalog), or stale monolithic `withSelectedConnectionHeader` over upstream's newer module.
- **Needs semantic review before any extra PR:** fork Antigravity hot-settings UI / connection health additions versus open [#19132](https://github.com/cheaper-inference/OmniRoute/pull/19132); fresh Codex quota query helper versus [#19167](https://github.com/cheaper-inference/OmniRoute/pull/19167) and already merged image quota code; changed-on-both-side routing/migration files. Avoid stacked or redundant PRs.
- **Next actions:** inspect exact-head CI / maintainer reviews of #20331 and #20332, fix only real introduced regressions, then review the remaining fork-only groups against current upstream and existing PRs. No builds/tests on production VPS; GitHub Actions provides off-host validation.

---

Verified **2026-11-16** against GitHub and local partial-clone Git refs. Source tracking only; **no production deployment is authorized**. For patch history, see [FORK_PATCH_REGISTER.md](maintenance/FORK_PATCH_REGISTER.md) and [UPSTREAM_UPGRADE_RUNBOOK.md](maintenance/UPSTREAM_UPGRADE_RUNBOOK.md).

## Refs and fork synchronization

- Upstream `cheaper-inference/OmniRoute`, `release/v3.8.54`: `225bedf8b5e2`.
- Fork `Bl0ck154/OmniRoute`, `production`: `5f1dd9f1fa72` before this documentation commit.
- Merge base: `b002cf45dcf1`. `git rev-list --left-right --count fork...upstream`: **312 / 876**; `git cherry` finds **253 unmatched fork patch IDs**. These numbers reflect divergent history, merges, fork-only features and upstream changes. **They do not count missing upstream fixes.**
- **Fork is not fully synchronized.** Fork [#125](https://github.com/Bl0ck154/OmniRoute/pull/125) merged on Nov 10. Fork [#138](https://github.com/Bl0ck154/OmniRoute/pull/138) is still an open draft, clean to merge, but covers only seven earlier upstream commits through `4421ce47`. Its focused regression run passed; a nonpublishing candidate build failed twice before app compilation during Chromium install because the hosted runner could not resolve Ubuntu mirrors. Do not merge/release on that evidence. Fork [#142](https://github.com/Bl0ck154/OmniRoute/pull/142) is open for Codex live-plan test coverage.
- No code was built on the production server. No service, deployed package or production SQLite database was changed in this porting pass.

## Already in upstream

GitHub showed **49 merged PRs authored by Bl0ck154** on this snapshot; verify the [live merged-PR query](https://github.com/cheaper-inference/OmniRoute/pulls?q=is%3Apr+is%3Amerged+author%3ABl0ck154) instead of relying on this number later.

Important confirmed merges:

- [#17961](https://github.com/cheaper-inference/OmniRoute/pull/17961) — Codex paid-plan model eligibility (Nov 8).
- [#18733](https://github.com/cheaper-inference/OmniRoute/pull/18733) — prevent false global 503 on page-cache reclaim (Nov 12).
- [#19165](https://github.com/cheaper-inference/OmniRoute/pull/19165) — enforce image API-key connection scope; [#19171](https://github.com/cheaper-inference/OmniRoute/pull/19171) — preserve Combo account binding (both Nov 12).
- [#19134](https://github.com/cheaper-inference/OmniRoute/pull/19134) — separate hosted image/text quota; [#19259](https://github.com/cheaper-inference/OmniRoute/pull/19259) — preferred-account failover; [#19590](https://github.com/cheaper-inference/OmniRoute/pull/19590) — CLI stack trace diagnostics.
- Earlier memory/performance, migration, routing, catalog and Gemini fixes are in the linked merged-PR search and [patch register](maintenance/FORK_PATCH_REGISTER.md).

The missing `getImageLongJobOptions` import repaired by fork [#141](https://github.com/Bl0ck154/OmniRoute/pull/141) is **already present in upstream** `src/app/api/v1/images/generations/route.ts`, along with the call and helper definition. No duplicate PR.

## Open upstream contributions

**21 open PRs** at this check. GitHub's `UNSTABLE` often means failing/pending checks, not a Git conflict; inspect actual workflow jobs before editing. None of the following has confirmed human approval here.

| Priority | Existing PRs and current follow-up |
| --- | --- |
| P0 | [#20178](https://github.com/cheaper-inference/OmniRoute/pull/20178) Codex live plan sync, head `7fd200079b`: new revision, CI to confirm. [#20079](https://github.com/cheaper-inference/OmniRoute/pull/20079) Gemini Decision 1, head `f742e4b56c`: clean, 30 successful checks with neutral/skipped checks; needs maintainer review. |
| P0/P1 | [#19132](https://github.com/cheaper-inference/OmniRoute/pull/19132) Antigravity health, head `851f0dea56`: another agent already pushed the upstream conflict resolution during this audit; recheck its renewed CI. [#19667](https://github.com/cheaper-inference/OmniRoute/pull/19667) hosted image edit reference cap: previous CI red, review baseline vs change. |
| P1 | [#19592](https://github.com/cheaper-inference/OmniRoute/pull/19592) Codex opt-in plan header: **conflict repaired and non-force pushed** as `d3fed137913c` on Nov 16. Kept upstream no-replay behavior; the PR-relative patch is seven files with its regression test, and relative `git diff --check` passed. Renewed CI is pending/unstable; no build was run on the VPS. |
| P1 | [#19167](https://github.com/cheaper-inference/OmniRoute/pull/19167) Codex image quota header; [#19258](https://github.com/cheaper-inference/OmniRoute/pull/19258) preferred timeout telemetry; [#19680](https://github.com/cheaper-inference/OmniRoute/pull/19680) async probe test isolation; [#19681](https://github.com/cheaper-inference/OmniRoute/pull/19681) stale Combo badges. Check exact-head CI failures and resolved review threads before pushing changes. |
| P1 | [#19940](https://github.com/cheaper-inference/OmniRoute/pull/19940) Gemini free-tier catalog: clean, 31 successful checks. Maintainer's new derived-count policy and the generated SVG count/test interaction remain a review topic; don't rewrite managed counts in a feature PR. |
| P1 | [#20331](https://github.com/cheaper-inference/OmniRoute/pull/20331) explicit Gemini thinkingLevel normalization; [#20332](https://github.com/cheaper-inference/OmniRoute/pull/20332) Antigravity 3.7 alias quota tests; [#19890](https://github.com/cheaper-inference/OmniRoute/pull/19890) AgY timeout marker; [#19874](https://github.com/cheaper-inference/OmniRoute/pull/19874) expired Responses count. All open; do not duplicate. |
| P2 / tests | [#18738](https://github.com/cheaper-inference/OmniRoute/pull/18738) GPT-6.1 Terra; [#19948](https://github.com/cheaper-inference/OmniRoute/pull/19948), [#19949](https://github.com/cheaper-inference/OmniRoute/pull/19949), [#19950](https://github.com/cheaper-inference/OmniRoute/pull/19950), [#19865](https://github.com/cheaper-inference/OmniRoute/pull/19865), [#19866](https://github.com/cheaper-inference/OmniRoute/pull/19866), [#19867](https://github.com/cheaper-inference/OmniRoute/pull/19867). Most have old red quality/lint checks; distinguish shared baseline failures from introduced regressions. |

## Still to triage / not to port

- At pinned refs, **50** fork-touched runtime TS/JS paths were detected: **29** not changed along the upstream path since the common ancestor, **21** changed on both sides. Many are already represented by open PRs, upstream-equivalent changes, or fork-only integrations. The path count is **not** a count of unported patches.
- Target content-level triage: `open-sse/config/providers/registry/github/index.ts`, `open-sse/handlers/imageResult.ts`, `open-sse/translator/request/openai-to-gemini/helpers.ts`. Compare actual behavior and tests to upstream and existing PRs; propose a new PR only for independently missing, reproducible behavior.
- Keep Order Forge's `orderForgeImageArtifactSink.ts` and legacy SQLite 194/900 compatibility in the fork unless upstream expressly requires them. Do not restore old Antigravity model catalogs wholesale.
- [#19050](https://github.com/cheaper-inference/OmniRoute/pull/19050) was superseded by merged #19165; [#19166](https://github.com/cheaper-inference/OmniRoute/pull/19166) by merged #18895; [#19593](https://github.com/cheaper-inference/OmniRoute/pull/19593) by open #19667. Fork #132 and #134 were closed unmerged. Do not reopen duplicates.

## Next actions

1. Recheck #19592 `d3fed137913c` and #19132 `851f0dea56` CI and review threads. Address PR-specific failures only; don't lower security or quality gates to hide existing upstream baseline problems.
2. Confirm the new #20178 revision and #20079 CI, then follow up with maintainers where reviews are needed. Review #19940's generator-versus-release-derived-count policy without adding managed count updates.
3. Inspect the three selected fork-only candidate files against current upstream and open PRs. Use `git merge-base`, `git log --cherry-pick`, `git cherry`, `git diff --stat`, `git patch-id --stable`; open small tested PRs only for confirmed gaps.
4. Update this file after another verified port/merge. Leave fork #138 draft until an off-host candidate build, package smoke, and legacy SQLite migration rehearsal pass. **No automatic deployment.**
