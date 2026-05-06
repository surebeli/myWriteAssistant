import request from "supertest";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { createNextRouteServer } from "./helpers/next-route-server";
import { createMockAdapter, createMockTextStreamResult } from "./helpers/mock-provider";
import type { AIAdapter, AIProviderConfig, CoreMessage } from "../../../src/lib/ai/types";

const mockAdapter = createMockAdapter({ id: "kimi" });
const getAdapterMock = vi.fn<(providerId: AIAdapter["id"]) => AIAdapter>();
const callAdapterMock =
  vi.fn<
    (
      adapter: AIAdapter,
      config: AIProviderConfig,
      system: string | undefined,
      messages: CoreMessage[],
    ) => Promise<ReturnType<typeof createMockTextStreamResult>>
  >();

vi.mock("@/lib/ai/registry", () => ({
  getAdapter: getAdapterMock,
}));

vi.mock("@/lib/ai/route-helpers", async () => {
  const actual = await vi.importActual<typeof import("../../../src/lib/ai/route-helpers")>("@/lib/ai/route-helpers");

  return {
    ...actual,
    callAdapter: callAdapterMock,
  };
});

describe("POST /api/proactive", () => {
  beforeEach(() => {
    getAdapterMock.mockReset();
    callAdapterMock.mockReset();
    getAdapterMock.mockReturnValue(mockAdapter);
    callAdapterMock.mockResolvedValue(createMockTextStreamResult("rewritten sentence"));
  });

  test("calls the selected adapter from providerConfig", async () => {
    const { POST } = await import("../../../src/app/api/proactive/route");
    const server = createNextRouteServer(POST);

    const providerConfig: AIProviderConfig = {
      id: "kimi",
      apiKey: "sk-test",
      model: "kimi-model",
      baseURL: "https://kimi.example.test/v1",
    };

    const response = await request(server)
      .post("/api/proactive")
      .send({
        providerConfig,
        scenario: "proactive",
        requestId: "req-proactive-test",
        sentence: "这句话需要润色",
        context: "前文上下文",
      })
      .expect(200);

    expect(response.text).toBe("rewritten sentence");
    expect(getAdapterMock).toHaveBeenCalledWith("kimi");
    expect(callAdapterMock).toHaveBeenCalledTimes(1);
    expect(callAdapterMock.mock.calls[0][0]).toBe(mockAdapter);
    expect(callAdapterMock.mock.calls[0][1]).toEqual(providerConfig);
    expect(callAdapterMock.mock.calls[0][3]).toEqual([
      {
        role: "user",
        content: "以下是文章的上下文：\n\n前文上下文\n\n请根据上下文风格改写以下句子：\n\n\"这句话需要润色\"",
      },
    ]);
  });
});
