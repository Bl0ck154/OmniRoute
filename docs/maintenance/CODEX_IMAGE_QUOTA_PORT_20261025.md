# Codex image quota migration audit

This draft imports the isolated five-hour quota accounting helper and its original regression tests. No live image route is changed in this stage.

The helper formats display-safe remaining percentages, the image request delta, and five-hour reset metadata. If a reset occurs between the before and after measurements, it suppresses a misleading cross-window delta.

Before deployment, wire fresh per-selected-account sampling into both Codex image generations and edits, preserving fallback, connection restrictions, successful-response-only headers and budgeted requests. Verify on hosted integration tests, then full build, database rehearsal, and canary.

No production deployments were performed.


## Phase 2 — selected account wiring, opt-in telemetry

The migration retains the original 5-hour before/after/delta response header
format, but its account attribution now lives *inside* the actual provider
attempt under the existing restricted \`executeImageWithCredentialFallback\`
boundary. No fabricated delta if either 5h reset window is unknown, a rollover
is observed, or the quota API fails. Quota observations are made via the
existing account-scoped, proxy-aware throttle; uncached observations bypass
only the 60s cache and never submit an extra image inference request.

**Operational change, deliberate:** gated by
\`OMNIROUTE_CODEX_IMAGE_QUOTA_TELEMETRY=1\` (default OFF), because two extra
quota reads may add 2 throttled requests and up to 16 seconds of worst-case
timeout overhead to a Codex image job. This is not a hidden feature flag:
enable only after operator review and rate-limit/staging testing, and avoid
customer-facing performance regressions.

Both image generation and native Codex edits set the quota headers on the
same successful client JSON response; failed/fallback accounts do not report
their quota as the successful image's consumption. Hosted regressions check
disabled zero extra calls, exact selected account, numeric delta, rollover,
quota outage fail-open, and zero extra image submissions.

More work: actual provider-mock and live quota egress/rotation staging (no
production outbound probes from this migration task), broad CI plus packaged
smoke, and explicit migration/canary approval.
