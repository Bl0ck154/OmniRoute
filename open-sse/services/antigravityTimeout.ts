import { ANTIGRAVITY_PRE_RESPONSE_TIMEOUT_CODE } from "../config/constants.ts";

/** Exact phase evidence. A generic 504 or BodyTimeoutError is insufficient. */
export function isAntigravityPreResponseTimeout(error: unknown): boolean {
  return (
    error !== null &&
    typeof error === "object" &&
    (error as { code?: unknown }).code === ANTIGRAVITY_PRE_RESPONSE_TIMEOUT_CODE
  );
}

export function isAntigravityProvider(provider: string | null | undefined): boolean {
  return provider === "antigravity" || provider === "agy";
}
