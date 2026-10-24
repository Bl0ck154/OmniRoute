export interface AntigravityResilienceSettings {
  preferredTimeoutMs: number;
  gemini38PreferredTimeoutMs: number;
  adaptiveHealthEnabled: boolean;
  timingTelemetryEnabled: boolean;
}

export const DEFAULT_ANTIGRAVITY_RESILIENCE: AntigravityResilienceSettings = {
  preferredTimeoutMs: 5000,
  gemini38PreferredTimeoutMs: 12000,
  adaptiveHealthEnabled: false,
  timingTelemetryEnabled: false,
};

export function normalizeAntigravitySettings(
  value: unknown,
  fallback = DEFAULT_ANTIGRAVITY_RESILIENCE
): AntigravityResilienceSettings {
  const record = value && typeof value === "object" && !Array.isArray(value)
    ? value as Record<string, unknown> : {};
  const timeout = (key: "preferredTimeoutMs" | "gemini38PreferredTimeoutMs") => {
    const candidate = record[key];
    return typeof candidate === "number" && Number.isInteger(candidate) && candidate >= 500 && candidate <= 120000
      ? candidate : fallback[key];
  };
  return {
    preferredTimeoutMs: timeout("preferredTimeoutMs"),
    gemini38PreferredTimeoutMs: timeout("gemini38PreferredTimeoutMs"),
    adaptiveHealthEnabled: typeof record.adaptiveHealthEnabled === "boolean"
      ? record.adaptiveHealthEnabled : fallback.adaptiveHealthEnabled,
    timingTelemetryEnabled: typeof record.timingTelemetryEnabled === "boolean"
      ? record.timingTelemetryEnabled : fallback.timingTelemetryEnabled,
  };
}

export function resolveAntigravitySettings(settings: Record<string, unknown>): AntigravityResilienceSettings {
  const resilience = settings.resilienceSettings as { antigravity?: unknown } | undefined;
  return normalizeAntigravitySettings(resilience?.antigravity);
}
