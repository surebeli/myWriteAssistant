import React from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { parseHTML } from "linkedom";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { useChat } from "../../../src/hooks/use-chat";
import { useProactive } from "../../../src/hooks/use-proactive";
import type { AIProviderConfig } from "../../../src/lib/ai/types";
import { useAIStore } from "../../../src/stores/ai-store";

const { resolveProviderConfigMock, generateRequestIdMock } = vi.hoisted(() => ({
  resolveProviderConfigMock: vi.fn(),
  generateRequestIdMock: vi.fn(),
}));

vi.mock("@/lib/ai/request-assembly", () => ({
  resolveProviderConfig: resolveProviderConfigMock,
  generateRequestId: generateRequestIdMock,
}));

vi.mock("@/lib/material-matcher", () => ({
  shouldMatchMaterials: vi.fn(() => false),
  smartMatchMaterials: vi.fn(),
}));

const providerConfig: AIProviderConfig = {
  id: "doubao",
  apiKey: "sk-test",
  model: "doubao-test-model",
  baseURL: "https://doubao.example.test/v1",
};

function resetAIStore() {
  useAIStore.setState({
    mode: "chat",
    proactive: {
      currentSentence: "",
      suggestion: null,
      isGenerating: false,
    },
    chat: {
      messages: [],
      isStreaming: false,
      streamingContent: "",
    },
  });
}

function installDom() {
  const { document, window } = parseHTML("<!doctype html><html><body><div id=\"root\"></div></body></html>");

  Object.defineProperty(globalThis, "window", { value: window, configurable: true });
  Object.defineProperty(globalThis, "document", { value: document, configurable: true });
  Object.defineProperty(globalThis, "HTMLElement", { value: window.HTMLElement, configurable: true });
  Object.defineProperty(globalThis, "navigator", { value: window.navigator, configurable: true });
  Object.defineProperty(globalThis, "IS_REACT_ACT_ENVIRONMENT", { value: true, configurable: true });

  return document.getElementById("root") as HTMLElement;
}

function createStreamResponse(text: string) {
  return new Response(`0:${JSON.stringify(text)}\n`, {
    status: 200,
    headers: { "content-type": "text/plain; charset=utf-8" },
  });
}

function parseFetchBody(fetchMock: ReturnType<typeof vi.fn<typeof fetch>>) {
  const init = fetchMock.mock.calls[0][1] as RequestInit;
  return JSON.parse(String(init.body));
}

async function waitForFetch(fetchMock: ReturnType<typeof vi.fn<typeof fetch>>) {
  for (let i = 0; i < 20; i += 1) {
    if (fetchMock.mock.calls.length > 0) {
      return;
    }

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });
  }

  throw new Error("Timed out waiting for fetch call");
}

describe("AI hook request bodies", () => {
  let root: Root | null = null;
  let fetchMock: ReturnType<typeof vi.fn<typeof fetch>>;

  beforeEach(() => {
    resetAIStore();
    vi.clearAllMocks();
    resolveProviderConfigMock.mockResolvedValue(providerConfig);
    fetchMock = vi.fn<typeof fetch>();
    fetchMock.mockResolvedValue(createStreamResponse("ok"));
    Object.defineProperty(globalThis, "fetch", { value: fetchMock, configurable: true });
  });

  afterEach(() => {
    if (root) {
      act(() => {
        root?.unmount();
      });
      root = null;
    }
  });

  test("useChat posts resolved providerConfig, requestId, scenario, and messages", async () => {
    const hookRef: { current?: ReturnType<typeof useChat> } = {};

    function Probe() {
      const hook = useChat({ enableMaterialMatching: false });

      React.useEffect(() => {
        hookRef.current = hook;
      }, [hook]);

      return null;
    }

    root = createRoot(installDom());
    await act(async () => {
      root?.render(<Probe />);
    });

    generateRequestIdMock.mockReturnValue("req-chat-test");

    await act(async () => {
      await hookRef.current?.sendMessage("hello", "matched context");
    });

    expect(resolveProviderConfigMock).toHaveBeenCalledWith("chat");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/chat",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: expect.any(AbortSignal),
      }),
    );
    expect(parseFetchBody(fetchMock)).toEqual({
      providerConfig,
      requestId: "req-chat-test",
      scenario: "chat",
      messages: [{ role: "user", content: "hello" }],
      context: "matched context",
    });
  });

  test("useProactive posts resolved providerConfig, requestId, scenario, sentence, and context", async () => {
    const hookRef: { current?: ReturnType<typeof useProactive> } = {};

    function Probe() {
      const hook = useProactive({ debounceMs: 0 });

      React.useEffect(() => {
        hookRef.current = hook;
      }, [hook]);

      return null;
    }

    root = createRoot(installDom());
    await act(async () => {
      root?.render(<Probe />);
    });

    generateRequestIdMock.mockReturnValue("req-proactive-test");

    await act(async () => {
      hookRef.current?.updateSentence("这句话需要润色", "前文上下文");
    });
    await waitForFetch(fetchMock);

    expect(resolveProviderConfigMock).toHaveBeenCalledWith("proactive");
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/proactive",
      expect.objectContaining({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: expect.any(AbortSignal),
      }),
    );
    expect(parseFetchBody(fetchMock)).toEqual({
      providerConfig,
      requestId: "req-proactive-test",
      scenario: "proactive",
      sentence: "这句话需要润色",
      context: "前文上下文",
    });
  });
});
