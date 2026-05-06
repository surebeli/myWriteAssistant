import { getAdapter } from "@/lib/ai/registry";
import { CHAT_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import {
  callAdapter,
  createMissingProviderConfigResponse,
  createProviderErrorResponse,
  generateRequestId,
  logAIRequest,
} from "@/lib/ai/route-helpers";
import type { AIProviderConfig, CoreMessage } from "@/lib/ai/types";

interface ChatRequest {
  messages: CoreMessage[];
  context?: string;  // 相关素材上下文
  providerConfig?: AIProviderConfig;
  requestId?: string;
}

export async function POST(req: Request) {
  let providerConfig: AIProviderConfig | undefined;
  let requestId = generateRequestId();
  let adapter: ReturnType<typeof getAdapter> | undefined;

  try {
    const body: ChatRequest = await req.json();
    const { messages, context } = body;
    providerConfig = body.providerConfig;
    requestId = body.requestId ?? requestId;

    if (!providerConfig) {
      return createMissingProviderConfigResponse(requestId);
    }

    // 构建系统提示词
    let systemPrompt = CHAT_SYSTEM_PROMPT;
    if (context) {
      systemPrompt += `\n\n以下是用户收藏的相关素材，请根据这些素材回答问题：\n\n${context}`;
    }

    adapter = getAdapter(providerConfig.id);
    const result = await callAdapter(adapter, providerConfig, systemPrompt, messages);

    return result.toTextStreamResponse();
  } catch (error) {
    const provider = providerConfig?.id ?? "unknown";
    const normalized = adapter?.normalizeError(error) ?? {
      code: "route_error",
      message: error instanceof Error ? error.message : "Failed to process chat request.",
    };

    logAIRequest("chat.error", {
      provider,
      requestId,
      code: normalized.code,
    });

    return createProviderErrorResponse(normalized, provider, requestId);
  }
}
