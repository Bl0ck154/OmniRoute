/**
 * Auto-managed model exclusion for Antigravity accounts without a Gemini 4 Argon quota. It covers
 * Argon only: the other Gemini 4 models draw on the shared Gemini pool (#21132).
 */
export const ARGON_EXCLUSION = "*argon*";

/** The fork owner explicitly retired the blanket Gemini 4 exclusion for Antigravity. */
const LEGACY_GEMINI_4_EXCLUSION = "gemini-4*";

export function dropLegacyGemini4Exclusion(patterns: string[]): string[] {
  return patterns.filter((pattern) => pattern.trim().toLowerCase() !== LEGACY_GEMINI_4_EXCLUSION);
}

/** Also sanitize imported or refreshed connection metadata before it is persisted. */
export function sanitizeAntigravityExclusions(data: Record<string, unknown>): Record<string, unknown> {
  let next = data;
  for (const key of ["excludedModels", "excluded_models"]) {
    const value = data[key];
    if (Array.isArray(value)) {
      const filtered = value.filter((pattern) => typeof pattern !== "string" || pattern.trim().toLowerCase() !== LEGACY_GEMINI_4_EXCLUSION);
      if (filtered.length !== value.length) next = { ...next, [key]: filtered };
    } else if (typeof value === "string") {
      const entries = value.split(",");
      const filtered = dropLegacyGemini4Exclusion(entries);
      if (filtered.length !== entries.length) next = { ...next, [key]: filtered.join(",") };
    }
  }
  return next;
}
