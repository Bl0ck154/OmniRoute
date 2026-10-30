# OmniRoute SQLite upgrade rehearsal and rollback — BLOCKED until verified

Applies to Draft PR #92, NOT to the running service. **Never experiment on live production SQLite.** In the candidate, preferred-connection migration moved from legacy production slots 170/194 to canonical **213**; official **194_proxy_logs_attempt_timing** must remain runnable; the Oct 27 official upstream also adds **214_call_logs_client_session_id**. The candidate now has **211 SQL migration files** (verify against exact SHA before executing).

## Controlled source snapshot (operator-authorized, no secrets in GitHub)

1. Inventory actual live storage path and files using read-only metadata only. Identify current running binary version and migration-ledger variants; record UTC timestamp, SQLite `PRAGMA user_version`, journal_mode, `PRAGMA integrity_check`, column and index names, and ledger `version/name` — **never read out or publish credential values**.
2. At a low-load window create one coherent SQLite backup using SQLite's Online Backup API, **not** raw `cp` of a WAL-mode `.sqlite` file. Store it only in a private `0700` directory with `0600` permissions, no logs or traces of sensitive rows. Validate backup hash, `integrity_check`, table/index count, and ledger cardinality; do not add this file to any Git worktree or CI artifact.
3. Transfer to a **trusted isolated runner** with encrypted transport and storage, encryption keys and tokens excluded from shell logs. Restrict egress; this copy may contain *real OAuth/API credentials*. Do **not** place real data in public GitHub Actions or general CI artifacts. If no trusted secure runner exists, derive a schema-plus-redacted/synthetic-data fixture, label it **NOT an authentic production-data rehearsal**, and keep full rehearsal blocked.
4. Freeze only the copied snapshot. Run the candidate's **actual migrationRunner** at its exact commit with a dedicated `DATA_DIR`/database location, no outbound providers, no production env/secrets and no live service connections. Keep a second untouched backup for rollback.

## Test matrix (record SHA, hashes, before/after manifests and results)

| Scenario | Assertions |
| --- | --- |
| Legacy ledger 170 / preferred | Relocate marker to 213, execute canonical official 170, avoid duplicated column, retain API keys/preferences |
| Legacy ledger 194 / preferred | Relocate marker to 213, apply canonical 194 proxy timing, verify `headers_ms`/`first_chunk_ms` |
| Existing canonical 170,194,213 | No renamed phantom upgrade, no column duplication, no lost data |
| Official 214 plus remaining migrations | `call_logs.client_session_id`, correct full schema and indexes; migration file/count parity |
| Real settings/OAuth/quotas | Identity and nonsecret cardinality/hash invariants; check encryption remained decryptable **in isolated secure environment** |
| Second identical boot | Zero new applied migrations; unchanged schema+table count+row cardinality |
| Injected midway failure | Each SQL file rolls back atomically; earlier committed files tracked; full copy recoverable and rerun succeeds after fixing fixture |
| Missing/partial backup; full disk; older binary rollback | Abort before production update; verify restore in isolated runner |
| Simulated Oscar / Order Forge smoke | Read prefs, authenticate via synthetic tokens, verify quota/settings and representative routes without real customers |

Save a redacted machine-readable manifest and test log with statuses `pass/fail/not-run`. Never call a theoretical `pass`.

## Rollback (must be rehearsed before canary)

Preconditions: immutable checksum-verified backup of old SQLite (and WAL snapshot consistency), old exact executable/container image or npm package plus lockfile and configs, a manifest of active services and port mapping, measured maintenance and max-downtime envelope.

1. Halt new traffic, drain in-flight image generation and streaming requests using a short bounded grace period. Stop **only** the OmniRoute instance being changed after owner approval; don't stop Oscar or Order Forge without explicit coordination.
2. Stop candidate process; save its post-upgrade DB privately for later diagnosis. **Never** run old code against a schema the old version does not understand.
3. Restore old SQLite and its matching journal state from verified snapshot while the service is stopped. Use filesystem ownership/mode checks and `PRAGMA integrity_check` before start; never overwrite the live file while any process still holds it.
4. Restore the recorded old package and exact config/environment (without dumping secrets). Restart previous version and confirm health, account selection, critical routes, settings, and Order Forge media retention with synthetic probes.
5. Roll forward only after DB rehearsal, rollback exercise, broad release CI, packaged-boot smoke and owner deployment approval.

## Canary plan

Deploy an already-built immutable off-host artifact to an isolated canary `DATA_DIR` based on an approved safe copy, separately keyed ports and no real provider writes. Run synthetic Oscar chat streams (including cache 0/missing/reasoning/12s timeout), image generation+edits+Firefly+Responses+combo, Codex paid/free account choice and real serving-account quota via sandbox/fake providers. Then a low-percentage routed canary *only if approved*, watch 401/429/502/504, p95 time-to-first-byte, fallback loops, billing token deltas, log errors and artifact completeness, restore latency. Abort automatically on agreed thresholds. Production upgrade and rollback remain **PENDING**.
