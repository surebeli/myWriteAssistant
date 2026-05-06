---
researcher: gemini-3.1-pro-preview
generated: 2026-05-06T00:00:00Z
input_files_count: 21
estimated_tokens_in: 25000
estimated_tokens_out: 2000
---

#### 1. AI 集成耦合点清单

枚举所有 Doubao 写死或 single-provider 假设的位置：

- a) **直接调用 Doubao 的代码点**
  - src/app/api/chat/route.ts - 行 4-7: const doubao = createOpenAI({ apiKey: process.env.DOUBAO_API_KEY || "", ... })
  - src/app/api/proactive/route.ts - 行 4-7: const doubao = createOpenAI({ apiKey: process.env.DOUBAO_API_KEY || "", ... })

- b) **引用 Doubao 模型名 / API key 环境变量的代码点**
  - src/app/api/chat/route.ts - 行 35: model: doubao(process.env.DOUBAO_MODEL || "doubao-1-5-pro-32k-250115")
  - src/app/api/proactive/route.ts - 行 42: model: doubao(process.env.DOUBAO_MODEL || "doubao-1-5-pro-32k-250115")

- c) **假设单 provider 的状态结构**
  - src/stores/settings-store.ts - 行 4-9: interface AIConfig { provider: 'openai' | 'anthropic' | 'custom'; apiKey: string; baseUrl: string; model: string; }（只维护了一个全局的 AI 配置，不支持多 provider 并存）

- d) **UI 组件里的 provider 假设**
  - 引用 docs/plans/2026-01-31-phase1-implementation.md (在实现中生成的 src/components/layout/status-bar.tsx) - 状态栏写死了 <span>豆包 API</span>，没有根据实际配置动态读取。
  - Chat/Proactive 面板 (chat-panel.tsx, proactive-panel.tsx) 目前都隐式假定调用的 API 路由 ( /api/chat 和 /api/proactive ) 在后端处理唯一的 provider。

- e) **Tauri 侧是否有任何 AI 调用 / 模型配置**
  - src-tauri/src/lib.rs / main.rs / Cargo.toml - 未在文件中找到任何 AI 调用或模型配置相关的代码，完全作为宿主容器。

#### 2. AIProvider 抽象层边界建议

- **抽象层文件 / 目录位置**：
  建议在 src/lib/ai/ 目录下创建抽象层。
  - src/lib/ai/provider-registry.ts（注册表）
  - src/lib/ai/adapters/（各类大模型适配器，如 doubao.ts, claude.ts）

- **TypeScript interface 草案**：
  `	ypescript
  import { LanguageModelV1 } from '@ai-sdk/provider';
  
  export type AIProviderId = 'doubao' | 'claude' | 'openai' | 'deepseek' | 'kimi';
  export type AIScenario = 'chat' | 'proactive' | 'summary';

  export interface AIProviderConfig {
    id: AIProviderId;
    apiKey: string;
    baseURL?: string;
    defaultModel: string;
  }

  export interface AIAdapter {
    id: AIProviderId;
    name: string;
    createModel: (config: AIProviderConfig, modelId?: string) => LanguageModelV1;
  }
  `

- **Doubao 实现重构成 adapter 的最小改动量描述**：
  - 删 12 行：删除 chat/route.ts 和 proactive/route.ts 中写死的 createOpenAI 初始化和 doubao(...) 调用。
  - 加 20 行：在 src/lib/ai/adapters/doubao.ts 封装 @ai-sdk/openai，暴露 createModel；在 API 路由中增加读取请求参数中 provider 配置的代码。
  - 挪 2 个 import：将 @ai-sdk/openai 的引用从 route 挪到 adapter 层。

- **各 Provider 接入时的 API 形态差异提示**：
  - **Streaming 协议**：统一通过 Vercel AI SDK 的提供商包 (@ai-sdk/openai, @ai-sdk/anthropic 等) 接入，以屏蔽流式协议的差异。
  - **Auth 方式**：Kimi, DeepSeek, Doubao 均兼容 OpenAI SDK 的 Bearer token，Claude 使用 x-api-key 和特定 header，需引入 @ai-sdk/anthropic。
  - **Model ID**：不同厂商的 model ID 需要维护一个映射表（例如 DeepSeek 常用 deepseek-chat，Claude 为 claude-3-5-sonnet-latest）。

- **是否需要 "per scenario provider" 的 routing 层**：
  - **需要**。Proactive 模式对响应速度要求极高，而 Chat 模式侧重逻辑推理。建议设计最小 Routing 层：在 settings-store.ts 的 AIConfig 中将单一配置升级为 scenarioConfigs: Record<AIScenario, AIProviderConfig>，前端发送 API 请求时带上当前场景配置，API 路由根据传入参数动态加载对应的 createModel。

#### 3. plan docs 与实际代码的偏差

