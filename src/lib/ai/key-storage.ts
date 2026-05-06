import type { AIProviderId } from "./types";

export interface AIKeyStorage {
  get(providerId: AIProviderId): Promise<string | null>;
  set(providerId: AIProviderId, apiKey: string): Promise<void>;
  delete(providerId: AIProviderId): Promise<void>;
}

const storagePrefix = "mywriteassistant.ai.key.";

export const keyStorage: AIKeyStorage = {
  async get(providerId) {
    if (typeof window === "undefined") {
      return null;
    }

    return window.localStorage.getItem(`${storagePrefix}${providerId}`);
  },

  async set(providerId, apiKey) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(`${storagePrefix}${providerId}`, apiKey);
  },

  async delete(providerId) {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.removeItem(`${storagePrefix}${providerId}`);
  },
};
