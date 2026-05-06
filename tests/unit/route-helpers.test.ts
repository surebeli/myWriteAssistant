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
});
