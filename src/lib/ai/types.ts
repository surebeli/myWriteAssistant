import type { LanguageModel, ModelMessage } from "ai";

export type CoreMessage = ModelMessage;

export type AIProviderId = "doubao" | "claude" | "openai" | "kimi" | "deepseek";

export type AIScenario = "chat" | "proactive";

export interface AIProviderConfig {
  id: AIProviderId;
  apiKey: string;
  baseURL?: string;
  model: string;
}

export interface AIAdapterCapabilities {
  supportsSystem: boolean;
  streamingMode: "sse" | "json-stream" | "none";
  defaultBaseURL: string;
  authStyle: "bearer" | "x-api-key" | "custom";
}

export interface NormalizedUsage {
  tokensIn: number | null;
  tokensOut: number | null;
  modelEcho?: string;
}

export interface NormalizedError {
  code: string;
  message: string;
}

export interface AdjustedRequest {
  system?: string;
  messages: CoreMessage[];
}

export interface AIAdapter {
  id: AIProviderId;
  name: string;
  defaultModels: string[];
  status: "stable";
  capabilities: AIAdapterCapabilities;
  createModel: (config: AIProviderConfig) => LanguageModel;
  prepareMessages: (system: string | undefined, messages: CoreMessage[]) => AdjustedRequest;
  extractUsage: (rawResponse: unknown) => NormalizedUsage;
  normalizeError: (err: unknown) => NormalizedError;
}

export interface AICallRecord {
  id: string;
  provider: AIProviderId;
  scenario: AIScenario;
  model: string;
  tokensIn: number | null;
  tokensOut: number | null;
  tokensUnknown: boolean;
  latencyMs: number;
  timestamp: number;
  requestId: string;
  status: "success" | "failure" | "cancelled";
  errorCode?: string;
  estimatedUsd?: number;
}

export interface AIScenarioProviderSettings {
  providerId: AIProviderId;
  modelOverride?: string;
  baseURLOverride?: string;
}

export interface AISettingsV2 {
  mode: "simple" | "advanced";
  simple: AIScenarioProviderSettings;
  perScenario: Partial<Record<AIScenario, AIScenarioProviderSettings>>;
}
