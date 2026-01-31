# MyWriteAssistant 技术决策文档

> 📅 创建时间：2026-01-31
> 🎯 目标：梳理与大模型交互相关的技术架构设计，确认需要讨论的决策点

---

## 一、技术决策概览

> ✅ **已确认** - 2026-01-31

| 领域 | 决策点 | 状态 | 最终方案 |
|------|--------|------|----------|
| LLM 编排层 | 是否需要可插拔编排架构 | ✅ 已确认 | **轻量级 Pipeline** |
| Prompt 管理 | 是否需要 Prompt 管理器 | ✅ 已确认 | **三层架构 (Meta + Task + Context)** |
| Proactive 触发 | 实时建议的触发策略 | ✅ 已确认 | **延迟触发 + 内容 Hash 去重** |
| 开源借鉴 | 参考项目选择 | ✅ 已确认 | **X Algorithm (向马斯克致敬 🚀)** |

---

## 二、开源项目分析

### 2.1 X Algorithm (xai-org/x-algorithm)

这是 X(Twitter) 开源的 For You Feed 推荐算法，架构非常值得借鉴：

#### 核心设计模式：CandidatePipeline

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CandidatePipeline<Query, Candidate>                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   1. Query Hydrators     → 丰富查询上下文（用户特征、历史行为）                │
│   2. Sources             → 从多个来源获取候选（Thunder/Phoenix）              │
│   3. Hydrators           → 丰富候选数据（元数据、作者信息）                    │
│   4. Filters             → 过滤不合格候选（重复、敏感、屏蔽）                  │
│   5. Scorers             → 评分打分（ML 预测 + 权重计算）                     │
│   6. Selector            → 选择 Top-K                                       │
│   7. Post-Selection      → 后处理（可见性过滤、去重）                         │
│   8. Side Effects        → 副作用处理（缓存、日志）                          │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

**对 MyWriteAssistant 的启发：**

| X Algorithm 概念 | 我们的对应场景 | 借鉴方式 |
|------------------|---------------|----------|
| Query Hydrators | 上下文收集（当前段落、周围内容） | 写作上下文收集器 |
| Sources | 素材来源（收藏文档摘要库） | 多源文档检索 |
| Filters | 相关性过滤 | 素材相关性筛选 |
| Scorers | 打分排序 | 素材优先级排序 |
| Side Effects | 缓存更新 | 推荐历史记录 |

#### 关键代码设计模式

```rust
// X Algorithm 的 Trait-based 插件化设计
#[async_trait]
pub trait CandidatePipeline<Q, C>: Send + Sync {
    fn query_hydrators(&self) -> &[Box<dyn QueryHydrator<Q>>];
    fn sources(&self) -> &[Box<dyn Source<Q, C>>];
    fn filters(&self) -> &[Box<dyn Filter<Q, C>>];
    fn scorers(&self) -> &[Box<dyn Scorer<Q, C>>];
    fn selector(&self) -> &dyn Selector<Q, C>;
    
    async fn execute(&self, query: Q) -> PipelineResult<Q, C>;
}
```

### 2.2 OpenAI Agents SDK (openai-agents-python)

OpenAI 官方的 Agent 编排框架，设计更适合对话场景：

#### 核心概念

```python
# Agent + Handoff + Runner 三件套
class Agent:
    name: str
    instructions: str  # System Prompt
    tools: list[Tool]  # 工具列表
    handoffs: list[Agent]  # 可移交的其他 Agent

class Runner:
    @staticmethod
    async def run(agent: Agent, input: str) -> RunResult:
        # 运行 Agent 直到产出最终结果或 Handoff
        pass
```

**核心运行循环：**

```
┌─────────────────────────────────────────────────────────────────┐
│                        Runner.run() Loop                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. 调用 LLM ──→ 2. 检查输出                                    │
│                     │                                            │
│                     ├── final_output? ──→ 返回结果               │
│                     ├── handoff? ──→ 切换 Agent，重新循环         │
│                     └── tool_calls? ──→ 执行工具，继续循环        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

**Lifecycle Hooks 设计：**

```python
class RunHooks:
    async def on_agent_start(self, agent, input): pass
    async def on_agent_end(self, agent, output): pass
    async def on_tool_start(self, agent, tool): pass
    async def on_tool_end(self, agent, tool, result): pass
    async def on_handoff(self, from_agent, to_agent): pass
