# Fork-only Order Forge image artifacts — upstream-first port

**Isolated candidate / non-deployable phase 1.** Restore this explicitly
scoped feature from the currently deployed fork; do not submit customer-specific
application naming / directories to the official upstream repository.

## Included

- `src/lib/usage/orderForgeImageArtifactSink.ts`: original bounded
  PNG/JPEG/WEBP payload validation (25 MiB), atomic private writes (0600),
  per-attempt metadata without prompt/body text, 72-hour expiry, 2 GiB cap,
  duplicate-safe IDs and cancellable stream drain.
- Original standalone sink regression suite from fork production.
- Narrow integration in **direct** `/v1/images/generations` (without changing
  the response body, status, quota eligibility or original image accounting).
  Capture needs the authenticated API key's explicit
  `image_artifact_retention` scope **and** a syntactically valid
  `X-EtsyTrello-Artifact-Id` header. A bare header is not sufficient.
  Retention disk failures never turn a paid image success into a 500.
- Hosted regression gate for scope and basic route placement.

## Remaining before release (hard requirements)

- Port into non-streaming and streaming `open-sse/handlers/chatCore.ts`
  including safe tee/drain across client disconnect and normalized
  `image_generation_call` outputs.
- **Image edits now staged:** combo, Codex, Fal, OpenRouter, Syntx,
  Gemini/Antigravity and custom OpenAI-compatible successful responses are
  scope-gated for private artifact retention. Original dispatch, account
  fallback and billing paths remain unchanged.
- Still need cover Adobe Firefly's separate Response-returning handler and
  audit multi-provider generation combo before release.
- Port independent Codex image quota telemetry, account availability and
  quota header merging only after comparing modern upstream accounting.
- Run focused image pipeline tests, full hosted build and packaged artifact
  smoke, isolated migration rehearsal and review.
- Never copy stored customer image payloads or prompts into GitHub artifacts.

Existing custom artifact directory and metadata are operational data; preserve
the configured volume/directory during rollout and validate backup/rollback
without uploading customer files.
