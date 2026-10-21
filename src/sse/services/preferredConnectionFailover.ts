export const ANTIGRAVITY_PREFERRED_FAILOVER_START_TIMEOUT_MS = 5_000;
export const ANTIGRAVITY_GEMINI_38_PREFERRED_FAILOVER_START_TIMEOUT_MS = 12_000;

type PreferredCredentialState = {
  selectedByApiKeyPreference?: boolean;
  preferredFallbackAvailable?: boolean;
};

/**
 * A preferred connection is a soft ordering hint, not a pin. When Antigravity
 * has another eligible account behind the preferred one, bound time-to-headers
 * so a silent preferred account can fail over before the client gives up.
 */
export function resolvePreferredConnectionUpstreamStartTimeoutMs(
  provider: string,
  credentials: PreferredCredentialState | null | undefined,
  requestHintMs?: number,
  modelId?: string
): number | undefined {
  const requestHint =
    typeof requestHintMs === "number" && Number.isFinite(requestHintMs) && requestHintMs > 0
      ? Math.floor(requestHintMs)
      : undefined;
  const isAntigravity = provider === "antigravity" || provider === "agy";
  const preferredFailoverCap =
    isAntigravity &&
    credentials?.selectedByApiKeyPreference === true &&
    credentials?.preferredFallbackAvailable === true
      ? /^(?:antigravity\/)?gemini-3\.8-flash-tiered$/i.test((modelId ?? "").trim())
        ? ANTIGRAVITY_GEMINI_38_PREFERRED_FAILOVER_START_TIMEOUT_MS
        : ANTIGRAVITY_PREFERRED_FAILOVER_START_TIMEOUT_MS
      : undefined;

  if (preferredFailoverCap === undefined) return requestHint;
  return requestHint === undefined ? preferredFailoverCap : Math.min(requestHint, preferredFailoverCap);
}
