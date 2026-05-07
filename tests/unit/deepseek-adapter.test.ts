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

import { deepseekAdapter } from "../../src/lib/ai/adapters/deepseek";
import { getAdapter, listAdapters } from "../../src/lib/ai/registry";
import type { CoreMessage } from "../../src/lib/ai/types";

describe("deepseek adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("is registered as a stable DeepSeek provider", () => {
    expect(listAdapters().map((adapter) => adapter.id)).toContain("deepseek");
    expect(getAdapter("deepseek")).toBe(deepseekAdapter);
    expect(deepseekAdapter.capabilities).toMatchObject({
      supportsSystem: true,
      streamingMode: "sse",
      defaultBaseURL: "https://api.deepseek.com/v1",
      authStyle: "bearer",
    });
  });

  test("creates a chat-completions model via OpenAI-compatible SDK", () => {
    const model = deepseekAdapter.createModel({
      id: "deepseek",
      apiKey: "sk-test",
      model: "deepseek-chat",
      baseURL: "https://deepseek-proxy.example.test/v1",
    });

    expect(createOpenAIMock).toHaveBeenCalledWith({
      apiKey: "sk-test",
      baseURL: "https://deepseek-proxy.example.test/v1",
    });
    expect(chatModelMock).toHaveBeenCalledWith("deepseek-chat");
    expect(defaultModelMock).not.toHaveBeenCalled();
    expect(model).toEqual({ route: "chat-completions" });
  });

  test("moves system prompts into messages for OpenAI-compatible dispatch", () => {
    const messages: CoreMessage[] = [{ role: "user", content: "hello" }];

    expect(deepseekAdapter.prepareMessages("system prompt", messages)).toEqual({
      system: undefined,
      messages: [{ role: "system", content: "system prompt" }, ...messages],
    });
  });

  test("extracts usage from AI SDK and raw DeepSeek-compatible shapes", () => {
    expect(
      deepseekAdapter.extractUsage({
        usage: {
          inputTokens: 10,
          outputTokens: 20,
        },
        response: { modelId: "deepseek-chat" },
      }),
    ).toEqual({
      tokensIn: 10,
      tokensOut: 20,
      modelEcho: "deepseek-chat",
    });

    expect(
      deepseekAdapter.extractUsage({
        usage: {
          prompt_tokens: 3,
          completion_tokens: 4,
        },
        model: "deepseek-reasoner",
      }),
    ).toEqual({
      tokensIn: 3,
      tokensOut: 4,
      modelEcho: "deepseek-reasoner",
    });
  });

  test("normalizes provider errors without leaking credentials", () => {
    const normalized = deepseekAdapter.normalizeError({
      statusCode: 401,
      message: "Incorrect API key provided: sk-secret-token",
    });

    expect(normalized.code).toBe("unauthorized");
    expect(normalized.message).toBe("Incorrect API key provided: [redacted]");
  });
});
