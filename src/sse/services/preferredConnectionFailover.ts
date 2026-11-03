import { DEFAULT_ANTIGRAVITY_RESILIENCE, type AntigravityResilienceSettings } from "@/lib/resilience/antigravitySettings";
import { normalizeAntigravityHealthModel } from "@omniroute/open-sse/services/antigravityHealth";

export const ANTIGRAVITY_PREFERRED_FAILOVER_START_TIMEOUT_MS = DEFAULT_ANTIGRAVITY_RESILIENCE.preferredTimeoutMs;
export const ANTIGRAVITY_GEMINI_38_PREFERRED_FAILOVER_START_TIMEOUT_MS = DEFAULT_ANTIGRAVITY_RESILIENCE.gemini38PreferredTimeoutMs;

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
  modelId?: string,
  settings: AntigravityResilienceSettings = DEFAULT_ANTIGRAVITY_RESILIENCE
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
      ? /^gemini-3\.8-flash(?:-tiered|-high|-medium|-low)?$/i.test(normalizeAntigravityHealthModel(modelId ?? ""))
        ? settings.gemini38PreferredTimeoutMs
        : settings.preferredTimeoutMs
      : undefined;

  if (preferredFailoverCap === undefined) return requestHint;
  return requestHint === undefined ? preferredFailoverCap : Math.min(requestHint, preferredFailoverCap);
}
