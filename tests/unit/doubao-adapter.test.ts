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

import { doubaoAdapter } from "../../src/lib/ai/adapters/doubao";
import { getAdapter, listAdapters } from "../../src/lib/ai/registry";
import type { CoreMessage } from "../../src/lib/ai/types";

describe("doubao adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("is registered as a stable OpenAI-compatible provider", () => {
    expect(listAdapters().map((adapter) => adapter.id)).toContain("doubao");
    expect(getAdapter("doubao")).toBe(doubaoAdapter);
    expect(doubaoAdapter.capabilities).toMatchObject({
      supportsSystem: true,
      streamingMode: "sse",
      defaultBaseURL: "https://ark.cn-beijing.volces.com/api/v3",
      authStyle: "bearer",
    });
  });

  test("creates a chat-completions model instead of the default Responses API route", () => {
    const model = doubaoAdapter.createModel({
      id: "doubao",
      apiKey: "sk-test",
      model: "doubao-test-model",
      baseURL: "https://doubao-proxy.example.test/v1",
    });

    expect(createOpenAIMock).toHaveBeenCalledWith({
      apiKey: "sk-test",
      baseURL: "https://doubao-proxy.example.test/v1",
    });
    expect(chatModelMock).toHaveBeenCalledWith("doubao-test-model");
    expect(defaultModelMock).not.toHaveBeenCalled();
    expect(model).toEqual({ route: "chat-completions" });
  });

  test("moves system prompts into messages for OpenAI-compatible dispatch", () => {
    const messages: CoreMessage[] = [{ role: "user", content: "hello" }];

    expect(doubaoAdapter.prepareMessages("system prompt", messages)).toEqual({
      system: undefined,
      messages: [{ role: "system", content: "system prompt" }, ...messages],
    });
  });

  test("extracts usage from common AI SDK and upstream shapes", () => {
    expect(
      doubaoAdapter.extractUsage({
        usage: {
          inputTokens: 10,
          outputTokens: 20,
        },
        response: { modelId: "doubao-test" },
      }),
    ).toEqual({
      tokensIn: 10,
      tokensOut: 20,
      modelEcho: "doubao-test",
    });

    expect(
      doubaoAdapter.extractUsage({
        prompt_tokens: 3,
        completion_tokens: 4,
        model: "doubao-raw",
      }),
    ).toEqual({
      tokensIn: 3,
      tokensOut: 4,
      modelEcho: "doubao-raw",
    });
  });

  test("normalizes provider errors without leaking credentials", () => {
    const normalized = doubaoAdapter.normalizeError({
      statusCode: 401,
      message: "Authorization: Bearer sk-secret-token failed",
    });

    expect(normalized.code).toBe("unauthorized");
    expect(normalized.message).not.toContain("sk-secret-token");
    expect(normalized.message).toContain("[redacted]");
  });
});
