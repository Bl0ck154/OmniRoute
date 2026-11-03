# Upstream parity gap and SQLite migration collision — 2026-10-24

**BLOCKER FOR A BLIND UPSTREAM UPGRADE.** This is a factual, read-only audit of fork source history and the installed SQLite migration schema. It does not change the running service, DB, deployment pipeline or any credentials. Read alongside [FORK_PATCH_REGISTER.md](FORK_PATCH_REGISTER.md) and [UPSTREAM_UPGRADE_RUNBOOK.md](UPSTREAM_UPGRADE_RUNBOOK.md).

## Executive correction

The fork advertises `3.8.52-custom.34`, but this **does NOT mean it is source-equivalent to the official v3.8.52 release**. Our [fork PR #42](https://github.com/Bl0ck154/OmniRoute/pull/42) explicitly says **"version metadata alignment, not a full upstream rewrite"**, and says that preceding PRs #38–41 backported 20 selected 3.8.52 fixes while retaining fork code. Previously [PR #28](https://github.com/Bl0ck154/OmniRoute/pull/28) backported 13 selected upstream improvements. These are **partial source backports**, not full release synchronization.

The full 3.8.51 integration effort was not promoted to fork `production`: [fork PR #6](https://github.com/Bl0ck154/OmniRoute/pull/6) merged the official release into an **integration** branch, but [fork PR #7](https://github.com/Bl0ck154/OmniRoute/pull/7), proposed to bring this into the production lineage, was closed **unmerged**. Parts may have been ported later; do not assume full 3.8.51 source parity.

Historical snapshots (compare actual fork `production` files, not version strings):

| Official source snapshot | Fork ahead / official commits behind (cross-repo GitHub compare at time) | Differing tracked file paths (direct Git tree comparison, 2026-10-24) | Differing JS/TS-family paths* |
|---|---:|---:|---:|
| Official branch `release/v3.8.51` | Not re-counted | 2,166 | 1,020 |
| Official branch `release/v3.8.52` (`c754707d`) | Approximately 157 ahead / **1,652 behind** as of this audit | **10,490** | **4,581** |
| Official branch `release/v3.8.53` (`5b3be70b`) | Approximately 157 ahead / **2,171 behind** | **11,628** | **5,588** |

\* `.ts/.tsx/.js/.mjs/.cjs`. File count includes **both sides' distinct files**, changed docs/tests, reorganizations, and source files with different implementations; it is **not** a count of missing features. Likewise, "behind" counts Git commit ancestry: some official changes were cherry-picked into the fork without their original commits, so these counts **must not** be interpreted as 1,652 or 2,171 missing features. Nonetheless, the high file and core-code divergence plus PR #42's explicit admission show that full official 3.8.52 source parity has **not** been established.

**The fork's custom.34 package really was built/tested and deployed:** its source commit is `2281d1c5`, built via verified off-host CI [run 40100570794](https://github.com/Bl0ck154/OmniRoute/actions/runs/40100570794). The installed program may be operationally stable without being upstream-complete. Subsequent commits to fork `production` do not silently change the already-installed package.

## Concrete blocker: both repositories assigned *migration 194* to different SQL

- Fork `src/lib/db/migrations/194_api_key_preferred_connections.sql`:
  `ALTER TABLE api_keys ADD COLUMN preferred_connections TEXT;`
- Official v3.8.52 `src/lib/db/migrations/194_proxy_logs_attempt_timing.sql`:
  `ALTER TABLE proxy_logs ADD COLUMN headers_ms INTEGER DEFAULT NULL;`
  `ALTER TABLE proxy_logs ADD COLUMN first_chunk_ms INTEGER DEFAULT NULL;`
- **Verified read-only against the installed production DB on 2026-10-24:**
  `_omniroute_migrations` contains `('194', 'api_key_preferred_connections')`; `api_keys.preferred_connections` **exists**, while `proxy_logs.headers_ms` and `proxy_logs.first_chunk_ms` are **absent**.
- Official `src/lib/db/migrationRunner.ts` and `migrationRunner/schemaState.ts` primarily identify already-applied migrations by **version**; its mismatch detector logs a critical warning when the same version has a different name. A naive upstream package may regard official migration 194 as already applied (and skip its SQL), even though the schema is missing those columns. This cannot be considered safe until an explicit compatibility plan is tested.
- Official v3.8.52 also contains numbered migrations 195–212 not present in the fork source checked here. Their dependencies, prerequisite schema and effects require testing against a **sanitized/controlled copy of the actual fork schema**.

**Do not "repair" this by deleting row 194 from live `_omniroute_migrations`, renaming a checked-in migration without a plan, or running both SQL scripts blindly.** Existing DBs and fresh installations must both migrate safely. A new, carefully designed compatibility migration/backfill or namespaced reconciliation may be required; test the exact runner behavior, idempotency, column existence, transaction behavior, new install, existing install and rollback first. Never mutate or publish the production database during investigation.

## Approved direction to regain full upstream source parity

1. **Freeze the running release and configuration.** Do not reset fork `production`, deploy upstream npm packages directly or replace custom binaries. Current running release is a known functional fallback while the new source is tested.
2. In an **independent integration branch** based on the official **stable** target release, build a patch inventory from *all* fork custom commits and tests, not just PRs #45–47. Alternatively dry-run a real merge from fork `production`; choose the path with fewer semantic conflicts. Retain the full official release code and port still-required fork-only behavior deliberately. There is **no requirement to cherry-pick thousands of upstream commits individually**.
3. Resolve migration **194 collision before any real DB upgrade**, validate all migration versions 195+, compatibility of existing `api_keys`, `proxy_logs`, quota, auth and session data; create a **separate restorable database snapshot** and offline migration rehearsal. The updater's `rollback` changes only program package, **not** the DB schema.
4. Build a patch checklist covering: provider/OAuth keys and account selection; Codex priority/fallback; Gemini 3.8 preference; Antigravity per-(account,model) health + telemetry; audio URL and SSRF guards; pinned-DNS streaming; API key preferred connections; SSE/499 and timeout semantics; CLI/API compatibility; custom business integrations.
5. Run full upstream and fork regression suites, typecheck, static analysis and Next+CLI builds on GitHub Actions/other isolated runner (**never the production VPS**); run packaged smoke and staging migration against an isolated data copy. Inspect upstream migration/source changes and security issues instead of treating green source-only CI as enough.
6. Promote via one reviewed fork integration PR → `production`, then one SHA-pinned externally built custom release, verified checksum + canary + DB backup + production health and API-auth guard; observe live traffic and rollback program+DB as explicitly designed when needed.
7. Update [patch register](FORK_PATCH_REGISTER.md), [upgrade runbook](UPSTREAM_UPGRADE_RUNBOOK.md), PR references and provenance. Once upstream merges [audio URL PR #18040](https://github.com/cheaper-inference/OmniRoute/pull/18040) or [Antigravity timeout PR #18052](https://github.com/cheaper-inference/OmniRoute/pull/18052), compare their **current** status and code; avoid duplicate implementations.

## Release gate (hard stop)

**DO NOT claim "fully upgraded to official 3.8.52/3.8.53" based on package.json/version/CI alone.** That claim requires an auditable upstream source baseline or equivalent complete reconciliation, an explicit custom-patch preservation report, and an end-to-end isolated migration + behavior validation.

If those gates are not satisfied, continue running the existing verified custom release and report the *actual* parity gap. This document intentionally includes no user data, credentials, account identifiers, contents of SQLite tables, or live group messages.
