export const ANTIGRAVITY_PREFERRED_FAILOVER_START_TIMEOUT_MS = 5_000;

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
  requestHintMs?: number
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
      ? ANTIGRAVITY_PREFERRED_FAILOVER_START_TIMEOUT_MS
      : undefined;

  if (preferredFailoverCap === undefined) return requestHint;
  return requestHint === undefined ? preferredFailoverCap : Math.min(requestHint, preferredFailoverCap);
}
