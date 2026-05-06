import type { AIProviderConfig, AIProviderId, AIScenario } from "./types";
import { keyStorage } from "./key-storage";
import { getAdapter } from "./registry";
import { useSettingsStore } from "../../stores/settings-store";

/** Thrown when a provider has no API key configured. */
export class MissingProviderConfigError extends Error {
  constructor(public providerId: AIProviderId) {
    super(`No API key configured for provider: ${providerId}`);
    this.name = "MissingProviderConfigError";
  }
}

/**
 * Resolve the active provider configuration for a given scenario.
 * @param scenario - The AI scenario (chat or proactive).
 * @returns Fully resolved provider configuration.
 * @throws {MissingProviderConfigError} If the API key is missing.
 */
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

/** Generate a unique request ID for tracing a single AI call. */
export function generateRequestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