```

### 2.3 LangChain Prompt Templates

LangChain 的 Prompt 管理是业界标准：

```python
# 分层 Prompt 组装
ChatPromptTemplate.from_messages([
    ("system", "{system_prompt}"),
    MessagesPlaceholder(variable_name="history"),
    ("human", "{user_input}"),
])

# 支持 partial 填充
template.partial(system_prompt="You are a helpful assistant")
```

---

## 三、我们的架构设计选项

### 3.1 LLM 编排层设计

#### 选项 A：简单直连（MVP 推荐）

```typescript
// 最简单的方案：直接调用 API
class AIService {
  async chat(messages: Message[]): Promise<string> {
    return await callDoubaoAPI(messages);
  }
  
  async streamChat(messages: Message[], onChunk: (text: string) => void) {
    // Streaming 实现
  }
}
```

**优点：** 简单直接，快速迭代
**缺点：** 扩展性有限

#### 选项 B：轻量级 Pipeline（推荐）

借鉴 X Algorithm 的 Pipeline 思想，但大幅简化：

```typescript
// 简化的 Pipeline 设计
interface WritingContext {
  currentParagraph: string;      // 当前段落
  surroundingText: string;       // 周围上下文
  documentTitle: string;         // 文档标题
  relevantMaterials: Material[]; // 相关素材
}

interface AIResponse {
  suggestion: string;
  confidence: number;
  reasoning?: string;
}

// Pipeline 阶段定义
type ContextCollector = (editor: Editor) => WritingContext;
type MaterialMatcher = (context: WritingContext) => Material[];
type PromptBuilder = (context: WritingContext, materials: Material[]) => Message[];
type ResponseParser = (raw: string) => AIResponse;

// Pipeline 执行器
class WritingAssistantPipeline {
  private contextCollector: ContextCollector;
  private materialMatcher: MaterialMatcher;
  private promptBuilder: PromptBuilder;
  private responseParser: ResponseParser;
  
  async execute(editor: Editor): Promise<AIResponse> {
    // 1. 收集上下文
    const context = this.contextCollector(editor);
    
    // 2. 匹配相关素材
    const materials = await this.materialMatcher(context);
    
    // 3. 构建 Prompt
    const messages = this.promptBuilder(context, materials);
    
    // 4. 调用 LLM
    const rawResponse = await this.llmClient.chat(messages);
    
    // 5. 解析响应
    return this.responseParser(rawResponse);
  }
}
```

**优点：** 
- 可测试性好（每个阶段可独立测试）
- 扩展性好（可插拔组件）
- 结构清晰

**缺点：** 
- 初期开发量稍大

#### 选项 C：完整 Agent 框架

使用类似 OpenAI Agents 的完整框架：

```typescript
const writingAssistant = new Agent({
  name: 'WritingAssistant',
  instructions: systemPrompt,
  tools: [searchMaterials, generateOutline, checkGrammar],
  handoffs: [researchAgent, editorAgent],
});

const result = await Runner.run(writingAssistant, userInput);
```

**优点：** 功能强大，支持复杂工作流
**缺点：** 对于写作场景过于复杂，引入不必要的抽象

#### 💡 决策建议

**推荐选项 B（轻量级 Pipeline）**

理由：
1. 复杂度适中，不会过度工程化
2. 参考了 X Algorithm 的优秀设计
3. 便于后续扩展（如果需要更复杂的编排）
4. 每个阶段可独立开发和测试

---

### 3.2 Prompt 管理器设计

#### 需求分析

| 场景 | Prompt 特点 | 动态程度 |
|------|------------|----------|
| Proactive 实时建议 | 需要当前句子 + 上下文 + 写作风格 | 高度动态 |
| Chat 对话 | 需要历史对话 + 文档上下文 | 中等动态 |
| 文档摘要生成 | 固定模板 + 文档内容 | 低动态 |

#### Prompt 分层架构

```typescript
/**
 * 三层 Prompt 架构
 * 
 * Layer 1: Meta Prompt (元提示词) - 定义 AI 的角色和行为规范
 * Layer 2: Task Prompt (任务提示词) - 定义具体任务
 * Layer 3: Context Prompt (上下文提示词) - 动态注入的上下文
 */

