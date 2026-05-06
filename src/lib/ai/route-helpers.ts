import { streamText } from "ai";

import type { AIAdapter, AIProviderConfig, AIProviderId, CoreMessage, NormalizedError } from "./types";

/** Provider identifier used in error responses, or "unknown" when not resolved. */
export type ErrorResponseProvider = AIProviderId | "unknown";

/** Generate a unique request ID for tracing a single AI call. */
export function generateRequestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/**
 * Build a sanitized error object safe to return to the client.
 * @param error - Normalized error from the adapter.
 * @param provider - Provider that produced the error.
 * @param requestId - Request ID for correlation.
 */
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

/**
 * Create a JSON Response for a provider error.
 * @param error - Normalized error from the adapter.
 * @param provider - Provider that produced the error.
 * @param requestId - Request ID for correlation.
 * @param status - HTTP status code (default 502).
 * @returns A JSON Response with sanitized error payload.
 */
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

/**
 * Return a 400 Response when provider configuration is missing.
 * @param requestId - Request ID for correlation.
 */
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

/** Strip sensitive tokens (Bearer, API keys, Authorization) from an error message. */
export function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
    .replace(/(api[_-]?key["']?\s*[:=]\s*["']?)[^"',\s}]+/gi, "$1[redacted]")
    .replace(/(authorization["']?\s*[:=]\s*["']?)(?!Bearer\s+\[redacted\])[^"',\s}]+/gi, "$1[redacted]");
}

/**
 * Log an AI request event with redacted provider config.
 * @param event - Event name / identifier.
 * @param fields - Additional key-value fields to log.
 */
export function logAIRequest(event: string, fields: Record<string, unknown> = {}): void {
  const sanitized = { ...fields };

  if ("providerConfig" in sanitized) {
    sanitized.providerConfig = "[redacted]";
  }

  console.info(`[ai] ${event}`, sanitized);
}

/**
 * Execute the adapter's stream via the Vercel AI SDK.
 * @param adapter - The provider adapter to use.
 * @param config - Resolved provider configuration.
 * @param system - Optional system prompt.
 * @param messages - Conversation messages.
 * @returns A streamText result.
 */
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
