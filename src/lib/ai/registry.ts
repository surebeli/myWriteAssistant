import type { AIAdapter, AIProviderId } from "./types";
import { adapters } from "./adapters";

/** In-memory registry of all installed provider adapters. */
export const providerRegistry: AIAdapter[] = adapters;

/** List every registered adapter. */
export function listAdapters(): AIAdapter[] {
  return providerRegistry;
}

/**
 * Retrieve an adapter by its provider ID.
 * @throws {Error} If the provider is not registered.
 */
export function getAdapter(providerId: AIProviderId): AIAdapter {
  const adapter = providerRegistry.find((item) => item.id === providerId);

  if (!adapter) {
    throw new Error(`AI provider is not registered: ${providerId}`);
  }

  return adapter;
}

/** Check whether an adapter for the given provider exists. */
export function hasAdapter(providerId: AIProviderId): boolean {
  return providerRegistry.some((item) => item.id === providerId);
}