// prompts/meta.ts - 元提示词
export const META_PROMPTS = {
  writingAssistant: `你是一位专业的写作助手，专注于帮助用户提升文章质量。

你的行为准则：
- 保持用户的写作风格和语调
- 建议应该具体、可操作
- 不要添加用户没有表达的观点
- 尊重用户的创作自主权`,

  chineseStyle: `写作风格偏好：
- 简洁明了，避免冗余
- 适度使用成语和修辞
- 逻辑清晰，层次分明`,
};

// prompts/tasks.ts - 任务提示词
export const TASK_PROMPTS = {
  proactiveSuggestion: `## 任务：实时写作建议

请分析用户当前正在写的句子，并提供改进建议。

### 输出格式
{
  "original": "原句",
  "suggestion": "建议改写",
  "reason": "改写理由（简短）",
  "confidence": 0.0-1.0
}

### 注意事项
- 只针对当前句子
- 如果句子已经很好，confidence 设为 0
- 保持用户的表达意图`,

  chatAssistant: `## 任务：对话式写作辅助

你可以帮助用户：
1. 回答写作相关问题
2. 生成文章大纲
3. 查询和引用收藏的素材
4. 润色和改写段落

根据用户的问题类型，选择合适的方式回答。`,

  documentSummary: `## 任务：文档摘要生成

请阅读以下文档，生成一份结构化摘要：

### 输出格式
{
  "title": "文档标题",
  "summary": "200字以内的核心摘要",
  "keyPoints": ["要点1", "要点2", ...],
  "tags": ["标签1", "标签2"],
  "quotableSegments": ["可引用的精彩段落1", ...]
}`,
};

// prompts/context.ts - 上下文模板
export const CONTEXT_TEMPLATES = {
  writingContext: (data: WritingContextData) => `
## 当前写作上下文

### 文档标题
${data.documentTitle}

### 当前段落
${data.currentParagraph}

### 周围内容
${data.surroundingText}

### 写作进度
已写 ${data.wordCount} 字，共 ${data.paragraphCount} 段`,

  materialContext: (materials: Material[]) => `
## 相关参考素材

${materials.map((m, i) => `
### 素材 ${i + 1}: ${m.title}
摘要：${m.summary}
要点：${m.keyPoints.join('、')}
`).join('\n')}`,
};
```

#### Prompt 组装器

```typescript
// services/prompt-builder.ts
export class PromptBuilder {
  private metaPrompt: string;
  private taskPrompt: string;
  
  constructor(options: PromptBuilderOptions) {
    this.metaPrompt = META_PROMPTS[options.role];
    this.taskPrompt = TASK_PROMPTS[options.task];
  }
  
  build(context: WritingContext, materials: Material[]): Message[] {
    return [
      {
        role: 'system',
        content: [
          this.metaPrompt,
          META_PROMPTS.chineseStyle,
          this.taskPrompt,
        ].join('\n\n'),
      },
      {
        role: 'user',
        content: [
          CONTEXT_TEMPLATES.writingContext(context),
          materials.length > 0 
            ? CONTEXT_TEMPLATES.materialContext(materials)
            : '',
          `\n## 用户输入\n${context.currentSentence}`,
        ].filter(Boolean).join('\n'),
      },
    ];
  }
}
```

---

### 3.3 Proactive 模式的 Prompt 设计

这是最核心的创新点，需要精心设计：

#### 设计挑战

| 挑战 | 解决方案 |
|------|----------|
| 低延迟要求（1-2秒） | 精简 prompt，减少上下文 |
| 避免过度干扰 | 置信度阈值 + 智能静默 |
| 保持风格一致 | 动态学习用户风格 |
| 多语言/混合场景 | 语言检测 + 适配策略 |

#### Proactive Prompt 设计

```typescript
// prompts/proactive.ts

/**
 * Proactive 模式的元提示词
 * 设计原则：
 * 1. 极简 - 减少 token 消耗
 * 2. 明确 - 输出格式固定
 * 3. 智能 - 知道何时不建议
 */
