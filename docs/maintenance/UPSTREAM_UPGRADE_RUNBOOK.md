# Upgrade runbook: official OmniRoute → our patched fork

**Scope:** `Bl0ck154/OmniRoute` and its packaged VPS installation. This is a **manual compatibility integration**, not GitHub's blind "Sync fork" button. First read [FORK_PATCH_REGISTER.md](FORK_PATCH_REGISTER.md).

**Do not run an upgrade just because a new tag exists.** Scope and verify it with the owner. The fork was 151 commits ahead / 2,171 behind the official default branch as of 2026-10-24, so simply resetting `production` to upstream would silently discard our work; a blind merge may conflict or produce behavior regressions.

## Decision: can we upgrade?

**Yes, technically.** Git can merge upstream history into our branch, or a new integration branch can reapply the remaining custom patches on a clean upstream base. Neither method guarantees zero conflicts. The compatible path depends on which changes upstream incorporated or rewrote.

Prefer, in this order:
1. **Merge upstream into an isolated branch based on our current fork `production`** to preserve local history and make real conflicts visible. This is the first approach, not a guarantee that Git will resolve semantics correctly.
2. If the merge is intractable because upstream changed architecture substantially, create a separate clean branch at the upstream release and **selectively port still-required fork features**, without replaying already accepted upstream changes. Compare behavior with our live fork first.
3. Keep the old verified release running until the migration branch passes functional tests. Do not force push, replace `production`, or remove a local feature simply to make Git report "up to date".

### Preparation: read-only checks

- Confirm current upstream default and exact target **commit**, not just the version label. The official default was `release/v3.8.53` on 2026-10-24; this will change.
- Compare merge bases, commit ranges and changed-file overlap. The example commands are for a **dedicated worktree on a development machine or GitHub Actions**, not for the production running release:

```bash
git remote add upstream https://github.com/cheaper-inference/OmniRoute.git 2>/dev/null || true
git fetch --prune origin production
git fetch --prune upstream release/v3.8.53
git log --left-right --oneline origin/production...upstream/release/v3.8.53
git diff --stat origin/production...upstream/release/v3.8.53
```

