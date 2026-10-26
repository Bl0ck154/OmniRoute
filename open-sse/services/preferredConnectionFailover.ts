/**
 * Per-API-key connection preference is only a soft ordering hint. A bounded
 * response-header wait is useful ONLY when a second eligible Antigravity
 * account exists. Do not change an explicit pin, a singleton, or other providers.
 *
 * Values live in the existing DB-backed resilienceSettings.antigravity object;
 * reading this per-request snapshot does not make a new DB query.
 */
export const DEFAULT_PREFERRED_CONNECTION_TIMEOUT_MS = 5_000;
export const DEFAULT_GEMINI38_PREFERRED_CONNECTION_TIMEOUT_MS = 12_000;

export type PreferredConnectionCredentialState = {
  selectedByApiKeyPreference?: unknown;
  preferredFallbackAvailable?: unknown;
} | null | undefined;

function approvedTimeout(value: unknown, fallback: number): number {
  return typeof value === "number" &&
    Number.isInteger(value) &&
    value >= 500 &&
    value <= 120_000
    ? value
    : fallback;
}

export function getPreferredAntigravityStartTimeoutCapMs(
  provider: string,
  credentials: PreferredConnectionCredentialState,
  modelId: string,
  settings?: Record<string, unknown> | null
): number | undefined {
  if (
    (provider !== "antigravity" && provider !== "agy") ||
    credentials?.selectedByApiKeyPreference !== true ||
    credentials?.preferredFallbackAvailable !== true
  ) {
    return undefined;
  }

  const resilience = settings?.resilienceSettings;
  const antigravity =
    resilience && typeof resilience === "object" && !Array.isArray(resilience)
      ? (resilience as Record<string, unknown>).antigravity
      : null;
  const overrides =
    antigravity && typeof antigravity === "object" && !Array.isArray(antigravity)
      ? (antigravity as Record<string, unknown>)
      : {};

  // The model requested through the API can differ from the executor wire ID;
  // both common alias shapes identify the same 3.8 family.
  const isGemini38 = /^gemini-3\.8-flash(?:-tiered|-high|-medium|-low)?$/i.test(
    modelId.trim().replace(/^antigravity\//i, "")
  );
  return isGemini38
    ? approvedTimeout(
        overrides.gemini38PreferredTimeoutMs,
        DEFAULT_GEMINI38_PREFERRED_CONNECTION_TIMEOUT_MS
      )
    : approvedTimeout(overrides.preferredTimeoutMs, DEFAULT_PREFERRED_CONNECTION_TIMEOUT_MS);
}
