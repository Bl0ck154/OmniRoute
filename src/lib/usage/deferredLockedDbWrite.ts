/**
 * One bounded follow-up for a previously locked SQLite write.
 *
 * This is intentionally separate from usageWriteRetry.scheduleWriteRetry,
 * which takes a UsageEntry and has no callback/PROMISE contract.
 * Call-log writers await the result before finalizing details; proxy logging
 * uses an unref timer for best-effort background persistence.
 */
export function retryLockedDbWrite(
  action: () => void,
  reportFailure: (error: unknown) => void,
  options: { detachTimer?: boolean; delayMs?: number } = {}
): Promise<void> {
  return new Promise<void>((resolve) => {
    const delayMs = Math.max(0, options.delayMs ?? 1000);
    const timer = setTimeout(() => {
      try {
        action();
      } catch (error) {
        try {
          reportFailure(error);
        } catch (reportError) {
          console.error("[DB] Locked write retry error reporter failed", reportError);
        }
      } finally {
        resolve();
      }
    }, delayMs);
    if (options.detachTimer) timer.unref?.();
  });
}
