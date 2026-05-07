import { describe, expect, test } from "vitest";

import {
  getSmokeApiKeyName,
  parseSmokeArgs,
  runProviderSmoke,
} from "../../scripts/test-providers";
import { listAdapters } from "../../src/lib/ai/registry";
import type { AIAdapter } from "../../src/lib/ai/types";

const fakeModel = {} as ReturnType<AIAdapter["createModel"]>;

function adapter(id: AIAdapter["id"]): AIAdapter {
  return {
    id,
    name: id,
    defaultModels: [`${id}-default`],
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

describe("test-providers smoke runner", () => {
  test("maps provider ids to smoke API key env names", () => {
    expect(getSmokeApiKeyName("deepseek")).toBe("SMOKE_DEEPSEEK_API_KEY");
  });

  test("parses --only and forces require-all-stable in CI", () => {
    expect(parseSmokeArgs(["--only=claude"], { CI: "true" })).toMatchObject({
      only: "claude",
      requireAllStable: true,
    });
  });

  test("skips providers without keys in default mode", async () => {
    const called: string[] = [];
    const summary = await runProviderSmoke({
      adapters: [adapter("openai"), adapter("kimi")],
      env: { SMOKE_OPENAI_API_KEY: "sk-openai" },
      sendPing: async ({ adapter: currentAdapter, prompt }) => {
        called.push(`${currentAdapter.id}:${prompt}`);
        return "pong";
      },
    });

    expect(summary.exitCode).toBe(0);
    expect(called).toEqual(["openai:ping"]);
    expect(summary.results).toMatchObject([
      { provider: "openai", status: "passed" },
      { provider: "kimi", status: "skipped", reason: "missing_key" },
    ]);
  });

  test("fails selected provider without key when require-all-stable is enabled", async () => {
    const summary = await runProviderSmoke({
      adapters: [adapter("openai")],
      env: {},
      only: "openai",
      requireAllStable: true,
      sendPing: async () => "pong",
    });

    expect(summary.exitCode).toBe(1);
    expect(summary.results).toEqual([
      { provider: "openai", status: "failed", reason: "missing_key" },
    ]);
  });

  test("fails when ping response is empty", async () => {
    const summary = await runProviderSmoke({
      adapters: [adapter("openai")],
      env: { SMOKE_OPENAI_API_KEY: "sk-openai" },
      sendPing: async () => "",
    });

    expect(summary.exitCode).toBe(1);
    expect(summary.results).toMatchObject([
      { provider: "openai", status: "failed", reason: "empty_response" },
    ]);
  });

  test("can target the registered Claude adapter with an injected smoke sender", async () => {
    const called: string[] = [];
    const summary = await runProviderSmoke({
      adapters: listAdapters(),
      env: { SMOKE_CLAUDE_API_KEY: "sk-ant-test" },
      only: "claude",
      sendPing: async ({ adapter: currentAdapter, prompt }) => {
        called.push(`${currentAdapter.id}:${prompt}`);
        return "pong";
      },
    });

    expect(summary.exitCode).toBe(0);
    expect(called).toEqual(["claude:ping"]);
    expect(summary.results).toMatchObject([
      { provider: "claude", status: "passed" },
    ]);
  });

  test("require-all-stable reports OpenAI and Kimi missing keys instead of not_registered", async () => {
    const summary = await runProviderSmoke({
      adapters: listAdapters(),
      env: {},
      requireAllStable: true,
      sendPing: async () => "pong",
    });

    expect(summary.results).toContainEqual({
      provider: "openai",
      status: "failed",
      reason: "missing_key",
    });
    expect(summary.results).toContainEqual({
      provider: "kimi",
      status: "failed",
      reason: "missing_key",
    });
  });
});
