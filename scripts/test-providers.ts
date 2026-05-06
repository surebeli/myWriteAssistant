import { generateText } from "ai";
import { pathToFileURL } from "node:url";

import { listAdapters } from "../src/lib/ai/registry";
import type { AIAdapter, AIProviderConfig, AIProviderId } from "../src/lib/ai/types";

export const STABLE_PROVIDER_IDS: AIProviderId[] = ["doubao", "claude", "openai", "kimi", "deepseek"];

export type SmokeStatus = "passed" | "skipped" | "failed";

export interface SmokeResult {
  provider: AIProviderId;
  status: SmokeStatus;
  reason?: "missing_key" | "not_registered" | "empty_response" | "timeout" | "error";
  latencyMs?: number;
  message?: string;
}

export interface SmokeSummary {
  exitCode: 0 | 1;
  results: SmokeResult[];
}

export interface SmokeCliOptions {
  only?: AIProviderId;
  requireAllStable: boolean;
}

export interface SmokeRunOptions extends Partial<SmokeCliOptions> {
  adapters: AIAdapter[];
  env: Record<string, string | undefined>;
  timeoutMs?: number;
  sendPing?: SmokePingSender;
}

export interface SmokePingInput {
  adapter: AIAdapter;
  config: AIProviderConfig;
  prompt: string;
  timeoutMs: number;
}

export type SmokePingSender = (input: SmokePingInput) => Promise<string>;

export function getSmokeApiKeyName(providerId: AIProviderId): string {
  return `SMOKE_${providerId.toUpperCase()}_API_KEY`;
}

export function parseSmokeArgs(
  argv: string[],
  env: Record<string, string | undefined> = process.env,
): SmokeCliOptions {
  let only: AIProviderId | undefined;
  let requireAllStable = env.CI === "true" || env.CI === "1";

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--require-all-stable") {
      requireAllStable = true;
      continue;
    }

    if (arg === "--only") {
      const value = argv[index + 1];
      if (!isProviderId(value)) {
        throw new Error(`Invalid --only provider: ${value ?? ""}`);
      }
      only = value;
      index += 1;
      continue;
    }

    if (arg.startsWith("--only=")) {
      const value = arg.slice("--only=".length);
      if (!isProviderId(value)) {
        throw new Error(`Invalid --only provider: ${value}`);
      }
      only = value;
      continue;
    }

    throw new Error(`Unknown argument: ${arg}`);
  }

  return { only, requireAllStable };
}

export async function runProviderSmoke(options: SmokeRunOptions): Promise<SmokeSummary> {
  const timeoutMs = options.timeoutMs ?? 10_000;
  const sendPing = options.sendPing ?? sendPingWithAISdk;
  const adapterById = new Map(options.adapters.map((adapter) => [adapter.id, adapter]));
  const targets = options.only
    ? [options.only]
    : options.requireAllStable
      ? STABLE_PROVIDER_IDS
      : options.adapters.map((adapter) => adapter.id);

  const results: SmokeResult[] = [];

  for (const providerId of targets) {
    const adapter = adapterById.get(providerId);
    if (!adapter) {
      if (options.requireAllStable || options.only) {
        results.push({ provider: providerId, status: "failed", reason: "not_registered" });
      }
      continue;
    }

    const apiKey = options.env[getSmokeApiKeyName(providerId)];
    if (!apiKey) {
      results.push({
        provider: providerId,
        status: options.requireAllStable ? "failed" : "skipped",
        reason: "missing_key",
      });
      continue;
    }

    const config: AIProviderConfig = {
      id: providerId,
      apiKey,
      model: adapter.defaultModels[0],
      baseURL: adapter.capabilities.defaultBaseURL,
    };

    const startedAt = Date.now();

    try {
      const response = await withTimeout(
        sendPing({ adapter, config, prompt: "ping", timeoutMs }),
        timeoutMs,
      );
      const latencyMs = Date.now() - startedAt;

      if (!response.trim()) {
        results.push({ provider: providerId, status: "failed", reason: "empty_response", latencyMs });
        continue;
      }

      results.push({ provider: providerId, status: "passed", latencyMs });
    } catch (error) {
      const latencyMs = Date.now() - startedAt;
      results.push({
        provider: providerId,
        status: "failed",
        reason: latencyMs >= timeoutMs ? "timeout" : "error",
        latencyMs,
        message: error instanceof Error ? error.message : "Unknown provider smoke error",
      });
    }
  }

  const exitCode = results.some((result) => result.status === "failed") ? 1 : 0;
  return { exitCode, results };
}

export function formatSmokeSummary(summary: SmokeSummary): string {
  if (summary.results.length === 0) {
    return "No registered providers to smoke test.";
  }

  return summary.results
    .map((result) => {
      const suffix = result.reason ? ` (${result.reason})` : "";
      const latency = typeof result.latencyMs === "number" ? ` ${result.latencyMs}ms` : "";
      return `${result.status.toUpperCase()} ${result.provider}${suffix}${latency}`;
    })
    .join("\n");
}

async function sendPingWithAISdk({ adapter, config, prompt, timeoutMs }: SmokePingInput): Promise<string> {
  const result = await generateText({
    model: adapter.createModel(config),
    prompt,
    timeout: timeoutMs,
  });

  return result.text;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T> {
  let timeout: ReturnType<typeof setTimeout> | undefined;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeout = setTimeout(() => reject(new Error(`Provider smoke timed out after ${timeoutMs}ms`)), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout) {
      clearTimeout(timeout);
    }
  }
}

function isProviderId(value: string | undefined): value is AIProviderId {
  return STABLE_PROVIDER_IDS.includes(value as AIProviderId);
}

async function main() {
  const cli = parseSmokeArgs(process.argv.slice(2));
  const summary = await runProviderSmoke({
    adapters: listAdapters(),
    env: process.env,
    ...cli,
  });

  const output = formatSmokeSummary(summary);
  if (summary.exitCode === 0) {
    console.log(output);
  } else {
    console.error(output);
  }

  process.exitCode = summary.exitCode;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
