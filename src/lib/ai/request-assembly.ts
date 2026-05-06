import type { AIProviderConfig, AIProviderId, AIScenario } from "./types";

export class MissingProviderConfigError extends Error {
  constructor(public providerId: AIProviderId) {
    super(`No API key configured for provider: ${providerId}`);
    this.name = "MissingProviderConfigError";
  }
}

export async function resolveProviderConfig(_scenario: AIScenario): Promise<AIProviderConfig> {
  throw new MissingProviderConfigError("doubao");
}

export function generateRequestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
