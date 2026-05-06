import type { AIAdapter, AIProviderId } from "./types";

export const providerRegistry: AIAdapter[] = [];

export function listAdapters(): AIAdapter[] {
  return providerRegistry;
}

export function getAdapter(providerId: AIProviderId): AIAdapter {
  const adapter = providerRegistry.find((item) => item.id === providerId);

  if (!adapter) {
    throw new Error(`AI provider is not registered: ${providerId}`);
  }

  return adapter;
}

export function hasAdapter(providerId: AIProviderId): boolean {
  return providerRegistry.some((item) => item.id === providerId);
}
