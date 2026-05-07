import { beforeEach, describe, expect, test, vi } from "vitest";

const { chatModelMock, createOpenAIMock, defaultModelMock } = vi.hoisted(() => {
  const defaultModelMock = vi.fn(() => ({ route: "responses" }));
  const chatModelMock = vi.fn(() => ({ route: "chat-completions" }));
  const createOpenAIMock = vi.fn(() => Object.assign(defaultModelMock, { chat: chatModelMock }));

  return {
    chatModelMock,
    createOpenAIMock,
    defaultModelMock,
  };
});

vi.mock("@ai-sdk/openai", () => ({
  createOpenAI: createOpenAIMock,
}));

import { kimiAdapter } from "../../src/lib/ai/adapters/kimi";
import { getAdapter, listAdapters } from "../../src/lib/ai/registry";
import type { CoreMessage } from "../../src/lib/ai/types";

describe("kimi adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("is registered as a stable OpenAI-compatible provider", () => {
    expect(listAdapters().map((adapter) => adapter.id)).toContain("kimi");
    expect(getAdapter("kimi")).toBe(kimiAdapter);
    expect(kimiAdapter.capabilities).toMatchObject({
      supportsSystem: true,
      streamingMode: "sse",
      defaultBaseURL: "https://api.moonshot.ai/v1",
      authStyle: "bearer",
    });
    expect(kimiAdapter.defaultModels).toEqual(["kimi-k2.6"]);
  });

  test("creates a chat-completions model with Moonshot defaults", () => {
    const model = kimiAdapter.createModel({
      id: "kimi",
      apiKey: "sk-test",
      model: "kimi-k2.6",
    });

    expect(createOpenAIMock).toHaveBeenCalledWith({
      apiKey: "sk-test",
      baseURL: "https://api.moonshot.ai/v1",
    });
    expect(chatModelMock).toHaveBeenCalledWith("kimi-k2.6");
    expect(defaultModelMock).not.toHaveBeenCalled();
    expect(model).toEqual({ route: "chat-completions" });
  });

  test("allows base URL override for proxy deployments", () => {
    kimiAdapter.createModel({
      id: "kimi",
      apiKey: "sk-test",
      model: "custom-kimi-model",
      baseURL: "https://moonshot-proxy.example.test/v1",
    });

    expect(createOpenAIMock).toHaveBeenCalledWith({
      apiKey: "sk-test",
      baseURL: "https://moonshot-proxy.example.test/v1",
    });
    expect(chatModelMock).toHaveBeenCalledWith("custom-kimi-model");
  });

  test("moves system prompts into messages for OpenAI-compatible dispatch", () => {
    const messages: CoreMessage[] = [{ role: "user", content: "hello" }];

    expect(kimiAdapter.prepareMessages("system prompt", messages)).toEqual({
      system: undefined,
      messages: [{ role: "system", content: "system prompt" }, ...messages],
    });
  });

  test("extracts usage from AI SDK and Kimi raw shapes", () => {
    expect(
      kimiAdapter.extractUsage({
        usage: {
          inputTokens: 10,
          outputTokens: 20,
        },
        response: { modelId: "kimi-k2.6" },
      }),
    ).toEqual({
      tokensIn: 10,
      tokensOut: 20,
      modelEcho: "kimi-k2.6",
    });

    expect(
      kimiAdapter.extractUsage({
        usage: {
          prompt_tokens: 3,
          completion_tokens: 4,
        },
        model: "kimi-k2.5",
      }),
    ).toEqual({
      tokensIn: 3,
      tokensOut: 4,
      modelEcho: "kimi-k2.5",
    });
  });

  test("normalizes provider errors without leaking credentials", () => {
    const normalized = kimiAdapter.normalizeError({
      statusCode: 401,
      error: {
        code: "invalid_authentication",
        message: "Authorization: Bearer sk-secret-token failed",
      },
    });

    expect(normalized.code).toBe("unauthorized");
    expect(normalized.message).not.toContain("sk-secret-token");
    expect(normalized.message).toContain("[redacted]");
  });
});
