import { getAdapter } from "@/lib/ai/registry";
import { PROACTIVE_SYSTEM_PROMPT } from "@/lib/ai/prompts";
import {
  callAdapter,
  createMissingProviderConfigResponse,
  createProviderErrorResponse,
  generateRequestId,
  logAIRequest,
} from "@/lib/ai/route-helpers";
import type { AIProviderConfig, CoreMessage } from "@/lib/ai/types";

interface ProactiveRequest {
  sentence: string;    // 当前句子
  context?: string;    // 前文上下文（前 N 个段落）
  providerConfig?: AIProviderConfig;
  requestId?: string;
}

export async function POST(req: Request) {
  let providerConfig: AIProviderConfig | undefined;
  let requestId = generateRequestId();
  let adapter: ReturnType<typeof getAdapter> | undefined;

  try {
    const body: ProactiveRequest = await req.json();
    const { sentence, context } = body;
    providerConfig = body.providerConfig;
    requestId = body.requestId ?? requestId;

    if (!providerConfig) {
      return createMissingProviderConfigResponse(requestId);
    }

    if (!sentence?.trim()) {
      return Response.json({ error: "Sentence is required" }, { status: 400 });
    }

    // 构建提示词
    let userPrompt = `请改写以下句子：\n\n"${sentence}"`;
    
    if (context) {
      userPrompt = `以下是文章的上下文：\n\n${context}\n\n请根据上下文风格改写以下句子：\n\n"${sentence}"`;
    }

    adapter = getAdapter(providerConfig.id);
    const messages: CoreMessage[] = [{ role: "user", content: userPrompt }];
    const result = await callAdapter(adapter, providerConfig, PROACTIVE_SYSTEM_PROMPT, messages);

    return result.toTextStreamResponse();
  } catch (error) {
    const provider = providerConfig?.id ?? "unknown";
    const normalized = adapter?.normalizeError(error) ?? {
      code: "route_error",
      message: error instanceof Error ? error.message : "Failed to process proactive request.",
    };

    logAIRequest("proactive.error", {
      provider,
      requestId,
      code: normalized.code,
    });

    return createProviderErrorResponse(normalized, provider, requestId);
  }
}
