// @vitest-environment jsdom
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import messages from "../../src/i18n/messages/en.json";
import AntigravityResilienceCard from "../../src/app/(dashboard)/dashboard/settings/components/AntigravityResilienceCard";
import type { AntigravityResilienceSettings } from "../../src/lib/resilience/antigravitySettings";

const defaults: AntigravityResilienceSettings = {
  preferredTimeoutMs: 5000,
  gemini38PreferredTimeoutMs: 12000,
  adaptiveHealthEnabled: false,
  timingTelemetryEnabled: false,
};

function mount(onSave = vi.fn().mockResolvedValue(undefined)) {
  const view = render(
    <NextIntlClientProvider locale="en" messages={messages}>
      <AntigravityResilienceCard value={defaults} onSave={onSave} saving={false} />
    </NextIntlClientProvider>
  );
  return { ...view, onSave };
}

describe("Antigravity resilience settings UI", () => {
  it("shows opt-in defaults disabled and requires explicit Edit before exposing controls", () => {
    mount();
    expect(screen.getByText(/Adaptive model quarantine:/)).toBeTruthy();
    expect(screen.getByText(/Timing diagnostics:/)).toBeTruthy();
    expect(screen.getByText(/12000ms/)).toBeTruthy();
    expect(screen.queryByRole("button", { name: "Save" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText("Adaptive model quarantine")).toBeTruthy();
    expect(screen.getByRole("button", { name: "Save" })).toBeTruthy();
  });

  it("persists changes only on explicit Save and Cancel discards the draft", async () => {
    const { onSave } = mount();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onSave).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(onSave).toHaveBeenCalledWith(defaults);
  });

  it("keeps Edit mode after API save failure so the operator can retry", async () => {
    const onSave = vi.fn().mockRejectedValue(new Error("fixture save failure"));
    mount(onSave);
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Save" }));
    await waitFor(() => expect(onSave).toHaveBeenCalledTimes(1));
    expect(screen.getByRole("button", { name: "Cancel" })).toBeTruthy();
  });
});
