# Upstream port status

Verified on **2026-11-09 UTC**. This document tracks the fork `Bl0ck154/OmniRoute` against `cheaper-inference/OmniRoute`. Update after each completed work batch. Use Git/GitHub data rather than commit SHA alone to detect squash/rebased or independently implemented patches.

## Codex CLI 9/16-reference input smoke — 2026-11-10

**Result: 16 image INPUTS verified; legacy hosted image EDIT tool remains unverified.** This is a CLI multimodal-input result, not evidence that the separate hosted `image_generation` tool accepts more than the local route cap.

- Host: `zivkr-ai`. Installed Codex CLI `0.142.4` using the normal OmniRoute provider failed with `gpt-5.6-sol` **minimum client version** error. Direct ChatGPT mode had an expired/non-refreshable CLI auth session (401); no credentials were extracted, printed or manually reused.
- Installed official `@openai/codex@0.167.0` **in a temporary directory only**, without replacing the existing system CLI, and used the normal connected `omniroute` CLI provider with model `cx/gpt-5.6-sol`.
- **9 synthetic PNG attachments:** the CLI request completed with exit 0 (14.4 s); the model indicated image generation is unsupported in this particular CLI/runtime configuration. No generated image, so this establishes successful multimodal submission only.
- **16 synthetic PNG attachments:** completed with exit 0 (3.8 s) and model identified the complete ordered sequence `1, 2, ..., 16` correctly. Confirms sixteen images reached and were understood by the chat model via Codex CLI / OmniRoute; does not test dedicated `/v1/images/edits` or the hosted `image_generation` edit tool.
- No production configuration, proxy, release, database or credentials changed. Temporary test images, isolated CLI and npm cache were **deleted after verification**; installed `codex-cli 0.142.4` remained unchanged.
- Next step for any cap increase: separate provider-managed real edit smoke invoking *the hosted Responses image-generation tool* with 8/9/16 images, rather than claiming a bound from the CLI's image-input support. Don't merge a speculative upstream change.

## Hosted Codex image reference smoke — server audit (2026-11-09)

**Result: actual 9–16 image backend acceptance remains UNVERIFIED. No live paid image generation was made. Do not claim success or a genuine server-side 8-reference limit.**

