# Phase 4 实施计划：AI 写作助手 - Chat 模式

> 📅 创建时间：2026-01-31
> 🎯 目标：实现对话式 AI 交互功能

---

## 目标概述

实现 AI Chat 模式，支持与收藏素材对话、生成大纲、素材推荐等功能。

---

## 任务清单

### Task 1: 安装 AI 相关依赖
- 安装 `ai` (Vercel AI SDK) 用于流式输出
- 安装 `openai` SDK（豆包 API 兼容 OpenAI 格式）

### Task 2: 配置 AI API 路由
- 创建 `src/app/api/chat/route.ts` - Chat API 路由
- 使用 Vercel AI SDK 实现流式输出
- 支持豆包 API / OpenAI 兼容端点

### Task 3: 创建 AI Store
- 创建 `src/stores/ai-store.ts` - AI 助手状态管理
- 状态：mode (proactive/chat), messages, isStreaming
- Chat 历史消息管理

### Task 4: 创建 Chat Hook
- 创建 `src/hooks/use-chat.ts` - Chat 交互 Hook
- 发送消息、流式接收响应
- 素材匹配集成（基于摘要搜索）

### Task 5: 创建 Chat UI 组件
- 创建 `src/components/ai/chat-panel.tsx` - Chat 面板
- 创建 `src/components/ai/message-bubble.tsx` - 消息气泡
- 创建 `src/components/ai/chat-input.tsx` - 输入框
- Markdown 渲染支持

### Task 6: 实现素材匹配功能
- 创建 `src/lib/material-matcher.ts` - 素材匹配逻辑
- 基于搜索引擎匹配相关文档
- 构建上下文 Prompt

### Task 7: 集成到 AI Panel
- 更新 `src/components/layout/ai-panel.tsx`
- 添加模式切换 Tab (Proactive/Chat)
- 集成 ChatPanel 组件

### Task 8: 实现"插入到编辑器"功能
- Chat 消息支持"插入到编辑器"按钮
- 与 EditorContext 集成

### Task 9: 验证与完成
- 运行 lint 和 build 检查
- 修复所有错误
- 创建 Git 标签 `v0.4.0-phase4`

---

## 技术要点

### API 配置
```typescript
// .env.local
DOUBAO_API_KEY=your-api-key
DOUBAO_API_BASE=https://ark.cn-beijing.volces.com/api/v3
DOUBAO_MODEL=doubao-1-5-pro-32k-250115
```

### Chat API 路由
```typescript
// src/app/api/chat/route.ts
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

const doubao = createOpenAI({
  apiKey: process.env.DOUBAO_API_KEY,
  baseURL: process.env.DOUBAO_API_BASE,
});

export async function POST(req: Request) {
  const { messages, context } = await req.json();
  
  const result = streamText({
    model: doubao(process.env.DOUBAO_MODEL!),
    messages: [
      { role: 'system', content: buildSystemPrompt(context) },
      ...messages,
    ],
  });
  
  return result.toDataStreamResponse();
}
```

### 素材匹配流程
```
用户提问 → 搜索摘要 → 命中文档 → 加载原文片段 → 构建 Context → AI 生成回答
```

---

## 预期成果

- ✅ Chat 模式 UI 完成
- ✅ 流式输出正常工作
- ✅ 可基于收藏素材回答问题
- ✅ 生成内容可插入编辑器
- ✅ 标签 `v0.4.0-phase4` 创建
