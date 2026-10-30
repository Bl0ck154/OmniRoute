# Upstream-first migration: CI repairs (2026-10-27)

This draft is stacked on fork PR #84. It is **not** a production release.

## Proven failures and scoped corrections

- CI 40380161588, Docs Sync Strict: root llm.txt identifies 376 providers, while 66 locale English mirror bodies identify 375. Updated only three catalog claims in each mirror, leaving translated headings and locale navigation untouched; the strict mirror gate is not disabled.
- Same CI, check:test-tla-order: two existing tests registered test() before a later top-level dynamic import, unsafe with --test-force-exit. Move each import before any test(); assertions remain unchanged.
- Same CI, i18n Glossary zh-TW: canonical provider term is 提供者; only providerStats.title and providerStats.description still used 供應商. Correct the two glossary violations, preserving all other translations.
- The manual hosted API Route Typecheck workflow now runs the actual strict checks, not simplified replacement assertions.

These are three specific broad-CI blockers, not evidence the entire suite or production upgrade is green.

## Remaining release gates

1. Broad CI: multiple native unit, Vitest, integration and coverage shards still failing. Audit first errors and distinguish official-base failures from migration regressions. Do not waive cycle or security checks.
2. Migration: safely rehearse an actual, isolated, restorable copy of the old production SQLite off-host. Verify the historical 194 collision, schema, API key scope, double-boot idempotence and rollback.
3. Package: verify exact SHA-packed npm tarball and launcher smoke, not just Next.js/CLI compile; canary and rollback.
4. Official baseline: PR #84 anchored to Oct 26 official commit; compare latest upstream before final merge.
5. Do not run OmniRoute builds/tests on the production Netcup host or merge drafts into production without acceptance.