- On `zivkr-ai`, running OmniRoute version `3.8.53-custom.44` listens on TCP `20128`. The code calls hosted `https://chatgpt.com/backend-api/codex/responses` with `image_generation` / `action: edit` for legacy `gpt-5.6-*-image` models. The application enforces the eight-image cap in `src/app/api/v1/images/edits/route.ts` **before** its handler can contact the upstream backend. Dedicated `gpt-image-*` models use a different `/backend-api/codex/images/edits` endpoint and are allowed sixteen.
- Read-only immutable SQLite inspection found **9 active Codex connections including 2 paid Plus accounts** (no credentials disclosed); one had substantially more available weekly quota. No credentials, user images or login secrets were included in the audit output.
- Direct live OAuth probe was **blocked by connector safety checks** because it would pull an existing access token out of the production DB and send it to an external service. Do not rework around that block by copying tokens. No attempt reached the upstream API.
- Audited local `call_logs` (Codex image-edit request status counts), `usage_history` table layout and existing application logs (including historical compressed logs); they do not retain per-request numeric reference-image counts adequate to prove whether more than eight were previously accepted. Their absence is not evidence of a backend maximum.
- Official OpenAI docs: [Images Edit](https://developers.openai.com/api/reference/resources/images/methods/edit) documents up to 16 images for the **Images Edit API**; [Responses image_generation tool](https://developers.openai.com/api/docs/guides/tools-image-generation) accepts input images but does not specify the legacy hosted Codex tool's own 8-vs-16 maximum. Do not conflate the APIs.
- **Safe follow-up:** perform an authenticated, provider-managed smoke test through a proper operator account/session or an isolated gateway test endpoint that keeps OAuth inside OmniRoute; compare 8, 9 and 16 tiny reference images on the *hosted Responses edit tool*. Cap changes and upstream PRs require actual backend evidence. Avoid deploying a speculative cap increase.

## Corrected/withdrawn batch — Codex image reference cap test (2026-11-09)

**State: upstream PR [#19593](https://github.com/cheaper-inference/OmniRoute/pull/19593) CLOSED WITHOUT MERGE.** The original test patch was opened, then withdrawn after the user correctly challenged the eight-image cap.

- Fork commit `75dd0f943c` restored **8** for the legacy Codex hosted Responses `image_generation` tool while keeping **16** for dedicated GPT Image edits. Current upstream already implements this split; no production code was changed by PR #19593.
- Provenance: upstream [#8122](https://github.com/cheaper-inference/OmniRoute/pull/8122) introduced **8** as a conservative local input guard, but live OAuth tests only exercised one/two images. It was **not a verified model/backend maximum**. Upstream [#14976](https://github.com/cheaper-inference/OmniRoute/pull/14976) introduced the dedicated Codex Images route; [#16623](https://github.com/cheaper-inference/OmniRoute/pull/16623) enabled **16** for dedicated `gpt-image-*` edits based on the public official Images Edit API, while its PR explicitly warned the live Codex OAuth 16-image behavior was unverified.
- The new `#19593` test would have ossified an unsupported eight-image restriction without evidence and was therefore **withdrawn; do not re-open it as-is**.
- **Next candidate:** test 9–16 actual references against the *legacy hosted Responses* tool using an isolated authorized account and safe test fixtures; if backend supports it, raise the hosted limit with real behavioral regression tests. Preserve payload size/magic checks. The documented 16-image cap for the **separate Images Edit API** does not, by itself, establish the hosted Responses tool's contract.
- No production change or live paid image attempt was made in this review. #19592 remains separately open.

## Follow-up batch — Codex plan troubleshooting patch (2026-11-09)

**Status: upstream PR opened; CI/review pending.** This task was recorded as `in progress` earlier in this file, then updated after creating the PR.

- Fork origin: commit `954e997a9d`, optional inspection of the selected Codex account plan for routing/paid-model troubleshooting.
- Current upstream implementation did **not** include `X-OmniRoute-Selected-Connection-Plan` or an equivalent response-plan telemetry field; GitHub PR search found no matching open contribution. By contrast, the fork's `docs/guides/TROUBLESHOOTING.md` is 33 lines **behind** upstream and was not copied.
- **Created [upstream PR #19592](https://github.com/cheaper-inference/OmniRoute/pull/19592)**: `feat(codex): opt-in selected-account plan header for troubleshooting`. Base `release/v3.8.54`, head `Bl0ck154:contrib/codex-opt-in-plan-debug-header-20261109` at `ba4f6cdda932be429aa0a4d7c551ac64b66e7c44`. **Open and mergeable**; 6 changed files; all four GitHub workflows **queued**, not yet passed, on first check.
- Privacy adaptation: `OMNIROUTE_CODEX_PLAN_RESPONSE_HEADER=1` is required (default disabled); recognized plan tiers only, no arbitrary provider strings, Codex requests only, no stale tier on no-credentials responses. Existing response policy propagation is retained.
- Added focused unit tests for disabled default, opt-in, tier normalization and unsafe value suppression; `.env.example` and changelog note included.
- **Next:** watch #19592 workflow outcomes and review feedback; fix on the same branch if CI or reviewer identifies a real regression. No server deployment or fork `production` change was performed.

## Repository refs and sync

- Fork default: `production` at `44227d2b842ddc69b180cff850eb189ec0a03146`.
- Upstream default: `release/v3.8.54`.
- Current GitHub compare `cheaper-inference:release/v3.8.54...production`: **257 ahead / 404 behind**, common ancestor `96eb88c1ee48c6d9fc42d9a11038d539f4f93c78`. These are *history* counts, not unique outstanding patch counts.
- Fork [sync PR #125](https://github.com/Bl0ck154/OmniRoute/pull/125) is **open**, mergeable, not merged. It targets `production`, head `32ef772dd19fabfa31f3248b609aa9d8be9c139f`, and has successful `Codex SSE regression` and `Selected upstream regressions` runs. Do **not** auto-merge: 390 commits / 4,858 changed files require separate integration checks.
- Sync-PR head compared with current upstream: **270 ahead / 27 behind**; merge base `41f122116ddd575228137b5134609c8602050c3b`. Upstream has advanced since the sync branch was prepared.
- Do not touch running production deployment or force-update working branches.

## Upstream PRs already merged

GitHub author search found **41 merged PRs** by `Bl0ck154` (as of this check). Important examples; **do not re-port**:
- [#17961](https://github.com/cheaper-inference/OmniRoute/pull/17961): free Codex OAuth plans excluded for paid-only Sol/Astra; merged 2026-11-08.
- [#19263](https://github.com/cheaper-inference/OmniRoute/pull/19263): remove shut-down Flash Lite preview from discovery.
- [#19180](https://github.com/cheaper-inference/OmniRoute/pull/19180): singbox coexistence port test fix.
- [#19164](https://github.com/cheaper-inference/OmniRoute/pull/19164): preserve slash-containing model IDs.
- [#19163](https://github.com/cheaper-inference/OmniRoute/pull/19163), [#19162](https://github.com/cheaper-inference/OmniRoute/pull/19162): fallback telemetry and trusted internal header deadline.
- [#19152](https://github.com/cheaper-inference/OmniRoute/pull/19152), [#19151](https://github.com/cheaper-inference/OmniRoute/pull/19151), [#19146](https://github.com/cheaper-inference/OmniRoute/pull/19146), [#19139](https://github.com/cheaper-inference/OmniRoute/pull/19139), [#19138](https://github.com/cheaper-inference/OmniRoute/pull/19138): memory reduction.
- [#19055](https://github.com/cheaper-inference/OmniRoute/pull/19055), [#19054](https://github.com/cheaper-inference/OmniRoute/pull/19054), [#19053](https://github.com/cheaper-inference/OmniRoute/pull/19053), [#19052](https://github.com/cheaper-inference/OmniRoute/pull/19052): memory/observability.
- [#18915](https://github.com/cheaper-inference/OmniRoute/pull/18915): admin-only resilience configuration writes.

## Currently open upstream PRs (13; #19593 withdrawn without merge)

| Priority | PR | Purpose | Verified state |
| --- | --- | --- | --- |
| P0 | [#18733](https://github.com/cheaper-inference/OmniRoute/pull/18733) | Low-stall cgroup reclaim must not cause global 503 | Open, mergeable; prior CodeRabbit recovery concern addressed; latest CI queued/pending |
| P0 | [#19165](https://github.com/cheaper-inference/OmniRoute/pull/19165) | Image credential fallback must obey caller API-key scope | Open, mergeable; all four workflows succeeded |
| P0 | [#19134](https://github.com/cheaper-inference/OmniRoute/pull/19134) | Hosted image eligibility vs exhausted text quota | Open, mergeable; all four workflows succeeded; historical bot review requires comparison with latest code |
| P1 | [#19150](https://github.com/cheaper-inference/OmniRoute/pull/19150) | Agentic planner memory clone avoidance | Open, mergeable; three checks successful, main CI queued |
| P1 | [#19171](https://github.com/cheaper-inference/OmniRoute/pull/19171) | Prompt-cache affinity account scope | Open, mergeable; all four workflows succeeded |
| P1 | [#19132](https://github.com/cheaper-inference/OmniRoute/pull/19132) | Antigravity bounded health quarantine | Open, mergeable; remaining CI/Quality Gates running/queued |
| P1 | [#19258](https://github.com/cheaper-inference/OmniRoute/pull/19258) | Opt-in preferred-account fallback across providers | Open, mergeable; remaining checks in progress |
| P1 | [#19259](https://github.com/cheaper-inference/OmniRoute/pull/19259) | Hot per-provider/per-model preferred fallback settings | Open, mergeable; remaining checks queued |
| P1 | [#18895](https://github.com/cheaper-inference/OmniRoute/pull/18895) | Gemini 3.5 Flash-Lite native thinking level | Open, mergeable; latest checks queued |
| P2 | [#18738](https://github.com/cheaper-inference/OmniRoute/pull/18738) | GPT-6.1 Terra catalog and Codex support | Open, mergeable; all four checks succeeded |
| P2 | [#19167](https://github.com/cheaper-inference/OmniRoute/pull/19167) | Codex image quota snapshot telemetry | Open, mergeable; latest checks queued |
| P2 | [#19590](https://github.com/cheaper-inference/OmniRoute/pull/19590) | Opt-in CLI stack traces | Open, mergeable; newest runs queued (older runs canceled) |
| P2 | [#19592](https://github.com/cheaper-inference/OmniRoute/pull/19592) | Opt-in selected Codex plan response header for troubleshooting | New open, mergeable; four workflows queued; response header off by default |
| Withdrawn | [#19593](https://github.com/cheaper-inference/OmniRoute/pull/19593) | Codex hosted vs GPT Image cap regression test | **Closed without merge**: the 8-reference hosted cap is unverified, so do not enshrine it with tests |

The release captain re-homed several PRs to `release/v3.8.54` after `v3.8.53` freeze and explicitly said **no author action** was needed for the base change. Avoid unnecessary rebases.

## Unported changes / candidate queue

- **Not yet fully classified**: fork-only non-upstream patches. The whole-fork comparison is heavily contaminated by upstream history differences and fork-specific deployment integrations. Do not treat an ahead commit, changed filename or cherry result alone as proof of missing upstream behavior.
- Next batch: run local `git merge-base`, `git log --cherry-pick --right-only`, `git diff --stat`, `git cherry`, and `git patch-id` against freshly fetched upstream and fork refs. Use compact per-commit titles/file stats only; inspect exact affected code and upstream equivalence for each proposed patch. Reject duplicates of the 41 merged and 13 open PRs.
- Prioritize small independent P0 security/stability changes with tests; then P1 performance; then P2 quality of life.

## Rejected / not actionable

- **No duplicate PR** for #17961 or any other already merged contribution.
- **No fresh PR for work already covered** by the 13 currently open contributions.
- **Do not blindly merge #125** or force-rebase `production`. Upstream has moved 27 commits beyond its integration base.
- **Reclassified 2026-11-09:** fork `954e997a9d` plan header is proposed in [upstream #19592](https://github.com/cheaper-inference/OmniRoute/pull/19592) only as **operator opt-in, disabled by default, known-tier-only** diagnostic; approval and CI remain pending. Do not separately port the old always-on version.

## Verified duplicate-avoidance checks (2026-11-09)

The audited, already-existing Git checkout at `/opt/omniroute-sync-v3851` had fork `origin/production` at the current GitHub SHA and upstream `release/v3.8.54` at `1b2b799cf2ee2729d1d8acafcf621b5fc70c95c6`. A metadata-only fetch confirmed these refs without modifying working files or production deployment.

- `git merge-base` matched `96eb88c1ee48c6d9fc42d9a11038d539f4f93c78`.
- `git rev-list --left-right --count`: fork-only history 257 / upstream-only 404.
- `git cherry -v`: 212 unmatched `+` patch IDs / 0 `-`. This is **not** a list of 212 missing features: squash, cherry-pick adaptation and subsequent upstream refactors defeat patch-ID matching. Inspect actual upstream behavior.
- Historical fork patches found **already implemented** by current upstream: `f6b2920881` Claude explicit strict false, `ba853c1888` exclusive live catalog authority, `94eced2a0e` invalid regex stripping, `d893cd0ed3` no-log reasoning metadata/continuation cleanup, `a343cf77fb` RELAY_TIMEOUT handling, `9dec654b21` non-blocking Undici dispatcher close, `c2be16c3fb` expired OAuth token fallback, `292d188dfa` null-safe serve port detection. **Do not open duplicate PRs** for these.
- Existing maintained fork safety register: [`docs/maintenance/FORK_PATCH_REGISTER.md`](maintenance/FORK_PATCH_REGISTER.md), updated in documentation [fork PR #134](https://github.com/Bl0ck154/OmniRoute/pull/134). Its fork-only SQLite migration 900 compatibility and deployment gates remain important.
- Existing upstream #19134 explicitly documents provenance-safe Codex image quota cooldown handling, and its latest four workflows all passed. Do not duplicate the old bot findings without validating latest source.
- Initial 2026-11-09 audit created no P0 code PR. In the subsequent requested troubleshooting batch, an opt-in P2 Codex telemetry patch was adapted and opened as #19592 (see follow-up above).

## Next concrete actions

1. Refresh local upstream tracking ref without downloading a full repository; compute compressed cherry/patch-id inventory and content equivalence checks.
2. Inspect any failing *current* CI or unresolved maintainer comments. Fix an existing PR before adding a new one; leave pending checks alone.
3. For each confirmed missing, independent patch: create minimal branch from current upstream, implement targeted tests, verify, then open a small upstream PR.
4. Update this document on the docs branch after each batch; merge documentation into the fork only after review. This file is tracking data, not a deployment change.
