type JsonRecord = Record<string, unknown>;

const CODEX_SOL_MODEL_RE = /^(?:codex\/|cx\/)?gpt-5\.6-sol(?:-(?:ultra|max|xhigh|high|medium|low)|\((?:ultra|max|xhigh|high|medium|low)\))?$/i;

const CODEX_SOL_PAID_PLANS = new Set([
  "plus",
  "pro",
  "team",
  "chatgptteam",
  "business",
  "enterprise",
  "edu",
  "education",
]);

function normalizePlan(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const normalized = value.trim().toLowerCase().replace(/[\s_-]+/g, "");
  return normalized || null;
}

export function getCodexPlanType(providerSpecificData: unknown): string | null {
  if (!providerSpecificData || typeof providerSpecificData !== "object") return null;
  const data = providerSpecificData as JsonRecord;
  const candidates = [
    data.workspacePlanType,
    data.chatgptPlanType,
    data.workspace_plan_type,
    data.chatgpt_plan_type,
    data.planType,
    data.plan_type,
  ];
  for (const candidate of candidates) {
    const normalized = normalizePlan(candidate);
    if (normalized) return normalized;
  }
  return null;
}

export function isCodexSolModel(model: string | null | undefined): boolean {
  if (typeof model !== "string") return false;
  return CODEX_SOL_MODEL_RE.test(model.trim());
}

export function isCodexPaidPlan(providerSpecificData: unknown): boolean {
  const plan = getCodexPlanType(providerSpecificData);
  return plan !== null && CODEX_SOL_PAID_PLANS.has(plan);
}

/**
 * GPT-5.6 Sol is a paid ChatGPT subscription model on the Codex OAuth backend.
 * Free/Go/unknown accounts must never enter its credential rotation: otherwise
 * every fallback burns an upstream request on an account that cannot serve Sol.
 * Other Codex models keep the full account pool.
 */
export function isCodexPlanEligibleForModel(
  providerSpecificData: unknown,
  requestedModel: string | null | undefined
): boolean {
  if (!isCodexSolModel(requestedModel)) return true;
  return isCodexPaidPlan(providerSpecificData);
}
