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

## Firefly image edit gap closed (separate review)

The native Adobe Firefly edit helper now accepts an optional success callback.
The scoped Order Forge API-key capability (after successful policy admission)
uses it to retain the already normalized image data without cloning an
opaque Response, reading an unbounded response stream or serializing JSON
twice. The original response, accounting and error paths remain unchanged.
The callback comes from a guarded local persistence helper whose filesystem
errors do not escape a successful paid image response.

## Phase 3 — refactored Responses API capture

Captures normalized, successful Responses API image generation after tool
completion in the extracted nonstreaming response handler. The newly split
streaming-tail module stores images only on successful, uninterrupted
stream completion, and drains a separate tee of the client stream only for
a principal with the explicit retention permission and a valid artifact ID.
A stream without this capability is unchanged (no tee, no sink read).
Optional disk failures do not impact provider response status or client
delivery, and logs never include payloads or artifact IDs.

Before deployment: hosted focused tests, provider mock end-to-end Responses
success/abort tests, full CI/typecheck, private data path preservation and
canary/rollback are still required.

## Phase 4 — image-generation combo capture

The existing generation combo service now invokes an optional request-owned
success callback with the exact normalized, winning provider payload.
The generations route supplies the callback only when the authenticated API
key has the special image_artifact_retention scope and a validated artifact ID.
No empty/malformed/failing target may emit an artifact. Callback exceptions
are isolated, so a successful paid image stays a 200 with unchanged headers,
JSON body, cost and fallback accounting. Hosted real SQLite/fake-provider
regressions cover first-target failure, final-target success, exhausted combo
and optional-storage failure without any external paid requests.