Check current statuses for:
- [URL audio transcription upstream #18040](https://github.com/cheaper-inference/OmniRoute/pull/18040)
- [Antigravity 504 retry upstream #18052](https://github.com/cheaper-inference/OmniRoute/pull/18052)
- Already-upstream pinned-fetch cleanup in `src/shared/network/dnsPinnedFetch.ts`.
- Fork-only adaptive health, timing telemetry, runtime settings, dashboard management and all other custom changes in the [patch register](FORK_PATCH_REGISTER.md).

### Integration in a separate branch; no VPS deployment

```bash
git switch -c integration/upstream-NEW_VERSION origin/production
git merge --no-ff --no-commit upstream/RELEASE_BRANCH
# Resolve every conflict by intended behavior, not simply "ours"/"theirs".
# Inspect the diff carefully; only then commit the integration.
git diff --check
```

Replace `RELEASE_BRANCH` with the actual upstream branch fetched. If the dry merge cannot be resolved safely, abort it (`git merge --abort`); do not "fix" it by a hard reset of `production`. Integration branches are for compatibility analysis, not production. Avoid doing simultaneous direct editing in another agent's worktree.

For each overlapped module:
- Remove duplicate code if an upstream PR already implements the same feature. Keep tests for the invariant.
- Reapply still-required fork-only changes *against the new upstream architecture* (do not blindly transplant an old `chat.ts` or `auth.ts` file).
- Re-evaluate timer precedence, pre-header timeout vs real upstream HTTP 504, same-account retry, account rotation, explicit pinning, model/connection cooldown, quota exhaustion and `499` cancellation.
- Confirm any runtime setting key renames, default values, admin authentication, serialization, migrations, and UI APIs. Legacy SQLite settings must stay readable.
- Confirm the audio URL downloader still forbids private/loopback/link-local redirects, preserves `file` precedence, caps size/time and **never sends a raw Telegram token-bearing media URL upstream**.
- Check external/public provider IDs (Gemini models), exact SSE readiness, streamed response lifecycle, and stop/cancel behavior.
- Consider other custom commits not yet in the 2026-10-24 register; it is not exhaustive.

### Mandatory test matrix — off the live VPS

Run on GitHub Actions or another genuinely separate runner:

1. Existing project CI, core typecheck, unit + integration suites, Next.js build and CLI build. Add integration tests for any changed routing contracts.
2. **Gemini/Antigravity:** one confirmed `ANTIGRAVITY_PRE_RESPONSE_TIMEOUT` on account A should attempt eligible B rather than A again; do not retry the same account after an exhausted 12s header timer. An ordinary transient 502/503 should keep the bounded retry where appropriate. An actual upstream HTTP 504 must not be mistaken for the local confirmed marker.
3. **Adaptive health:** 499/abort exclusion, min sample, concurrent failure/half-open races, cooldown expiration, one in-flight probe, recovery hysteresis, other-model isolation, forced pin, all-quarantined escape, model/quota/connection global restrictions.
4. **Runtime settings:** previous SQLite settings load safely; default 5,000/12,000 ms; authenticated admin API validates 500..120,000; atomic revision updates; changes affect subsequent requests without restart; dashboard controls work.
5. **Transcriptions:** multipart `file`, multipart HTTPS `url`, Groq and OpenAI routing, private-host/IP/redirect denial, large/HTML/timeout, file-over-URL precedence, no token leak, real streamed WAV larger than buffered response.
6. Repeat live-but-controlled provider smoke against **staging or approved narrow production probes**, without logging prompt content or credentials. Do not use user's live Telegram groups for automated stress tests without permission.

A passing CI on an old branch is insufficient for a new upstream integration. Test the **exact merged commit** to be packaged.

### Promotion and packaging

1. Open ONE integration PR `integration/upstream-NEW_VERSION` → **fork** `production` with patch-by-patch resolution table and CI evidence. Keep `production` stable until reviews/checks pass.
2. Merge that PR only after compatibility is confirmed. Record its exact `production` SHA. When upstream bumps version (e.g., from 3.8.52 to 3.8.53), check package metadata, Docker/CLI/Next entry points and installer compatibility.
3. Build a candidate **off-host**. Currently `.github/workflows/build-custom-release.yml` expressly checks out **`production`** and asserts the checked-out branch name; dispatch it **after** integration merge (unless a separately reviewed safe workflow explicitly supports candidate branch builds). Use a **new unique** `custom_revision` for each version; do not reuse `custom.34` or overwrite a release tag.
4. Check that release workflow passed tests, `npm run build`, CLI build, package installation and packaged launcher/dashboard smoke. Verify release `manifest.json`: exact sourceCommit, version, revision, platform, source repository, and `sha256sum -c SHA256SUMS`. The manifest must match the intended integration SHA.
5. On VPS **never run `npm run build`, Next, esbuild, Docker build or tests**: host policy `/opt/AGENTS.md` forbids building OmniRoute on this host after OOM incidents. The official updater may **install the already-built package**; do not work around its safeguards.
6. Record and check `sudo -n /opt/omniroute-ops/omniroute-production-update status`. Do one controlled install:
   ```bash
   sudo -n /opt/omniroute-ops/omniroute-production-update install /path/verified-omniroute.tgz /path/verified-manifest.json
   sudo -n /opt/omniroute-ops/omniroute-production-update status
   ```
   The updater stages and installs the package, launches its isolated canary, performs a DB backup, atomically moves the symlink, restarts user `omniroute.service`, verifies authenticated status 200 and unauthenticated guard 401, and records the previous package.
7. Verify real limited traffic, new/old settings, per-account model routing, visible quarantine/telemetry, audio transcription URL and file, error rates, 499 behavior and no duplicate retries. Compare *equal-length/time-of-day windows* where possible, with enough samples; do not claim success from a handful of post-deploy requests.
8. Update [FORK_PATCH_REGISTER.md](FORK_PATCH_REGISTER.md) with official upstream commit/tag, fork PR, source SHA, new installed custom revision, CI proof, PR status, retired patches, incompatibilities and rollback data.

### Rollback and SQLite migration warning

```bash
sudo -n /opt/omniroute-ops/omniroute-production-update rollback
sudo -n /opt/omniroute-ops/omniroute-production-update status
```

**Critical limitation verified from the actual updater script on 2026-10-24:** `rollback` restores the **previous package symlink/service**, **not automatically the SQLite database**. Installer database backups are saved under `/var/lib/omniroute-production-update/database-backups/`, currently pruned to the **two newest backup directories**. If the new upstream migrations are not backward-compatible, the old package may not work against migrated SQLite. Before a **major/migration-heavy** upgrade, take and separately retain a tested, consistent SQLite backup + any other persistent state snapshots, plan downtime and DB restoration procedure, and approve restoration explicitly. Do not write directly to a live SQLite DB or assume package rollback covers it.

If the new package fails its canary or readiness/guard checks, inspect updater output: it may automatically restore the previous package but still requires verification and DB compatibility review. Never force a second installer concurrently; it holds a lock.

## Non-goals / guardrails

- Do not erase or force-sync fork `production` to upstream.
- Do not use `git reset --hard upstream/...` on the fork's release branch.
- Do not copy production `.env`, tokens, SQLite DB or account identifiers into GitHub/CI artifacts/PRs.
- Do not copy `custom.34` node_modules, active release symlinks or server build outputs into the repository.
- Do not deploy an unverified upstream tag directly to VPS: it omits fork-only fixes.
- Do not silently drop a still-required custom patch because upstream CI passed.
- Do not assume upstream PR #18040 or #18052 merged without checking at upgrade time.
- Do not assert the upstream caused post-idle failures absent phase evidence; network DNS/TCP/TLS durations may remain unavailable.
