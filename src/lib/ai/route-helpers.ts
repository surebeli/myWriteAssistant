import { streamText } from "ai";

import type { AIAdapter, AIProviderConfig, AIProviderId, CoreMessage, NormalizedError } from "./types";

export function generateRequestId(): string {
  return globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function sanitizeProviderError(
  error: NormalizedError,
  provider: AIProviderId,
  requestId: string,
) {
  return {
    code: error.code,
    provider,
    requestId,
    message: sanitizeErrorMessage(error.message),
  };
}

export function sanitizeErrorMessage(message: string): string {
  return message
    .replace(/Bearer\s+[A-Za-z0-9._~+/=-]+/gi, "Bearer [redacted]")
    .replace(/(api[_-]?key["']?\s*[:=]\s*["']?)[^"',\s}]+/gi, "$1[redacted]")
    .replace(/(authorization["']?\s*[:=]\s*["']?)[^"',\s}]+/gi, "$1[redacted]");
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
