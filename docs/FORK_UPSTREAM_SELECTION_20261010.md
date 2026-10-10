# 2026-10-10: selected 3.8.52 upstream backports

Base: fork `production` (`48484b7500800cf783f6fa2011a0cd3677f31a6d`), already containing the Codex SSE readiness handoff from upstream #15094.

This is deliberately **not** a full merge of the 3.8.52 development release (900 upstream-only commits, 6k+ changed files). Preserve fork-specific OAuth account selection, free-vs-paid policies, telemetry, Gemini aliases, OrderForge image behavior, and packaged runtime fixes.

Backported upstream commits (git cherry-pick -x provenance retained):

- #15886: bind MITM listener to loopback and stop leaking credentials from `/api/providers/client`.
- #15659: recognize Gemini Flash tiered-only Antigravity accounts.
- #15419: support alternate executors in agentic pipelines.
- #16054: model-window-specific quota scoring for combos.
- #16069: exclude malformed custom-model auto candidates.
- #15800: flag combo model steps missing after authoritative model sync.
- #15925: optional auto-prune of obsolete combo steps; **off by default**. Preserved fork's 80 prior feature flags, updated expected count to 81; ignored stale generated translation hash.
- #15918: typed provider availability and dashboard presentation.
- #15893: recognize buffered Responses failures and retain detail.
- #16099: preserve nested streaming error diagnostics.
- #16077: reset network-error deduplication with provider breaker recovery.
- #16101: retain readable Responses compaction summaries.
- #16014: limit explicitly identified Codex overload cooldown to the model instead of the account; preserved fork's auth.ts option types.

Excluded from this batch because they are higher risk, depend on larger upstream refactors, or have no direct benefit for the present usage: full live Antigravity catalog/family quota overhaul (#13739), Nadir API-based router (#13051, third-party service), and broad UI/catalog changes (#15397). These may be evaluated in a later independent change; do not merge untested.

Rollout: test off-server (GitHub Actions), build one verified artifact, run independent packaged smoke; install only through `/opt/omniroute-ops/omniroute-production-update` with checksum, isolated canary, automatic DB backup and rollback. Never build on production VPS. **Do not infer production success from a green source-only test.**