export const PROACTIVE_META_PROMPT = `你是一个写作助手，观察用户写作并提供实时建议。

规则：
1. 只针对刚完成的句子
2. 保持用户的语气和风格
3. 建议要具体可用
4. 如果句子已经很好，返回 null

输出 JSON：
{"s":"建议句子","r":"简短理由","c":0.8}
或
{"c":0}  // 无需建议时`;

/**
 * 动态上下文构建
 * 只传递最必要的信息
 */
export function buildProactiveContext(
  currentSentence: string,
  previousSentences: string[], // 最多 2-3 句
  documentType: 'blog' | 'note' | 'article',
): string {
  return `类型:${documentType}
前文:${previousSentences.slice(-2).join('')}
当前:${currentSentence}`;
}

/**
 * 完整的 Proactive 请求
 */
export function buildProactiveRequest(context: ProactiveContext): Message[] {
  return [
    { role: 'system', content: PROACTIVE_META_PROMPT },
    { role: 'user', content: buildProactiveContext(
      context.currentSentence,
      context.previousSentences,
      context.documentType,
    )},
  ];
}
```

#### 智能触发策略（含内容 Hash 去重）

```typescript
// services/proactive-trigger.ts

import { createHash } from 'crypto';

/**
 * 智能判断是否需要触发 Proactive 建议
 * 
 * 核心策略：
 * 1. 延迟触发（用户停止输入 1.5 秒）
 * 2. 内容 Hash 去重（避免对同一句子重复建议）
 * 3. 智能频率控制
 */
export class ProactiveTrigger {
  private lastTriggerTime = 0;
  private lastContentHash = '';        // 上次触发时的内容 hash
  private processedHashes = new Set<string>(); // 已处理过的内容 hash 集合
  private userAcceptRate = 0.5;        // 历史采纳率
  private debounceTimer: NodeJS.Timeout | null = null;
  
  // 配置参数
  private readonly DEBOUNCE_DELAY = 1500;      // 延迟触发时间 (ms)
  private readonly MIN_SENTENCE_LENGTH = 10;   // 最小句子长度
  private readonly HASH_CACHE_SIZE = 100;      // hash 缓存上限
  
  /**
   * 计算内容的 hash 值
   * 使用 MD5 足够，因为只用于去重不用于安全
   */
  private computeHash(content: string): string {
    // 标准化处理：去除首尾空白，统一空格
    const normalized = content.trim().replace(/\s+/g, ' ');
    return createHash('md5').update(normalized).digest('hex').substring(0, 16);
  }
  
  /**
   * 检查内容是否已经处理过
   */
  private isContentProcessed(content: string): boolean {
    const hash = this.computeHash(content);
    return this.processedHashes.has(hash);
  }
  
  /**
   * 标记内容为已处理
   */
  private markContentProcessed(content: string): void {
    const hash = this.computeHash(content);
    this.processedHashes.add(hash);
    
    // 维护 hash 缓存大小，避免内存无限增长
    if (this.processedHashes.size > this.HASH_CACHE_SIZE) {
      const firstHash = this.processedHashes.values().next().value;
      this.processedHashes.delete(firstHash);
    }
  }
  
  /**
   * 延迟触发入口
   * 用户每次输入都调用此方法，内部通过 debounce 控制
   */
  scheduleTrigger(
    context: TriggerContext,
    onTrigger: (context: TriggerContext) => void
  ): void {
    // 清除之前的定时器
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    
    // 设置新的延迟触发
    this.debounceTimer = setTimeout(() => {
      if (this.shouldTrigger(context)) {
        this.markContentProcessed(context.currentText);
        this.lastTriggerTime = Date.now();
        onTrigger(context);
      }
    }, this.DEBOUNCE_DELAY);
  }
  
  /**
   * 判断是否应该触发建议
   */
  shouldTrigger(context: TriggerContext): boolean {
    // 1. 内容 Hash 去重检查（最重要！避免重复触发）
    if (this.isContentProcessed(context.currentText)) {
      return false;
    }
    
    // 2. 句子完整性检查
    if (!this.isSentenceComplete(context.currentText)) {
      return false;
    }
    
    // 3. 句子长度检查（太短的句子不建议）
    if (context.currentText.length < this.MIN_SENTENCE_LENGTH) {
      return false;
    }
    
    // 4. 基于历史采纳率的动态调整
    if (this.userAcceptRate < 0.2) {
      // 用户很少采纳，降低触发频率
      return Math.random() < 0.3;
    }
    
    return true;
  }
  
