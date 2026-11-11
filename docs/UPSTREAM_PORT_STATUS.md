# Upstream port status — Bl0ck154/OmniRoute

Verified 2026-11-11 with local Git refs, GitHub API, review threads and exact-head CI jobs. **Not an approval to deploy.** Also consult [fork patch register](maintenance/FORK_PATCH_REGISTER.md), [upgrade runbook](maintenance/UPSTREAM_UPGRADE_RUNBOOK.md) and [SQLite parity audit](maintenance/UPSTREAM_PARITY_GAP_AUDIT_20261024.md).

## Synchronization

- Upstream [cheaper-inference/OmniRoute](https://github.com/cheaper-inference/OmniRoute): release/v3.8.54 at **4421ce47c173**.
- Fork [Bl0ck154/OmniRoute](https://github.com/Bl0ck154/OmniRoute): production at **8c3b9862ccec** before this documentation commit. [Fork #125](https://github.com/Bl0ck154/OmniRoute/pull/125) merged with passed off-host candidate #42832054388 and focused CI; follow-up [#136](https://github.com/Bl0ck154/OmniRoute/pull/136) merged through upstream b002cf45; cleanup [#137](https://github.com/Bl0ck154/OmniRoute/pull/137) merged, removing three redundant source divergences.
- **New [fork PR #138](https://github.com/Bl0ck154/OmniRoute/pull/138): OPEN DRAFT**, two-parent merge c331f6f5568d (fork 8c3b9862 + upstream 4421ce47), integrating seven official commits. Includes RenderHour regex security fix #19702, model-budget agentic context compaction #19317, settings-projection regression #19348, nightly basePath CI #19768, dashboard/kit improvements #19766/#19765/#19760. No merge conflicts; git diff-tree --check passed. 141 files changed, +1563/-307 relative to fork base. Off-host Selected upstream regressions #43038732133 was in progress at last check. **Not merged or deployed.**
- Verified merge-base b002cf45; fork-only / upstream-only commit counts 284 / 7; git cherry yielded 227 patch-id-unmatched fork commits, and tree comparison 303 different files. **227 is NOT a count of missing patches**: squash merges, open PRs, fork-only integrations and equivalent implementations must be excluded. Re-evaluate against new heads.
- Installed OmniRoute and production SQLite are untouched. No builds/tests on the live VPS. Upstream integration requires off-host CI, release build and old-schema migration rehearsal before any fork source merge or separate deployment.

## Existing upstream contributions

Selected **merged upstream**: [#17961](https://github.com/cheaper-inference/OmniRoute/pull/17961) Codex paid-plan eligibility (confirmed merged 2026-11-08), [#18895](https://github.com/cheaper-inference/OmniRoute/pull/18895) Gemini native thinking, [#19259](https://github.com/cheaper-inference/OmniRoute/pull/19259) preferred failover, [#19263](https://github.com/cheaper-inference/OmniRoute/pull/19263) retired preview; memory/performance #19052–#19055, #19138–#19139, #19146, #19150–#19152; routing #19162–#19164 and test #19180. Other merged contributions exist; do not duplicate them.

**18 open upstream PRs by Bl0ck154** at last search, prioritized for repair/review before new contributions:

| Priority | PRs | Verified state / next step |
| --- | --- | --- |
| P0 | [#18733](https://github.com/cheaper-inference/OmniRoute/pull/18733) false cache-reclaim 503 | Open, mergeable, dd08dc0b; review thread resolved. Typecheck/Semgrep passed; CI/Quality Gates failed (shared vulnerability ratchet 13 vs baseline 7, provider asset provenance). Investigate exact failed gates without lowering security. |
| P0 | [#19165](https://github.com/cheaper-inference/OmniRoute/pull/19165) image API-key scope | Open, mergeable, 51ce59e5; fresh CI in progress, Quality Gates queued; Typecheck/Semgrep passed. |
| P0 | [#19134](https://github.com/cheaper-inference/OmniRoute/pull/19134) hosted-image/text-quota separation | Open, mergeable, e594f27e; CI in progress, Quality Gates failed. |
| P0 | [#19171](https://github.com/cheaper-inference/OmniRoute/pull/19171) Combo account binding | Open, mergeable, 501bee6b; CI/Quality Gates failed; unit shard 8 points to unrelated kit-exception inventory. |
| P1 | [#19667](https://github.com/cheaper-inference/OmniRoute/pull/19667) 128 verified hosted edit references | Open, 037a8455; CI queued, Quality Gates failed; Typecheck/Semgrep passed. |
| P1 | [#19680](https://github.com/cheaper-inference/OmniRoute/pull/19680) delayed probe isolation | Open, 86932f5e; CI red: unrelated 1-ms Codex quota observation mismatch in unit shard 3 (covered by open #19865), stale kit inventory in shard 8; no need to duplicate fixes. |
| P1 | [#19681](https://github.com/cheaper-inference/OmniRoute/pull/19681) stale model badges | Open, 6e290f82; CI red with stale kit inventory in shard 8; Quality Gates red. |
| P1 | [#18738](https://github.com/cheaper-inference/OmniRoute/pull/18738), [#19132](https://github.com/cheaper-inference/OmniRoute/pull/19132), [#19258](https://github.com/cheaper-inference/OmniRoute/pull/19258), [#19167](https://github.com/cheaper-inference/OmniRoute/pull/19167) | Open and mergeable; recheck overlap, exact-head CI and review. |
| P1 | [#19865](https://github.com/cheaper-inference/OmniRoute/pull/19865), [#19866](https://github.com/cheaper-inference/OmniRoute/pull/19866), [#19867](https://github.com/cheaper-inference/OmniRoute/pull/19867), [#19874](https://github.com/cheaper-inference/OmniRoute/pull/19874), [#19890](https://github.com/cheaper-inference/OmniRoute/pull/19890) | New small tests/fixes; all open. Do not submit duplicates. |
| P2 | [#19590](https://github.com/cheaper-inference/OmniRoute/pull/19590), [#19592](https://github.com/cheaper-inference/OmniRoute/pull/19592) | Open CLI diagnostics / optional Codex plan header; monitor CI and review. |

Old **fork** [#132](https://github.com/Bl0ck154/OmniRoute/pull/132) and [#134](https://github.com/Bl0ck154/OmniRoute/pull/134) remain open but nonmergeable after later fork sync/docs changes. #132 overlaps stale-Combo synchronization; #134 overlaps merged docs #135. Review their remaining useful deltas before deciding whether to rebase or close.

## Not to re-port / not yet verified

- Upstream merged #17961 and other merged items above. Upstream-equivalent Codex 504 retry behavior is already restored in the fork (fork commits 0e1b3da and 8821d53): current fork/upstream diff for those two touched paths is empty.
- Upstream [#19166](https://github.com/cheaper-inference/OmniRoute/pull/19166) closed unmerged, superseded by merged #18895. [#19593](https://github.com/cheaper-inference/OmniRoute/pull/19593) closed unmerged, scope now in open #19667. [#19050](https://github.com/cheaper-inference/OmniRoute/pull/19050) superseded by #19165.
- Fork Order Forge image artifacts and SQLite migration 194/900 bridges are fork-specific by default. The upstream proxy transport was refactored; do not overwrite its new components with an old fork module. Preserve upstream SSE event-boundary safety logic.
- Remaining fork-only code needs **content-level triage**. No independent missing behavior is confirmed suitable for a new upstream PR until compared against merged, open and squash-equivalent upstream work.

## Next actions

1. Inspect exact-head off-host CI for fork PR #138. Resolve any integration-specific failure; require build/typecheck and migration rehearsal before merging source, and never deploy automatically.
2. Prioritize upstream #19165, #18733, #19134 and #19171; distinguish CodeQL, vulnerability, provider-asset and kit-inventory baseline failures from real PR-local problems. Do not weaken security gates.
3. Review fresh CI/comments on #19680/#19681/#19667 and new small #19865–#19890 PRs. Avoid duplicating existing regression patches.
4. Use git merge-base, log --left-right --cherry-pick, cherry, diff --stat and patch-id --stable locally. Inspect full diffs only for selected small, independent unported changes with tests.
5. Update this file after the next confirmed PR fix/merge. Production package and SQLite remain unchanged.
