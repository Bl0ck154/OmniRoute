# Codex image quota migration audit

This draft imports the isolated five-hour quota accounting helper and its original regression tests. No live image route is changed in this stage.

The helper formats display-safe remaining percentages, the image request delta, and five-hour reset metadata. If a reset occurs between the before and after measurements, it suppresses a misleading cross-window delta.

Before deployment, wire fresh per-selected-account sampling into both Codex image generations and edits, preserving fallback, connection restrictions, successful-response-only headers and budgeted requests. Verify on hosted integration tests, then full build, database rehearsal, and canary.

No production deployments were performed.
