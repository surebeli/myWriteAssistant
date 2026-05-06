import { beforeEach, describe, expect, test } from "vitest";

import { keyStorage } from "../../src/lib/ai/key-storage";
import { providerRegistry } from "../../src/lib/ai/registry";
import { MissingProviderConfigError, resolveProviderConfig } from "../../src/lib/ai/request-assembly";
import type { AIAdapter, AISettingsV2 } from "../../src/lib/ai/types";
import { useSettingsStore } from "../../src/stores/settings-store";

const fakeModel = {} as ReturnType<AIAdapter["createModel"]>;

function adapter(id: AIAdapter["id"], defaultModels: string[]): AIAdapter {
  return {
    id,
    name: id,
    defaultModels,
    status: "stable",
    capabilities: {
      supportsSystem: true,
      streamingMode: "sse",
      defaultBaseURL: `https://${id}.example.test/v1`,
      authStyle: "bearer",
    },
    createModel: () => fakeModel,
    prepareMessages: (system, messages) => ({ system, messages }),
    extractUsage: () => ({ tokensIn: null, tokensOut: null }),
    normalizeError: () => ({ code: "unknown", message: "safe error" }),
  };
}

const simpleSettings: AISettingsV2 = {
  mode: "simple",
  simple: { providerId: "openai" },
  perScenario: {},
};

beforeEach(() => {
  globalThis.localStorage.clear();
  providerRegistry.splice(0, providerRegistry.length);
  providerRegistry.push(adapter("openai", ["gpt-4o"]), adapter("kimi", ["moonshot-v1-8k"]));

  useSettingsStore.setState({
    schemaVersion: 2,
    ai: simpleSettings,
    workspacePath: null,
    workspaceHandle: null,
    isFirstLaunch: true,
    settingsDialogOpen: false,
    settingsDialogTab: "ai",
  });
});

describe("resolveProviderConfig", () => {
  test("returns simple mode provider config with key and default model", async () => {
    await keyStorage.set("openai", "sk-simple");

    await expect(resolveProviderConfig("chat")).resolves.toEqual({
      id: "openai",
      apiKey: "sk-simple",
      model: "gpt-4o",
      baseURL: undefined,
    });
  });

  test("returns advanced per-scenario config with overrides", async () => {
    useSettingsStore.getState().setAISettings({
      mode: "advanced",
      simple: { providerId: "openai" },
      perScenario: {
        proactive: {
          providerId: "kimi",
          modelOverride: "moonshot-v1-auto",
          baseURLOverride: "https://kimi-proxy.example.test/v1",
        },
      },
    });
    await keyStorage.set("kimi", "sk-advanced");

    await expect(resolveProviderConfig("proactive")).resolves.toEqual({
      id: "kimi",
      apiKey: "sk-advanced",
      model: "moonshot-v1-auto",
      baseURL: "https://kimi-proxy.example.test/v1",
    });
  });

  test("falls back to simple config when advanced scenario override is absent", async () => {
    useSettingsStore.getState().setAISettings({
      mode: "advanced",
      simple: { providerId: "openai", modelOverride: "gpt-4.1" },
      perScenario: {},
    });
    await keyStorage.set("openai", "sk-fallback");

    await expect(resolveProviderConfig("chat")).resolves.toMatchObject({
      id: "openai",
      apiKey: "sk-fallback",
      model: "gpt-4.1",
    });
  });

  test("throws MissingProviderConfigError when key is absent", async () => {
    await expect(resolveProviderConfig("chat")).rejects.toBeInstanceOf(MissingProviderConfigError);
    await expect(resolveProviderConfig("chat")).rejects.toMatchObject({ providerId: "openai" });
  });
});

describe("settings persistence", () => {
  test("persists schemaVersion 2 and AI settings without API keys", async () => {
    useSettingsStore.getState().setAISettings({
      mode: "simple",
      simple: { providerId: "openai", modelOverride: "gpt-4.1" },
      perScenario: {},
    });
    await keyStorage.set("openai", "sk-not-in-zustand");

    const persistedSettings = globalThis.localStorage.getItem("mywriteassistant-settings");

    expect(persistedSettings).toContain('"schemaVersion":2');
    expect(persistedSettings).toContain('"providerId":"openai"');
    expect(persistedSettings).not.toContain("sk-not-in-zustand");
  });
});
