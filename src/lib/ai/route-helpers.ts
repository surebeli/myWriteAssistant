import { streamText } from "ai";

import type { AIAdapter, AIProviderConfig, AIProviderId, CoreMessage, NormalizedError } from "./types";

export type ErrorResponseProvider = AIProviderId | "unknown";

export function generateRequestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function sanitizeProviderError(
  error: NormalizedError,
  provider: ErrorResponseProvider,
  requestId: string,
) {
  return {
    code: error.code,
    provider,
    requestId,
    message: sanitizeErrorMessage(error.message),
  };
}

export function createProviderErrorResponse(
  error: NormalizedError,
  provider: ErrorResponseProvider,
  requestId: string,
  status = 502,
): Response {
  return Response.json(
    {
      error: sanitizeProviderError(error, provider, requestId),
    },
    { status },
  );
}

export function createMissingProviderConfigResponse(requestId: string): Response {
  return createProviderErrorResponse(
    {
      code: "missing_provider_config",
      message: "Provider configuration is required.",
    },
    "unknown",
    requestId,
    400,
  );
}

export function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
    .replace(/(api[_-]?key["']?\s*[:=]\s*["']?)[^"',\s}]+/gi, "$1[redacted]")
    .replace(/(authorization["']?\s*[:=]\s*["']?)(?!Bearer\s+\[redacted\])[^"',\s}]+/gi, "$1[redacted]");
}

export function logAIRequest(event: string, fields: Record<string, unknown> = {}): void {
  const sanitized = { ...fields };

  if ("providerConfig" in sanitized) {
    sanitized.providerConfig = "[redacted]";
  }

  console.info(`[ai] ${event}`, sanitized);
}

export async function callAdapter(
  adapter: AIAdapter,
  config: AIProviderConfig,
  system: string | undefined,
  messages: CoreMessage[],
) {
  const adjusted = adapter.prepareMessages(system, messages);

  return streamText({
    system: adjusted.system,
    messages: adjusted.messages,
    model: adapter.createModel(config),
  });
}