| Plan 描述 | 实际实现 | 偏差程度（轻/中/重） | 影响 |
|---|---|---|---|
| 设计文档中说明使用 IndexedDB 缓存向量并使用向量搜索 | search-engine.ts 使用的是 MiniSearch，仅实现了本地全文搜索，没有向量缓存逻辑。 | 中 | AI 无法做到基于语义的相似度搜索，Chat 匹配素材质量下降。 |
| 技术决策文档中确认了三层 Prompt 架构 (Meta + Task + Context) 和 PromptBuilder | API 路由中直接用简单的模板字符串硬编码了 Prompt，没有实现 PromptBuilder 和三层架构。 | 重 | 新增 provider 和适配不同模型的系统提示词将变得非常困难，可维护性差。 |
| 设计文档中 Proactive 模式触发包含内容 Hash 去重策略 | proactive-panel.tsx 只是做了简单的防抖延迟调用，无去重。 | 中 | 相同的句子光标移入移出可能会重复触发大模型调用，浪费 token 和计费。 |
| settings-store.ts 支持从 store 配置 AI | oute.ts 并没有读取客户端的 store 数据，而是直接读取服务端的 process.env 强行锁死 Doubao。 | 重 | 用户端在 UI 修改了配置服务端也无法感知，vendor-agnostic 形同虚设。 |
| Proactive 返回结构化的 JSON {"s":"建议","r":"理由","c":0.8} | pi/proactive/route.ts 实际强制模型返回纯文本。 | 中 | AI 返回如果不稳定（带说明文字），会破坏 UI 的展示。 |

#### 4. 重构风险点

- **风险 1：客户端状态与服务端请求的配置脱节**
  - **触发条件**：重构支持多提供商时，如果不打通前后端配置传递，API Route 会缺失凭证。
  - **缓解建议**：在请求 Payload 中统一增加 providerConfig 字段；服务端不再强依赖环境变量。
  - **严重度**：高。

- **风险 2：Vercel AI SDK 的兼容性导致模型崩溃**
  - **触发条件**：接入 Kimi/DeepSeek 时，直接复用 @ai-sdk/openai，由于非标准响应头或 Streaming 格式差异导致 SDK 解析报错。
  - **缓解建议**：实现前先写一个极简的 Node.js 测试脚本验证 @ai-sdk/openai 适配特定国内模型的可行性。
  - **严重度**：中。

- **风险 3：Proactive 的纯文本响应格式不稳定**
  - **触发条件**：切换到其他模型（如 DeepSeek）时，新模型没有遵守 "只返回纯文本不解释" 的 Prompt 约束。
  - **缓解建议**：在重构时顺便引入 streamObject 或在 Prompt 中强制要求 JSON output，以保证容错。
  - **严重度**：高。

#### 5. 给 Leader 的开放问题

- **问题 1：API Key 的传输方式设计**
  - **描述**：由于本应用是 Tauri 本地应用，前端可以拿到用户配置的多种 API Key。后端（Next.js API Routes）需要使用这些 Key。
  - **倾向答案**：Option A - 前端每次发请求（/api/chat, /api/proactive）时，将完整的 Vendor Config (Provider, Key, URL) 放入 Request Header 或 Payload，让 API Route 纯无状态化处理。
  - **理由**：本地架构中不存在公网拦截的安全问题，无状态化 API 能够极大简化架构，最适合客户端程序的场景。
  - **卡住的工作**：不决策将无法重构 API 路由以接收动态配置。

- **问题 2：是否强行将所有模型对齐到 Vercel AI SDK 的接口**
  - **描述**：不同的模型对 system prompt、多轮对话支持存在差异，用 Vercel AI SDK 统一包装可能会有阻力。
  - **倾向答案**：Option A - 维持目前的最小功能集合（仅 System + User messages），全盘依赖 Vercel AI SDK 强行适配。
  - **理由**：本次 scope 是 "让 AI provider 可换"，尽量复用统一 SDK 能做到最小改动。如果遇到不支持的模型，直接降级或提示用户。
  - **卡住的工作**：不决策无法进行各厂商 Adapter 的具体代码设计。

- **问题 3：是否在本次重构中修复 PromptBuilder 架构丢失问题**
  - **描述**：原计划的三层 Prompt 架构在实际代码中被简单字符串模板替代。如果目前引入多 Vendor，不同 Vendor 可能对 System Prompt 的格式有不同敏感度。
  - **倾向答案**：Option B - 不重构 Prompt 架构，仅在原有基础上为新的 Provider 做微小适配（If-Else 隔离）。
  - **理由**：重构建议应**保守优先**，当前目标是 "可换 Vendor" 而非 "优化 Prompt 架构"，避免扩大 Scope。
  - **卡住的工作**：Leader 需要确认本次 Spec 的 Scope 边界，否则容易设计出过度复杂的重构方案。
