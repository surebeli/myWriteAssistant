import { createOpenAI } from "@ai-sdk/openai";

import { sanitizeErrorMessage } from "../route-helpers";
import type { AIAdapter, AIProviderConfig, CoreMessage, NormalizedUsage } from "../types";

const DEFAULT_BASE_URL = "https://api.moonshot.ai/v1";
const DEFAULT_MODEL = "kimi-k2.6";

export const kimiAdapter: AIAdapter = {
  id: "kimi",
  name: "Kimi",
  defaultModels: [DEFAULT_MODEL],
  status: "stable",
  capabilities: {
    supportsSystem: true,
    streamingMode: "sse",
    defaultBaseURL: DEFAULT_BASE_URL,
    authStyle: "bearer",
  },
  createModel: (config: AIProviderConfig) => {
    const provider = createOpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL ?? DEFAULT_BASE_URL,
    });

    return provider.chat(config.model);
  },
  prepareMessages: (system: string | undefined, messages: CoreMessage[]) => ({
    system: undefined,
    messages: system ? [{ role: "system", content: system }, ...messages] : messages,
  }),
  extractUsage: (rawResponse: unknown): NormalizedUsage => {
    const raw = asRecord(rawResponse) ?? {};
    const usage = asRecord(raw.usage) ?? asRecord(raw.totalUsage) ?? raw;

    return {
      tokensIn: readNumber(usage, ["inputTokens", "promptTokens", "prompt_tokens"]),
      tokensOut: readNumber(usage, ["outputTokens", "completionTokens", "completion_tokens"]),
      modelEcho: readString(raw, ["model", "modelId"]) ?? readString(asRecord(raw.response), ["model", "modelId"]),
    };
  },
  normalizeError: (err: unknown) => {
    const error = asRecord(err) ?? {};
    const statusCode = readNumber(error, ["statusCode", "status"]);
    const data = asRecord(error.data);
    const upstreamError = asRecord(data?.error) ?? asRecord(error.error);
    const code =
      statusCode === 401 || statusCode === 403
        ? "unauthorized"
        : readString(error, ["code"]) ??
          readString(upstreamError, ["code", "type"]) ??
          "provider_error";
    const message =
      readString(error, ["message"]) ??
      readString(upstreamError, ["message"]) ??
      "Provider request failed.";

    return {
      code,
      message: sanitizeErrorMessage(message),
    };
  },
};

function asRecord(value: unknown): Record<string, unknown> | undefined {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : undefined;
}

function readNumber(record: Record<string, unknown> | undefined, keys: string[]): number | null {
  if (!record) {
    return null;
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }
  }

  return null;
}

function readString(record: Record<string, unknown> | undefined, keys: string[]): string | undefined {
  if (!record) {
    return undefined;
  }

  for (const key of keys) {
    const value = record[key];
    if (typeof value === "string" && value.trim()) {
      return value;
    }
  }

  return undefined;
}
