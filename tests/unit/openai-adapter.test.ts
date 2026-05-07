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

import { openaiAdapter } from "../../src/lib/ai/adapters/openai";
import { getAdapter, listAdapters } from "../../src/lib/ai/registry";
import type { CoreMessage } from "../../src/lib/ai/types";

describe("openai adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("is registered as a stable OpenAI provider", () => {
    expect(listAdapters().map((adapter) => adapter.id)).toContain("openai");
    expect(getAdapter("openai")).toBe(openaiAdapter);
    expect(openaiAdapter.capabilities).toMatchObject({
      supportsSystem: true,
      streamingMode: "sse",
      defaultBaseURL: "https://api.openai.com/v1",
      authStyle: "bearer",
    });
  });

  test("creates a chat-completions model instead of the default Responses API route", () => {
    const model = openaiAdapter.createModel({
      id: "openai",
      apiKey: "sk-test",
      model: "gpt-4o",
      baseURL: "https://openai-proxy.example.test/v1",
    });

    expect(createOpenAIMock).toHaveBeenCalledWith({
      apiKey: "sk-test",
      baseURL: "https://openai-proxy.example.test/v1",
    });
    expect(chatModelMock).toHaveBeenCalledWith("gpt-4o");
    expect(defaultModelMock).not.toHaveBeenCalled();
    expect(model).toEqual({ route: "chat-completions" });
  });

  test("moves system prompts into messages for OpenAI-compatible dispatch", () => {
    const messages: CoreMessage[] = [{ role: "user", content: "hello" }];

    expect(openaiAdapter.prepareMessages("system prompt", messages)).toEqual({
      system: undefined,
      messages: [{ role: "system", content: "system prompt" }, ...messages],
    });
  });

  test("extracts usage from AI SDK and raw OpenAI-compatible shapes", () => {
    expect(
      openaiAdapter.extractUsage({
        usage: {
          inputTokens: 10,
          outputTokens: 20,
        },
        response: { modelId: "gpt-4o" },
      }),
    ).toEqual({
      tokensIn: 10,
      tokensOut: 20,
      modelEcho: "gpt-4o",
    });

    expect(
      openaiAdapter.extractUsage({
        usage: {
          prompt_tokens: 3,
          completion_tokens: 4,
        },
        model: "gpt-4o-mini",
      }),
    ).toEqual({
      tokensIn: 3,
      tokensOut: 4,
      modelEcho: "gpt-4o-mini",
    });
  });

  test("normalizes provider errors without leaking credentials", () => {
    const normalized = openaiAdapter.normalizeError({
      statusCode: 401,
      message: "Incorrect API key provided: sk-secret-token",
    });

    expect(normalized.code).toBe("unauthorized");
    expect(normalized.message).toBe("Incorrect API key provided: [redacted]");
  });
});
