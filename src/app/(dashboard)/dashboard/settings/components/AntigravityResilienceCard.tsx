"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button, Card } from "@/shared/components";
import type { AntigravityResilienceSettings } from "@/lib/resilience/antigravitySettings";
import { BooleanField, NumberField } from "./ResilienceFields";

export default function AntigravityResilienceCard({ value, saving, onSave }: {
  value: AntigravityResilienceSettings;
  saving: boolean;
  onSave: (next: AntigravityResilienceSettings) => Promise<void>;
}) {
  const t = useTranslations("settings");
  const common = useTranslations("common");
  const [draft, setDraft] = useState(value);
  const [previous, setPrevious] = useState(value);
  if (previous !== value) { setPrevious(value); setDraft(value); }
  const tx = (key: string, fallback: string) => typeof t.has === "function" && t.has(key as never) ? t(key as never) : fallback;

  return (
    <Card className="space-y-4 p-6">
      <h2 className="text-lg font-bold">{tx("antigravityResilienceTitle", "Antigravity resilience")}</h2>
      <p className="text-sm text-text-muted">
        {tx("antigravityResilienceDescription", "Preferred account timeouts apply when another eligible account is available. Changes apply to new requests.")}
      </p>
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <NumberField label={tx("antigravityPreferredTimeout", "Preferred account timeout")}
          value={draft.preferredTimeoutMs} min={500} max={120000} suffix="ms"
          onChange={(preferredTimeoutMs) => setDraft({ ...draft, preferredTimeoutMs })} />
        <NumberField label={tx("antigravityGemini38Timeout", "Gemini 3.8 preferred account timeout")}
          value={draft.gemini38PreferredTimeoutMs} min={500} max={120000} suffix="ms"
          onChange={(gemini38PreferredTimeoutMs) => setDraft({ ...draft, gemini38PreferredTimeoutMs })} />
        <BooleanField label={tx("antigravityAdaptiveHealth", "Adaptive model quarantine")}
          description={tx("antigravityAdaptiveHealthDescription", "Temporarily avoid accounts with repeated confirmed header timeouts for this model. Recovery uses real requests.")}
          checked={draft.adaptiveHealthEnabled}
          onChange={(adaptiveHealthEnabled) => setDraft({ ...draft, adaptiveHealthEnabled })} />
        <BooleanField label={tx("antigravityTimingTelemetry", "Timing diagnostics")}
          description={tx("antigravityTimingTelemetryDescription", "Record account idle time, concurrency, header latency and first model output without prompts or credentials.")}
          checked={draft.timingTelemetryEnabled}
          onChange={(timingTelemetryEnabled) => setDraft({ ...draft, timingTelemetryEnabled })} />
      </div>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={() => setDraft(value)} disabled={saving}>{common("cancel")}</Button>
        <Button size="sm" variant="primary" icon="save" onClick={() => void onSave(draft).catch(() => {})} disabled={saving}>{common("save")}</Button>
      </div>
    </Card>
  );
}
