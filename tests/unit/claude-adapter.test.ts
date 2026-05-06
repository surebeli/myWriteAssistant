import { describe, expect, test } from "vitest";

import { claudeAdapter } from "../../src/lib/ai/adapters/claude";
import { doubaoAdapter } from "../../src/lib/ai/adapters/doubao";
import { getAdapter, listAdapters } from "../../src/lib/ai/registry";
import type { CoreMessage } from "../../src/lib/ai/types";

describe("claude adapter", () => {
  test("is registered as a stable Anthropic provider", () => {
    expect(listAdapters().map((adapter) => adapter.id)).toContain("claude");
    expect(getAdapter("claude")).toBe(claudeAdapter);
    expect(claudeAdapter.capabilities).toMatchObject({
      supportsSystem: true,
      streamingMode: "sse",
      defaultBaseURL: "https://api.anthropic.com/v1",
      authStyle: "x-api-key",
    });
    expect(claudeAdapter.defaultModels[0]).toBe("claude-sonnet-4-20250514");
  });

  test("keeps Anthropic system prompts separate from messages", () => {
    const messages: CoreMessage[] = [{ role: "user", content: "hello" }];

    expect(claudeAdapter.prepareMessages("system prompt", messages)).toEqual({
      system: "system prompt",
      messages,
    });
  });

  test("differs from the OpenAI-compatible system-message path", () => {
    const messages: CoreMessage[] = [{ role: "user", content: "hello" }];

    expect(doubaoAdapter.prepareMessages("system prompt", messages)).toEqual({
      system: undefined,
      messages: [{ role: "system", content: "system prompt" }, ...messages],
    });
    expect(claudeAdapter.prepareMessages("system prompt", messages)).toEqual({
      system: "system prompt",
      messages,
    });
  });

  test("extracts usage from AI SDK and Anthropic raw usage shapes", () => {
    expect(
      claudeAdapter.extractUsage({
        usage: {
          inputTokens: 12,
          outputTokens: 34,
        },
        response: { modelId: "claude-test" },
      }),
    ).toEqual({
      tokensIn: 12,
      tokensOut: 34,
      modelEcho: "claude-test",
    });

    expect(
      claudeAdapter.extractUsage({
        usage: {
          input_tokens: 3,
          output_tokens: 4,
        },
        model: "claude-raw",
      }),
    ).toEqual({
      tokensIn: 3,
      tokensOut: 4,
      modelEcho: "claude-raw",
    });
  });

  test("normalizes Anthropic errors without leaking credentials", () => {
    const normalized = claudeAdapter.normalizeError({
      statusCode: 401,
      data: {
        error: {
          type: "authentication_error",
          message: "x-api-key: sk-ant-secret-token is invalid",
        },
      },
    });

    expect(normalized.code).toBe("unauthorized");
    expect(normalized.message).not.toContain("sk-ant-secret-token");
    expect(normalized.message).toContain("[redacted]");
  });
});
