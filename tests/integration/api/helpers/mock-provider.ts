import type { AIAdapter } from "../../../../src/lib/ai/types";

const fakeModel = {} as ReturnType<AIAdapter["createModel"]>;

export function createMockAdapter(overrides: Partial<AIAdapter> = {}): AIAdapter {
  return {
    id: "openai",
    name: "Mock Provider",
    defaultModels: ["mock-model"],
    status: "stable",
    capabilities: {
      supportsSystem: true,
      streamingMode: "sse",
      defaultBaseURL: "https://mock-provider.example.test/v1",
      authStyle: "bearer",
    },
    createModel: () => fakeModel,
    prepareMessages: (system, messages) => ({ system, messages }),
    extractUsage: () => ({ tokensIn: null, tokensOut: null }),
    normalizeError: () => ({ code: "unknown", message: "safe mock error" }),
    ...overrides,
  };
}

export function createMockTextStreamResult(text = "mock response") {
  return {
    fullStream: (async function* () {
      yield {
        type: "text-delta",
        text,
      };
    })(),
    toTextStreamResponse: () =>
      new Response(text, {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8" },
      }),
    toDataStreamResponse: () =>
      new Response(`0:${JSON.stringify(text)}\n`, {
        status: 200,
        headers: { "content-type": "text/plain; charset=utf-8" },
      }),
  };
}
