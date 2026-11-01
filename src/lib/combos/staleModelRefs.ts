/**
 * Stale combo model refs (#13505).
 *
 * After a successful model sync, find combo steps that pin an explicit model
 * of the synced provider which the request-time check would now reject as
 * "not available in the active live catalog". Detection never modifies
 * combos; removal is the separate opt-in in `./staleModelPrune`. Wildcard steps (`provider/*`) resolve live and combo refs
 * are checked on their own, so both are skipped.
 */

import { getCombos } from "@/lib/db/combos";
import { getActiveSyncedCatalog } from "@/lib/db/models/activeSyncedCatalog";
import { getModelInfo, parseModel } from "@/sse/services/model";
import { getComboModelProvider, getComboModelString } from "./steps";

export type StaleComboModelRef = {
  comboId: string;
  comboName: string;
  stepId: string | null;
  model: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function isExplicitModelStep(step: unknown): boolean {
  if (typeof step === "string") return true;
  if (!isRecord(step)) return false;
  return step.kind === undefined || step.kind === "model";
}

/**
 * Return combo steps pinned to a `providerId` model that is missing from the
 * provider's authoritative synced catalog. Fails open: no authoritative
 * catalog (never synced, stale, or not authoritative) means nothing is flagged.
 */
export async function findStaleComboModelRefs(providerId: string): Promise<StaleComboModelRef[]> {
  if (!providerId) return [];
  const catalog = await getActiveSyncedCatalog(providerId);
  if (!catalog.authoritative) return [];

  const stale: StaleComboModelRef[] = [];
  for (const combo of await getCombos()) {
    if (!Array.isArray(combo.models) || typeof combo.id !== "string") continue;
    for (const step of combo.models as unknown[]) {
      if (!isExplicitModelStep(step)) continue;
      const model = getComboModelString(step);
      if (!model) continue;
      const stepProvider = getComboModelProvider(step);
      if (stepProvider !== providerId && parseModel(model).provider !== providerId) continue;

      try {
        const info = (await getModelInfo(model)) as { errorType?: string } | null;
        if (info?.errorType !== "model_not_found") continue;
      } catch {
        // Retired or malformed ids are reported by their own guards, not here.
        continue;
      }
      stale.push({
        comboId: combo.id,
        comboName: typeof combo.name === "string" ? combo.name : combo.id,
        stepId: isRecord(step) && typeof step.id === "string" ? step.id : null,
        model,
      });
    }
  }
  return stale;
}


/**
 * Builder-wide stale badges. Discover provider ids only from explicit combo
 * steps; no broad network/live-model discovery is performed by this UI read.
 * Reuse the same per-provider authoritative-catalog gate as model sync.
 */
export async function findAllStaleComboModelRefs(): Promise<StaleComboModelRef[]> {
  const providerIds = new Set<string>();
  for (const combo of await getCombos()) {
    if (!Array.isArray(combo.models)) continue;
    for (const step of combo.models as unknown[]) {
      if (!isExplicitModelStep(step)) continue;
      const model = getComboModelString(step);
      if (!model) continue;
      const provider = getComboModelProvider(step) || parseModel(model).provider;
      if (provider) providerIds.add(provider);
    }
  }

  const results: StaleComboModelRef[] = [];
  for (const providerId of providerIds) {
    // One provider's discovery/DB failure should not hide warnings for others.
    try {
      results.push(...(await findStaleComboModelRefs(providerId)));
    } catch {
      continue;
    }
  }
  return results;
}
