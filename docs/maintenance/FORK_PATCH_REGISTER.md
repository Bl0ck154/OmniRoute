# Fork patch register — Bl0ck154/OmniRoute

**Maintained for the fork, not upstream.** This is the living inventory of *known, tracked* custom changes. Read this together with [UPSTREAM_UPGRADE_RUNBOOK.md](UPSTREAM_UPGRADE_RUNBOOK.md) before syncing or deploying an official release. Keep this register in the fork's `production` branch. Update it whenever a patch is introduced, superseded, ported upstream, or intentionally retired.

> **Critical 2026-10-24 correction:** The `3.8.52` version label is **not proof of full upstream 3.8.52 source parity**. Fork [PR #42](https://github.com/Bl0ck154/OmniRoute/pull/42) only synchronized version metadata after selected backports; full 3.8.51 promotion PR #7 was not merged. The existing production SQLite migration **194** conflicts with the different official migration **194** and needs a safe migration bridge before upgrading. See the mandatory [source-parity and migration collision audit](UPSTREAM_PARITY_GAP_AUDIT_20261024.md).\n\nLast checked: **2026-10-24**. Statuses below are snapshots, **not** promises that an upstream PR is still open. Query GitHub before each upgrade.

## Known production baseline

| Item | Verified state on 2026-10-24 |
|---|---|
| Fork | `Bl0ck154/OmniRoute` |
| Fork deploy/build source | `production` (the branch built by `.github/workflows/build-custom-release.yml`) |
| Production installed | `3.8.52-custom.34`, source commit `2281d1c519b2e541c9b8d0fa1cc47f9587a515c0` |
| Off-host release CI | [run 40100570794](https://github.com/Bl0ck154/OmniRoute/actions/runs/40100570794), succeeded |
| Production launcher | `/opt/omniroute-current` → a versioned release inside `/opt/omniroute-releases/` |
| Installer and recovery | `/opt/omniroute-ops/omniroute-production-update` (`status`, `install ARTIFACT MANIFEST`, `rollback`) |
| Official upstream | `cheaper-inference/OmniRoute`, default branch `release/v3.8.53` on this date; use the official **current** target when upgrading |
| GitHub cross-fork comparison | Fork `production` was **151 commits ahead and 2,171 commits behind** `release/v3.8.53` on 2026-10-24; this is a historical snapshot, not an eternal invariant |

**Critical:** A commit to `production` does *not* update the running server. The installed package is only replaced by a separately approved, verified release artifact and installer run. Documentation-only merges do not require production deployment.

## Tracked patches and upstream disposition

| ID / fork PR | Function and distinctive files | Upstream state (as checked 2026-10-24) | Upgrade action |
|---|---|---|---|
| [#45](https://github.com/Bl0ck154/OmniRoute/pull/45) | Multipart `url` support for `POST /v1/audio/transcriptions`. `src` audio transcription handler and remote audio downloader; URL is validated and downloaded locally, **never forwarded upstream with Telegram URL credentials**. File input takes precedence. HTTPS, public-only SSRF checks, redirect/size/time caps. Tests: `tests/unit/audio-transcription-url.test.ts`. | [Official PR #18040](https://github.com/cheaper-inference/OmniRoute/pull/18040) **open**. | Until upstream lands equivalent behavior, preserve/rebase fork implementation. Once merged upstream, compare actual logic, reject duplicate code and keep security + provider smoke tests. |
| [#46](https://github.com/Bl0ck154/OmniRoute/pull/46) | Fix streamed body deadlock in `src/shared/network/dnsPinnedFetch.ts`: awaiting dispatcher close before consuming response body caused URL-only audio 504. Regression in `tests/unit/remote-image-fetch-pin-dns-connection.test.ts`. | **Equivalent deferred dispatcher close already in official `release/v3.8.53`** before our PR; do **not** open duplicate upstream PR. | Prefer official implementation; do not re-add old deadlocking close path or cherry-pick redundant patch. Preserve regression test if not upstream. |
| [#47](https://github.com/Bl0ck154/OmniRoute/pull/47) | Gemini/Antigravity resilience overhaul: (1) no same-account replay after confirmed header timeout, (2) adaptive account+model quarantine with 499 exclusion, cooldown and half-open probes, (3) structured phase telemetry, (4) hot runtime preferred failover timeouts and management UI. Important: `src/sse/handlers/chat.ts`, `src/sse/services/auth.ts`, `src/sse/services/sameAccountTransportRetry.ts`, `open-sse/handlers/chatCore/nonStreamingProviderLeg.ts`, `open-sse/handlers/chatCore/upstreamTimeouts.ts`, `open-sse/services/antigravityHealth.ts`, `open-sse/services/antigravityTiming.ts`, `src/lib/resilience/antigravitySettings.ts`. | Only the **narrow timeout/retry repair** was proposed upstream as [official PR #18052](https://github.com/cheaper-inference/OmniRoute/pull/18052), **open**. Quarantine, telemetry and hot settings remain **fork-only**, not proposed/accepted upstream. | Preserve fork-only behavior with scoped adaptation. If #18052 merges, compare upstream implementation and remove duplicate timeout code while retaining fork-only features. Avoid overwriting modern upstream routing logic. |

Fork production contains other modifications beyond these three PRs. **This is not an exhaustive inventory of all 151 ahead commits.** Before accepting a new upstream release, review the full fork-vs-upstream diff, the commit history, older custom release sources, and any additional active unmerged branches. Do not infer that everything else is safe to discard.

### Operational semantics of the Antigravity fork-only feature

- `adaptiveHealthEnabled` and `timingTelemetryEnabled` are **off by code default**, but were set **on in the production DB** with the `custom.34` deployment. DB settings, credentials, quotas and connection IDs are production data; they are **not** stored in Git.
- Health state is process-local, bounded and **lost on service restart**; no shared cross-worker consensus. A `499` client cancellation is not an upstream failure. Quota and permanent bans are separate from model-specific health.
- Quarantine uses a minimum completed-sample floor (8), timeout ratio/consecutive timeout conditions, cooldown (starting 30s, max 5m), single half-open demand-driven probe and recovery hysteresis (2 successes). All-quarantined escape is constrained by underlying quota/forced-pinning rules.
- Default preferred timeout **5,000 ms**; Gemini 3.8 preferred timeout **12,000 ms**. Production settings are persisted in SQLite and can be edited using management-authenticated **Settings → Resilience → Antigravity**, within 500–120,000 ms.
- Telemetry emits sanitized phase timing; DNS/TCP/TLS are `null` when not exposed by HTTP transport. **Idle-causality is not proven** by initial observations; never claim the upstream cause is conclusively identified.
- Initial production verification of `custom.34`: updater `INSTALL_OK=1`, health 200, API guard 401, first 24 Gemini3.8 `call_logs` contained 20 × 200, 4 × 499, 0 × 504 and 0 same-account 504 repeats. **Small and unequal windows; not a statistically strong before/after comparison**.
- Technical implementation/audit snapshot: [2026-10-24 Antigravity audit](../audits/2026-10-24-antigravity-resilience/README.md). That initial audit was written *before* CI/deploy; later sections that say "CI has not run yet" are historical and superseded by this register's release verification.

## Other releases relevant to patch history

- `3.8.52-custom.32`: shipped #45; live remote-URL WAV smoke exposed the pinned-fetch deadlock, despite unit tests.
- `3.8.52-custom.33`: built and verified off-host after #46, **not deployed** (operator paused the rollout).
- `3.8.52-custom.34`: shipped #45 + #46 + #47, produced from GitHub `production` at `2281d1c5`; installed 2026-10-24. A subsequent docs commit to `production` does not change this artifact.

## Agent handoff checklist

1. Read this register, the [upgrade runbook](UPSTREAM_UPGRADE_RUNBOOK.md), the repository's `AGENTS.md`, and host-only `/opt/AGENTS.md` before operating on VPS.
2. Look up current upstream PR statuses **#18040 and #18052**, plus any merged/replaced commits and adjacent changes; do not trust the dated table blindly.
3. Classify each custom behavior as **already upstream / still fork-only / superseded / conflicts / retire with owner consent**. Preserve security invariants, pinned connections, quotas and 499 behavior.
4. Run fresh off-host regression and integration tests; confirm exact artifact source commit and version. Follow the release runbook for backups, canary, one upgrade and post-deploy observations.
5. Update this register with new PRs, commit SHAs, CI run, release version, verified deployment and any residual risks. Never publish private production logs, tokens or user request bodies.
