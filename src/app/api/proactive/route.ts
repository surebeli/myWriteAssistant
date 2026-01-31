import { streamText } from "ai";
import { createOpenAI } from "@ai-sdk/openai";

// 创建豆包 API 客户端（OpenAI 兼容格式）
const doubao = createOpenAI({
  apiKey: process.env.DOUBAO_API_KEY || "",
  baseURL: process.env.DOUBAO_API_BASE || "https://ark.cn-beijing.volces.com/api/v3",
});

const PROACTIVE_SYSTEM_PROMPT = `你是一个专业的写作润色助手。你的任务是改写用户当前正在写的句子，使其更加流畅、专业和富有表现力。

改写规则：
1. 保持原意不变，只优化表达方式
2. 保持与上下文风格一致
3. 不要添加新的信息或观点
4. 只返回改写后的句子，不需要解释
5. 如果句子已经很好，可以略作微调即可
6. 不要使用 Markdown 格式，直接返回纯文本

示例：
- 原句：AI技术正在快速发展，但很多人对它有误解。
- 改写：人工智能技术正以前所未有的速度演进，然而公众对其认知仍存在诸多误区。`;

interface ProactiveRequest {
  sentence: string;    // 当前句子
  context?: string;    // 前文上下文（前 N 个段落）
}

export async function POST(req: Request) {
  try {
    const { sentence, context }: ProactiveRequest = await req.json();

    if (!sentence?.trim()) {
      return new Response(
        JSON.stringify({ error: "Sentence is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // 构建提示词
    let userPrompt = `请改写以下句子：\n\n"${sentence}"`;
    
    if (context) {
      userPrompt = `以下是文章的上下文：\n\n${context}\n\n请根据上下文风格改写以下句子：\n\n"${sentence}"`;
    }

    const result = streamText({
      model: doubao(process.env.DOUBAO_MODEL || "doubao-1-5-pro-32k-250115"),
      messages: [
        { role: "system", content: PROACTIVE_SYSTEM_PROMPT },
        { role: "user", content: userPrompt },
      ],
    });

    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Proactive API error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process proactive request" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
