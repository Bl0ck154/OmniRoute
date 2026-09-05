export interface CodexImageQuotaTelemetryShape {
  connectionId?: string | null;
  fiveHourBeforeRemainingPercent?: number | null;
  fiveHourAfterRemainingPercent?: number | null;
  fiveHourResetAt?: string | null;
  observedAt?: string | null;
}


export type FreshCodexImageQuotaBaseline = {
  connectionId?: string | null;
  fiveHourPercentUsed: number;
  fiveHourResetAt?: string | null;
  observedAt?: string | null;
};

/**
 * Replace a cached/persisted "before" value with a quota snapshot fetched
 * immediately before the image request. If the 5h window rolled over while
 * the image was generating, suppress the cross-window before/delta instead of
 * presenting a misleading consumption number.
 */
export function mergeFreshCodexImageQuotaBaseline(
  telemetry: CodexImageQuotaTelemetryShape | null | undefined,
  baseline: FreshCodexImageQuotaBaseline
): CodexImageQuotaTelemetryShape {
  const current = telemetry ?? {};
  const beforeReset =
    typeof baseline.fiveHourResetAt === "string" && baseline.fiveHourResetAt.trim()
      ? baseline.fiveHourResetAt.trim()
      : null;
  const afterReset =
    typeof current.fiveHourResetAt === "string" && current.fiveHourResetAt.trim()
      ? current.fiveHourResetAt.trim()
      : null;
  const sameWindow = !(beforeReset && afterReset && beforeReset !== afterReset);
  const usedFraction = Number(baseline.fiveHourPercentUsed);
  const beforeRemaining = Number.isFinite(usedFraction)
    ? Math.max(0, Math.min(100, 100 - usedFraction * 100))
    : null;

  return {
    ...current,
    connectionId: baseline.connectionId ?? current.connectionId ?? null,
    fiveHourBeforeRemainingPercent: sameWindow ? beforeRemaining : null,
    fiveHourResetAt: afterReset ?? beforeReset,
    observedAt: current.observedAt ?? baseline.observedAt ?? null,
  };
}

export const CODEX_IMAGE_QUOTA_HEADERS = {
  connectionId: "X-OmniRoute-Codex-Connection-Id",
  beforeRemaining: "X-OmniRoute-Codex-5H-Before-Remaining",
  afterRemaining: "X-OmniRoute-Codex-5H-After-Remaining",
  deltaUsed: "X-OmniRoute-Codex-5H-Delta-Used",
  resetAt: "X-OmniRoute-Codex-5H-Reset-At",
  observedAt: "X-OmniRoute-Codex-Quota-Observed-At",
} as const;

function percent(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.max(0, Math.min(100, parsed));
}

function formatPercent(value: number): string {
  return value.toFixed(4).replace(/0+$/, "").replace(/\.$/, "");
}

/** Attach display-safe quota facts for the exact Codex account that served an image. */
export function attachCodexImageQuotaHeaders(
  headers: Headers,
  telemetry: CodexImageQuotaTelemetryShape | null | undefined
): void {
  if (!telemetry) return;
  const connectionId =
    typeof telemetry.connectionId === "string" ? telemetry.connectionId.trim() : "";
  if (connectionId) headers.set(CODEX_IMAGE_QUOTA_HEADERS.connectionId, connectionId);

  const before = percent(telemetry.fiveHourBeforeRemainingPercent);
  const after = percent(telemetry.fiveHourAfterRemainingPercent);
  if (before !== null) {
    headers.set(CODEX_IMAGE_QUOTA_HEADERS.beforeRemaining, formatPercent(before));
  }
  if (after !== null) {
    headers.set(CODEX_IMAGE_QUOTA_HEADERS.afterRemaining, formatPercent(after));
  }
  if (before !== null && after !== null) {
    headers.set(
      CODEX_IMAGE_QUOTA_HEADERS.deltaUsed,
      formatPercent(Math.max(0, before - after))
    );
  }

  if (typeof telemetry.fiveHourResetAt === "string" && telemetry.fiveHourResetAt.trim()) {
    headers.set(CODEX_IMAGE_QUOTA_HEADERS.resetAt, telemetry.fiveHourResetAt.trim());
  }
  if (typeof telemetry.observedAt === "string" && telemetry.observedAt.trim()) {
    headers.set(CODEX_IMAGE_QUOTA_HEADERS.observedAt, telemetry.observedAt.trim());
  }
}
