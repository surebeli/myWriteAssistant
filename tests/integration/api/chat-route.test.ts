import request from "supertest";
import { beforeEach, describe, expect, test, vi } from "vitest";

import { createNextRouteServer } from "./helpers/next-route-server";
import { createMockAdapter, createMockTextStreamResult } from "./helpers/mock-provider";
import type { AIAdapter, AIProviderConfig, CoreMessage } from "../../../src/lib/ai/types";

const mockAdapter = createMockAdapter({ id: "claude" });
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
      id: "claude",
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

    expect(response.text).toBe("0:\"mock response\"\n");
    expect(getAdapterMock).toHaveBeenCalledWith("claude");
    expect(callAdapterMock).toHaveBeenCalledTimes(1);
    expect(callAdapterMock.mock.calls[0][0]).toBe(mockAdapter);
    expect(callAdapterMock.mock.calls[0][1]).toEqual(providerConfig);
    expect(callAdapterMock.mock.calls[0][3]).toEqual(messages);
  });

  test("returns 400 when providerConfig is missing", async () => {
    const { POST } = await import("../../../src/app/api/chat/route");
    const server = createNextRouteServer(POST);

    const response = await request(server)
      .post("/api/chat")
      .send({
        scenario: "chat",
        requestId: "req-missing-config",
        messages: [{ role: "user", content: "hello" }],
      })
      .expect(400);

    expect(response.body).toEqual({
      error: {
        code: "missing_provider_config",
        provider: "unknown",
        requestId: "req-missing-config",
        message: "Provider configuration is required.",
      },
    });
    expect(callAdapterMock).not.toHaveBeenCalled();
  });

  test("sanitizes provider failures before returning error JSON", async () => {
    const { POST } = await import("../../../src/app/api/chat/route");
    const server = createNextRouteServer(POST);
    const providerConfig: AIProviderConfig = {
      id: "openai",
      apiKey: "sk-secret-token",
      model: "mock-model",
    };

    getAdapterMock.mockReturnValue(
      createMockAdapter({
        normalizeError: () => ({
          code: "unauthorized",
          message: "Authorization: Bearer sk-secret-token failed for apiKey=sk-secret-token",
        }),
      }),
    );
    callAdapterMock.mockRejectedValue(new Error("upstream failed"));

    const response = await request(server)
      .post("/api/chat")
      .send({
        providerConfig,
        scenario: "chat",
        requestId: "req-error",
        messages: [{ role: "user", content: "hello" }],
      })
      .expect(502);

    expect(JSON.stringify(response.body)).not.toContain("sk-secret-token");
    expect(response.body).toEqual({
      error: {
        code: "unauthorized",
        provider: "openai",
        requestId: "req-error",
        message: "Authorization: Bearer [redacted] failed for apiKey=[redacted]",
      },
    });
  });
});
