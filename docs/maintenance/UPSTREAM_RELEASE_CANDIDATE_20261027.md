# OmniRoute upstream-first candidate — 27 October 2026

This is an **isolated draft**, not a release authorization.

- Parent fork candidate PR #85 has targeted API Typecheck GREEN at GitHub Actions run 40469308039. It repairs localized mirrors, two zh-TW glossary labels, and unsafe top-level test imports.
- Candidate merge contains **both** the complete fork candidate parent at a5a2a4db331648464d19ef538350f3e6c26a1651 **and** the exact official release/v3.8.53 tip 1ac00b05e2d507d416a3e9c4c278ab625ce1dbf2, 30 official commits later than the previous base 866c46d23391.
- The official changes include OAuth/authz/SQLite handling, SSE/Responses, provider routing and combo traces. The Git merge was clean, without a manually chosen side for any conflict.
- The upstream commit adds migration 214_call_logs_client_session_id.sql. Combined candidate now has **211 SQL migration files** including fork-only 213_api_key_preferred_connections.sql. Canonical and 66 i18n mirror documentation references were updated together; exact mirror body comparison passed 66/66.
- No production deployment, real data transfer, update of fork production branch, or modifications to customer databases occurred.

## Release hard stops

1. Exact-SHA hosted API Route Typecheck and full application/CLI build on this merge commit must succeed.
2. Broad upstream CI/Quality Gate failures must be audited and resolved or explicitly attributed to a documented inherited baseline. Do not simply raise thresholds or disable failures.
3. Legacy production SQLite has a historically conflicting migration slot 194. Exercise the actual modern migration runner against a **restorable, sanitized copy of the live fork DB** in an off-host environment, verify original account rules and query support, reboot idempotency and rollback. The existing synthetic in-memory tests do not replace this rehearsal.
4. Validate packed npm artifact and launcher smoke with fake credentials and protected data paths; then staging/canary and tested rollback.
5. Reconcile remaining production-only user features before replacing the old release. Do not infer parity solely from Git history / version strings.

All of these remain outstanding until verified. Current production remains independently pinned to the old tested custom release.