  /**
   * 检测句子是否完整（以标点结尾）
   */
  private isSentenceComplete(text: string): boolean {
    return /[。！？.!?]$/.test(text.trim());
  }
  
  /**
   * 记录用户反馈，更新采纳率
   */
  recordFeedback(accepted: boolean): void {
    // 滑动平均更新采纳率
    this.userAcceptRate = this.userAcceptRate * 0.9 + (accepted ? 0.1 : 0);
  }
  
  /**
   * 清理资源
   */
  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.processedHashes.clear();
  }
}

// 触发上下文类型定义
interface TriggerContext {
  currentText: string;        // 当前句子
  previousText: string;       // 前文
  documentType: 'blog' | 'note' | 'article';
  cursorPosition: number;
}
```

#### 使用示例

```typescript
// 在编辑器中集成
const trigger = new ProactiveTrigger();

editor.on('change', (content) => {
  const currentSentence = extractCurrentSentence(content);
  
  trigger.scheduleTrigger(
    {
      currentText: currentSentence,
      previousText: extractPreviousText(content),
      documentType: detectDocumentType(),
      cursorPosition: editor.getCursor(),
    },
    async (ctx) => {
      // 触发 AI 建议
      const suggestion = await aiService.getProactiveSuggestion(ctx);
      if (suggestion.confidence > 0.5) {
        showSuggestionPanel(suggestion);
      }
    }
  );
});

// 用户采纳建议时
suggestionPanel.on('accept', () => {
  trigger.recordFeedback(true);
});

// 用户忽略建议时
suggestionPanel.on('dismiss', () => {
  trigger.recordFeedback(false);
});
```
```

---

### 3.4 元 Prompt (Meta-Prompt) 设计

#### 什么是元 Prompt？

元 Prompt 是定义 AI 助手核心身份、行为准则和能力边界的基础提示词，相当于 AI 的"人格设定"。

#### 我们的元 Prompt 设计

```typescript
// prompts/meta-prompt.ts

export const CORE_META_PROMPT = `# MyWriteAssistant AI 助手

## 身份定义
你是 MyWriteAssistant 的 AI 写作助手，一个专注于中文内容创作的智能伙伴。

## 核心价值观
1. **尊重创作者** - 你是助手，不是作者。保持用户的声音和风格。
2. **务实高效** - 建议要具体、可执行，不要空泛的评价。
3. **知进退** - 知道什么时候帮忙，什么时候保持安静。

## 能力边界
✅ 你可以：
- 润色和改写句子
- 提供结构建议
- 查询和引用用户的素材库
- 检查语法和用词
- 生成大纲和标题建议

❌ 你不会：
- 代替用户写完整文章
- 添加用户没有表达的观点
- 改变用户的立场或论点
- 使用与用户风格不符的表达

## 输出规范
- 使用 Markdown 格式
- 中文优先，保持专业
- 给出具体的修改建议，而非模糊评价
`;

/**
 * 场景特化的元 Prompt 扩展
 */
export const SCENARIO_META_PROMPTS = {
  // 技术博客写作
  technicalBlog: `
## 技术写作特化

作为技术博客助手，额外注意：
- 代码示例要准确可运行
- 技术术语使用准确
- 保持解释的简洁清晰
- 适当添加必要的上下文`,

  // 个人笔记
  personalNote: `
## 笔记整理特化

作为笔记助手，额外注意：
- 保持简洁，不要过度润色
- 尊重用户的个人表达方式
- 帮助组织和关联知识点`,

  // 长文创作
  longformArticle: `
## 长文创作特化

作为长文助手，额外注意：
- 注意段落之间的过渡
- 保持全文逻辑的连贯性
- 提供结构优化建议
- 帮助控制文章节奏`,
};
```

---

## 四、推荐的最终架构

