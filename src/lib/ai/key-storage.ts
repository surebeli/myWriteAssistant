import type { AIProviderId } from "./types";

export interface AIKeyStorage {
  get(providerId: AIProviderId): Promise<string | null>;
  set(providerId: AIProviderId, apiKey: string): Promise<void>;
  delete(providerId: AIProviderId): Promise<void>;
}

const storagePrefix = "mywriteassistant.ai.key.";

export const keyStorage: AIKeyStorage = {
  async get(providerId) {
    if (typeof globalThis.localStorage === "undefined") {
      return null;
    }

    return globalThis.localStorage.getItem(`${storagePrefix}${providerId}`);
  },

  async set(providerId, apiKey) {
    if (typeof globalThis.localStorage === "undefined") {
      return;
    }

    globalThis.localStorage.setItem(`${storagePrefix}${providerId}`, apiKey);
  },

  async delete(providerId) {
    if (typeof globalThis.localStorage === "undefined") {
      return;
    }

    globalThis.localStorage.removeItem(`${storagePrefix}${providerId}`);
  },
};
