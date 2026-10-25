# 2026-10-25 — Upstream-first candidate gate inventory

This document tracks the draft staged migration. It is not a release approval.

## Pinned provenance

- Fork migration clean ancestor: `5b3be70ba82ce70b59d02e2893afa3d81b6ee88b` from official v3.8.53.
- Stacked Antigravity/UI head before this documentation fix: `fe4bc7da80548513bdbb3a02625aadba24d52156` (draft PR #59).
- No production source, service, releases or SQLite DB is modified by candidate CI.

## Broad GitHub Actions evidence at prior head

- [CI run 40164339727](https://github.com/Bl0ck154/OmniRoute/actions/runs/40164339727)
- [Quality Gates run 40164341312](https://github.com/Bl0ck154/OmniRoute/actions/runs/40164341312)

### Confirmed gate failures

1. `check:docs-counts`: the new canonical migration 213 adds a **210th**
   `.sql` file, but documentation still claimed 209 in English references
   and 66 localized READMEs. This branch updates **72 references in 69
   files** without translating/rewording any unrelated text.
2. `check:changelog-integrity` on manual workflow_dispatch selected the
   older fork `origin/release/v3.8.51` as implicit fallback; its two
   historical bullet lines differ from the corrected, complete official
   v3.8.53 changelog. They are **not missing** from the pinned upstream
   migration ancestor (zero bullet-line losses verified). The manual-only
   test now explicitly compares with the actual official clean migration
   ancestor; normal PR checks continue to use the PR base.
3. `check:vuln-ratchet` reports 29 advisories against an official baseline
   of 27; `npm audit` fails on critical issues. This appears to be a
   dependency/security baseline problem inherited from the pinned official
   code, **not resolved by this documentation patch**. Do NOT disable
   security gates or bump baseline merely to make CI green.

## Hard release blockers

Broad CI + security checks; exact-source off-host build/packaged launcher
smoke; a restorable isolated old-SQLite migration rehearsal (including
170/194 ledger collision); preservation of fork-only Order Forge image
retention and Codex quota telemetry; rollback and canary verification.

Never use `Build custom OmniRoute release` to validate a draft: that workflow
checks out `production` and *publishes* a GitHub Release, so it does not
validate this candidate and cannot be treated as a dry-run.
