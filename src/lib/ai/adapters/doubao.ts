import { createOpenAI } from "@ai-sdk/openai";

import type { AIAdapter, AIProviderConfig, CoreMessage, NormalizedUsage } from "../types";

const DEFAULT_BASE_URL = "https://ark.cn-beijing.volces.com/api/v3";
const DEFAULT_MODEL = "doubao-1-5-pro-32k-250115";

export const doubaoAdapter: AIAdapter = {
  id: "doubao",
  name: "Doubao",
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

    return provider(config.model);
  },
  prepareMessages: (system: string | undefined, messages: CoreMessage[]) => ({ system, messages }),
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
    const upstreamError = asRecord(data?.error);
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
      message: redactSensitiveText(message),
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

function redactSensitiveText(message: string): string {
  return message
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
    .replace(/(api[_-]?key["']?\s*[:=]\s*["']?)[^"',\s}]+/gi, "$1[redacted]")
    .replace(/(authorization["']?\s*[:=]\s*["']?)(?!Bearer\s+\[redacted\])[^"',\s}]+/gi, "$1[redacted]");
}
