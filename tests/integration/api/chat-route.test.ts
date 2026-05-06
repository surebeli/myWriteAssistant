import request from "supertest";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { createNextRouteServer } from "./helpers/next-route-server";
import { createMockAdapter, createMockTextStreamResult } from "./helpers/mock-provider";
import type { AIAdapter, AIProviderConfig, CoreMessage } from "../../../src/lib/ai/types";

const mockAdapter = createMockAdapter();
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

describe("POST /api/chat", () => {
  beforeEach(() => {
    getAdapterMock.mockReset();
    callAdapterMock.mockReset();
    getAdapterMock.mockReturnValue(mockAdapter);
    callAdapterMock.mockResolvedValue(createMockTextStreamResult());
  });

  test("calls the selected adapter from providerConfig without reaching upstream", async () => {
    const { POST } = await import("../../../src/app/api/chat/route");
    const server = createNextRouteServer(POST);

    const providerConfig: AIProviderConfig = {
      id: "openai",
      apiKey: "sk-test",
      model: "mock-model",
      baseURL: "https://mock-provider.example.test/v1",
    };
    const messages: CoreMessage[] = [{ role: "user", content: "hello" }];

    const response = await request(server)
      .post("/api/chat")
      .send({
        providerConfig,
        scenario: "chat",
        requestId: "req-test",
        messages,
      })
      .expect(200);

    expect(response.text).toBe("mock response");
    expect(getAdapterMock).toHaveBeenCalledWith("openai");
    expect(callAdapterMock).toHaveBeenCalledTimes(1);
    expect(callAdapterMock.mock.calls[0][0]).toBe(mockAdapter);
    expect(callAdapterMock.mock.calls[0][1]).toEqual(providerConfig);
    expect(callAdapterMock.mock.calls[0][3]).toEqual(messages);
  });
});
