import type { AIAdapter, AIProviderId } from "./types";
import { adapters } from "./adapters";

export const providerRegistry: AIAdapter[] = adapters;

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
