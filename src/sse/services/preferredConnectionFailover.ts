/** Backwards-compatible app export; policy is engine-owned to avoid open-sse -> src coupling. */
export {
  DEFAULT_PREFERRED_CONNECTION_TIMEOUT_MS,
  DEFAULT_GEMINI38_PREFERRED_CONNECTION_TIMEOUT_MS,
  getPreferredAntigravityStartTimeoutCapMs,
  type PreferredConnectionCredentialState,
} from "@omniroute/open-sse/services/preferredConnectionFailover.ts";
