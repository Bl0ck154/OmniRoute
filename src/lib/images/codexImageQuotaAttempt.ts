import {
  fetchFreshCodexQuota,
  type CodexDualWindowQuota,
} from "@omniroute/open-sse/services/codexQuotaFetcher.ts";
import {
  mergeFreshCodexImageQuotaBaseline,
  type CodexImageQuotaTelemetryShape,
} from "./codexImageQuotaTelemetry";

/**
 * Global default OFF: two independently throttled quota probes can add latency
 * and quota-API traffic; operators opt in deliberately for image usage analysis.
 * All probes are tied to the exact account which actually receives an attempt.
 */
export function isCodexImageQuotaTelemetryEnabled(): boolean {
  return process.env.OMNIROUTE_CODEX_IMAGE_QUOTA_TELEMETRY === "1";
}

type QuotaSample = Pick<CodexDualWindowQuota, "window5h"> | null;

export function mergeCodexImageQuotaSamples(
  connectionId: string,
  before: QuotaSample,
  after: QuotaSample,
  observedAt: string
): CodexImageQuotaTelemetryShape {
  const afterRemaining =
    after && Number.isFinite(after.window5h.percentUsed)
      ? Math.max(0, Math.min(100, 100 - after.window5h.percentUsed * 100))
      : null;
  const afterReset = after?.window5h.resetAt ?? null;
  const current: CodexImageQuotaTelemetryShape = {
    connectionId,
    fiveHourAfterRemainingPercent: afterRemaining,
    fiveHourResetAt: afterReset,
    observedAt,
  };
  if (
    !before ||
    !after ||
    !before.window5h.resetAt ||
    !after.window5h.resetAt ||
    !Number.isFinite(before.window5h.percentUsed)
  ) return current;
  // A trustworthy delta needs BOTH observation timestamps/windows; merely
  // observing an after-value in an unknown 5h window is insufficient.
  return mergeFreshCodexImageQuotaBaseline(current, {
    connectionId,
    fiveHourPercentUsed: before.window5h.percentUsed,
    fiveHourResetAt: before.window5h.resetAt,
    observedAt,
  });
}

export async function withCodexImageQuotaAttempt<
  T extends { success: boolean; telemetry?: { codexQuota?: CodexImageQuotaTelemetryShape } }
>({
  provider,
  connectionId,
  credentials,
  requestedModel,
  execute,
  enabled = isCodexImageQuotaTelemetryEnabled(),
  fetchQuota = fetchFreshCodexQuota,
}: {
  provider: string;
  connectionId?: string | null;
  credentials?: Record<string, unknown> | null;
  requestedModel: string | null;
  execute: () => Promise<T>;
  enabled?: boolean;
  fetchQuota?: (id: string, connection: Record<string, unknown>) => Promise<QuotaSample>;
}): Promise<T & { telemetry?: { codexQuota?: CodexImageQuotaTelemetryShape } }> {
  if (!enabled || provider !== "codex" || !connectionId) return execute();
  const info: Record<string, unknown> = {
    ...(credentials ?? {}),
    // A credential fallback may be selected before the request model has
    // been fully normalized. Keep the quota fetcher's nullable model contract.
    ...(requestedModel ? { requestedModel } : {}),
  };
  const before = await fetchQuota(connectionId, info).catch(() => null);
  // Exactly ONE inference dispatch: quota errors never cause image replay.
  const result = await execute();
  if (!result.success) return result;
  const after = await fetchQuota(connectionId, info).catch(() => null);
  if (!before && !after) return result;
  const quota = mergeCodexImageQuotaSamples(connectionId, before, after, new Date().toISOString());
  result.telemetry = { ...(result.telemetry ?? {}), codexQuota: quota };
  return result;
}
