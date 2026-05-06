import type { LanguageModel, ModelMessage } from "ai";

/** Re-export of Vercel AI SDK's ModelMessage for internal use. */
export type CoreMessage = ModelMessage;

/** Supported AI provider identifiers. */
export type AIProviderId = "doubao" | "claude" | "openai" | "kimi" | "deepseek";

/** Scenarios where AI is used in the app. */
export type AIScenario = "chat" | "proactive";

/** Runtime configuration for a specific AI provider. */
export interface AIProviderConfig {
  id: AIProviderId;
  apiKey: string;
  baseURL?: string;
  model: string;
}

/** Capabilities and defaults advertised by an adapter. */
export interface AIAdapterCapabilities {
  supportsSystem: boolean;
  streamingMode: "sse" | "json-stream" | "none";
  defaultBaseURL: string;
  authStyle: "bearer" | "x-api-key" | "custom";
}

/** Normalized token usage returned by an adapter. */
export interface NormalizedUsage {
  tokensIn: number | null;
  tokensOut: number | null;
  modelEcho?: string;
}

/** Normalized error shape returned by an adapter. */
export interface NormalizedError {
  code: string;
  message: string;
}

/** Request payload after adapter-specific message adjustment. */
export interface AdjustedRequest {
  system?: string;
  messages: CoreMessage[];
}

/** Contract every AI provider adapter must implement. */
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

/** Record of a single AI call persisted for cost tracking. */
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

/** Per-scenario provider override used in advanced mode. */
export interface AIScenarioProviderSettings {
  providerId: AIProviderId;
  modelOverride?: string;
  baseURLOverride?: string;
}

/** v0.2 AI settings shape stored in the settings store. */
export interface AISettingsV2 {
  mode: "simple" | "advanced";
  simple: AIScenarioProviderSettings;
  perScenario: Partial<Record<AIScenario, AIScenarioProviderSettings>>;
}
