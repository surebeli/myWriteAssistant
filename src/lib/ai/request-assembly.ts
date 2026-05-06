import type { AIProviderConfig, AIProviderId, AIScenario } from "./types";
import { keyStorage } from "./key-storage";
import { getAdapter } from "./registry";
import { useSettingsStore } from "../../stores/settings-store";

export class MissingProviderConfigError extends Error {
  constructor(public providerId: AIProviderId) {
    super(`No API key configured for provider: ${providerId}`);
    this.name = "MissingProviderConfigError";
  }
}

export async function resolveProviderConfig(scenario: AIScenario): Promise<AIProviderConfig> {
  const settings = useSettingsStore.getState().ai;
  const scenarioConfig =
    settings.mode === "simple" ? settings.simple : settings.perScenario[scenario] ?? settings.simple;

  const apiKey = await keyStorage.get(scenarioConfig.providerId);
  if (!apiKey) {
    throw new MissingProviderConfigError(scenarioConfig.providerId);
  }

  const adapter = getAdapter(scenarioConfig.providerId);

  return {
    id: scenarioConfig.providerId,
    apiKey,
    model: scenarioConfig.modelOverride ?? adapter.defaultModels[0],
    baseURL: scenarioConfig.baseURLOverride,
  };
}

export function generateRequestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
