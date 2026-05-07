import { beforeEach, describe, expect, test, vi } from "vitest";

import { createMockAdapter } from "../integration/api/helpers/mock-provider";
import type { AIProviderConfig, CoreMessage } from "../../src/lib/ai/types";

const streamTextMock = vi.fn();

vi.mock("ai", () => ({
  streamText: streamTextMock,
}));

describe("route helpers", () => {
  beforeEach(() => {
    streamTextMock.mockReset();
    streamTextMock.mockReturnValue({ toTextStreamResponse: () => new Response("ok") });
  });

  test("callAdapter routes through adapter.prepareMessages before streamText", async () => {
    const { callAdapter } = await import("../../src/lib/ai/route-helpers");
    const messages: CoreMessage[] = [{ role: "user", content: "hello" }];
    const adjustedMessages: CoreMessage[] = [
      { role: "user", content: "system prompt\n\nhello" },
    ];
    const adapter = createMockAdapter({
      prepareMessages: vi.fn(() => ({ system: undefined, messages: adjustedMessages })),
    });
    const config: AIProviderConfig = {
      id: "openai",
      apiKey: "sk-test",
      model: "mock-model",
    };

    await callAdapter(adapter, config, "system prompt", messages);

    expect(adapter.prepareMessages).toHaveBeenCalledWith("system prompt", messages);
    expect(streamTextMock).toHaveBeenCalledWith({
      system: undefined,
      messages: adjustedMessages,
      model: adapter.createModel(config),
    });
  });

  test("sanitizeErrorMessage redacts header and label-based API credentials", async () => {
    const { sanitizeErrorMessage } = await import("../../src/lib/ai/route-helpers");

    const cases = [
      ["Bearer sk-secret-token", "Bearer [redacted]"],
      ["api_key=sk-secret-token", "api_key=[redacted]"],
      ["api-key: sk-secret-token", "api-key: [redacted]"],
      ["x-api-key: sk-secret-token", "x-api-key: [redacted]"],
      ["x-api-key sk-secret-token", "x-api-key [redacted]"],
      ["Authorization: sk-secret-token", "Authorization: [redacted]"],
      ["Authorization sk-secret-token", "Authorization [redacted]"],
      ["API key provided: sk-secret-token", "API key provided: [redacted]"],
      ["API key sk-secret-token", "API key [redacted]"],
      ["api key: sk-secret-token", "api key: [redacted]"],
    ] as const;

    for (const [input, expected] of cases) {
      expect(sanitizeErrorMessage(input)).toBe(expected);
    }
  });

  test("sanitizeErrorMessage redacts bare OpenAI and Anthropic-style API keys", async () => {
    const { sanitizeErrorMessage } = await import("../../src/lib/ai/route-helpers");

    expect(sanitizeErrorMessage("Incorrect API key provided: sk-secret-token")).toBe(
      "Incorrect API key provided: [redacted]",
    );
    expect(sanitizeErrorMessage("Unexpected token sk-1234567890abcdefghijklmnopqrstuvwxyz")).toBe(
      "Unexpected token [redacted]",
    );
    expect(
      sanitizeErrorMessage(
        "Anthropic rejected sk-ant-api03-1234567890abcdefghijklmnopqrstuvwxyzABCDEFGHIJKL",
      ),
    ).toBe("Anthropic rejected [redacted]");
  });
});