基于以上分析，推荐以下架构：

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         MyWriteAssistant AI 架构                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        Prompt 管理层                                 │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │  Meta Prompts    │    Task Prompts    │    Context Templates        │   │
│  │  (身份/准则)      │    (具体任务)       │    (动态上下文)              │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     轻量级 Pipeline 编排层                           │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                     │   │
│  │   ContextCollector ──→ MaterialMatcher ──→ PromptBuilder            │   │
│  │         │                    │                    │                 │   │
│  │         ▼                    ▼                    ▼                 │   │
│  │   收集编辑器上下文      匹配相关素材         组装完整 Prompt           │   │
│  │                                                   │                 │   │
│  │                              ┌────────────────────┘                 │   │
│  │                              ▼                                      │   │
│  │                         LLMClient ──→ ResponseParser                │   │
│  │                              │              │                       │   │
│  │                              ▼              ▼                       │   │
│  │                         调用豆包 API     解析结构化响应               │   │
│  │                                                                     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                    │                                        │
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         模式控制层                                   │   │
│  ├──────────────────────────┬──────────────────────────────────────────┤   │
│  │     Proactive 模式       │           Chat 模式                       │   │
│  ├──────────────────────────┼──────────────────────────────────────────┤   │
│  │  ProactiveTrigger        │    ChatSession                           │   │
│  │  (智能触发判断)           │    (对话历史管理)                          │   │
│  │         │                │         │                                │   │
│  │         ▼                │         ▼                                │   │
│  │  SuggestionPresenter     │    ResponseRenderer                      │   │
│  │  (建议展示/采纳)          │    (对话渲染)                             │   │
│  └──────────────────────────┴──────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 五、决策确认结果

> ✅ **全部确认** - 2026-01-31

### 5.1 编排层设计 ✅

**最终决策：** 采用 **轻量级 Pipeline** 架构

```
ContextCollector → MaterialMatcher → PromptBuilder → LLMClient → ResponseParser
```

**理由：**
- 复杂度适中，不会过度工程化
- 借鉴了 X Algorithm 的优秀设计模式
- 便于后续扩展
- 每个阶段可独立开发和测试

### 5.2 Prompt 管理 ✅

**最终决策：** 采用 **三层 Prompt 架构**

| 层级 | 名称 | 职责 | 变化频率 |
|------|------|------|----------|
| Layer 1 | Meta Prompt | AI 身份、行为准则、能力边界 | 极少变化 |
| Layer 2 | Task Prompt | 具体任务指令 | 按任务类型 |
| Layer 3 | Context Prompt | 动态上下文注入 | 每次请求 |

### 5.3 Proactive 触发策略 ✅

**最终决策：** **延迟触发 + 内容 Hash 去重**

| 策略 | 实现方式 | 作用 |
|------|----------|------|
| 延迟触发 | Debounce 1.5 秒 | 避免频繁触发 |
| 内容 Hash | MD5 前 16 位 | 避免对同一句子重复建议 |
| 句子完整检测 | 检测 `。！？.!?` | 只对完整句子建议 |
| 采纳率调整 | 滑动平均 | 动态优化触发频率 |

### 5.4 技术亮点引用 ✅

**最终决策：** 引用 **X Algorithm**，向马斯克致敬 🚀

| 借鉴点 | 应用场景 |
|--------|----------|
| CandidatePipeline 模式 | 写作建议生成流水线 |
| Query Hydrators 概念 | 上下文收集器 |
| Filters + Scorers | 素材筛选与排序 |

**在代码中的体现：**
```typescript
/**
 * 写作助手 Pipeline
 * 
 * 架构灵感来自 X Algorithm (https://github.com/xai-org/x-algorithm)
 * 的 CandidatePipeline 设计模式，致敬 Elon Musk 的开源精神 🚀
 */
export class WritingAssistantPipeline {
  // ...
}
```

---

## 六、下一步行动

确认决策后，可以：

1. **更新设计文档** - 将确认的架构决策添加到主设计文档
2. **创建技术 Spike** - 编写 PoC 代码验证核心概念
3. **开始 Phase 1** - 按计划开始项目初始化

---

## 附录：参考资源

- [X Algorithm GitHub](https://github.com/xai-org/x-algorithm) - Pipeline 架构参考
- [OpenAI Agents Python](https://github.com/openai/openai-agents-python) - Agent 编排参考
- [LangChain Prompts](https://github.com/langchain-ai/langchain) - Prompt 管理参考
