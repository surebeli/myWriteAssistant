import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { getAdapter } from "@/lib/ai/registry";
import { callAdapter } from "@/lib/ai/route-helpers";
import type { AIProviderConfig, CoreMessage } from "@/lib/ai/types";

// 创建豆包 API 客户端（OpenAI 兼容格式）
const doubao = createOpenAI({
  apiKey: process.env.DOUBAO_API_KEY || "",
  baseURL: process.env.DOUBAO_API_BASE || "https://ark.cn-beijing.volces.com/api/v3",
});

const SYSTEM_PROMPT = `你是一个专业的写作助手，帮助用户进行写作、整理思路和优化文章。

你的能力包括：
1. 根据用户提供的素材回答问题
2. 生成文章大纲
3. 润色和改写文本
4. 提供写作建议
5. 总结和提炼关键信息

回答要求：
- 使用 Markdown 格式输出
- 保持简洁清晰
- 提供具体可操作的建议
- 如果涉及引用素材，请明确标注来源`;

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

interface ChatRequest {
  messages: CoreMessage[];
  context?: string;  // 相关素材上下文
  providerConfig?: AIProviderConfig;
  requestId?: string;
}

export async function POST(req: Request) {
  try {
    const { messages, context, providerConfig }: ChatRequest = await req.json();

    // 构建系统提示词
    let systemPrompt = SYSTEM_PROMPT;
    if (context) {
      systemPrompt += `\n\n以下是用户收藏的相关素材，请根据这些素材回答问题：\n\n${context}`;
    }

    if (providerConfig) {
      const adapter = getAdapter(providerConfig.id);
      const result = await callAdapter(adapter, providerConfig, systemPrompt, messages);

      return result.toTextStreamResponse();
    }

    const result = streamText({
      model: doubao(process.env.DOUBAO_MODEL || "doubao-1-5-pro-32k-250115"),
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Chat API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
