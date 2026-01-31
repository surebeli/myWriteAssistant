# MyWriteAssistant 产品设计文档

> 📅 创建时间：2026-01-31  
> 📝 状态：Brainstorming 阶段  
> 🎯 目标：个人写作助手应用，融合 NotebookLM + Notion 能力

---

## 一、产品定位

一款**个人写作助手应用**，专注于 **收藏 → 整理 → 创作** 的工作流，核心理念是"渐进式上下文加载"——先理解素材摘要，写作时按需深入。

### 目标用户画像

- 知识工作者/内容创作者
- 需要整合多源素材进行写作
- 重视写作效率和 AI 辅助

---

## 二、核心使用场景

### 2.1 写作类型（多元混合）

| 类型 | 特点 |
|------|------|
| 技术博客/文章 | 需要代码高亮、技术文档格式 |
| 个人笔记/知识管理 | 快速记录想法、整理学习资料 |
| 长文/深度内容创作 | 需要大纲组织、多素材引用 |

### 2.2 素材来源

| 来源 | 处理方式 |
|------|----------|
| 网页文章 | 浏览器收藏，抓取正文内容 |
| PDF 文档 | 导入解析，提取文本 |
| Markdown 文件 | 直接导入 |
| 自己的笔记/草稿 | 内部管理，支持复用 |

---

## 三、核心功能设计

### 3.1 文档收藏系统

**渐进式上下文加载设计：**

```
┌─────────────────────────────────────────────────────────────┐
│  收藏文档处理流程                                             │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 导入文档 ──→ 2. AI 生成摘要/要点 ──→ 3. 本地缓存存储       │
│       │              │                       │              │
│       ▼              ▼                       ▼              │
│  原始文档存储    summaries/*.md         索引更新              │
│  documents/     (核心要点/脑图)         (便于搜索)            │
│                                                             │
│  4. 写作时匹配摘要 ──→ 5. 命中后加载原文 ──→ 6. 详细总结        │
│       │                    │                   │            │
│       ▼                    ▼                   ▼            │
│  节省 token            按需深入             精准引用          │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**本地存储结构：**

```
~/myWriteAssistant-data/
├── documents/              # 原始收藏文档
│   ├── web/               # 网页文章 (.md)
│   ├── pdf/               # PDF 文档 (.pdf + .md 提取)
│   └── imports/           # 导入的 Markdown
├── summaries/             # AI 生成的摘要缓存 (.md)
│   └── {doc-id}-summary.md
├── drafts/                # 写作草稿
├── published/             # 已发布文章
└── index.json             # 文档索引（含更新时间戳）
```

**文件更新追踪机制：**

- 存储文档的 `lastModified` 时间戳
- 打开应用时对比文件系统时间戳
- 检测到变更时提示重新生成摘要

### 3.2 写作编辑器

**风格：Typora/Obsidian 所见即所得 Markdown**

| 特性 | 说明 |
|------|------|
| 实时渲染 | 输入 Markdown 语法即时渲染 |
| 代码高亮 | 支持多语言语法高亮 |
| 图片支持 | 拖拽上传，本地存储 |
| 大纲导航 | 右侧/侧边栏显示 TOC |
| 自动保存 | 实时保存到本地文件 |
| 导出 | 无损导出 Markdown/HTML |

### 3.3 AI 写作助手

#### 🌟 AI 助手面板：双模式设计

AI 助手面板支持**两种模式切换**，满足不同写作场景需求：

```
┌─────────────────────────────────────────────────────────────────┐
│  AI 助手面板                              [Proactive ▼] [Chat]  │
├─────────────────────────────────────────────────────────────────┤
│                     模式切换按钮（Tab 样式）                      │
└─────────────────────────────────────────────────────────────────┘
```

| 模式 | 默认 | 使用场景 | 交互方式 |
|------|------|----------|----------|
| **Proactive** | ✅ 默认 | 专注写作，需要实时润色建议 | AI 主动观察并给出建议 |
| **Chat** | - | 需要问答、生成大纲、素材查询 | 用户主动发起对话 |

---

##### 模式一：Proactive 实时协同写作（默认）

**设计理念：** AI 像一个坐在旁边的写作伙伴，实时观察你的写作，适时给出建议。

```
┌─────────────────────────────────────────────────────────────────┐
│                     Proactive 协同写作模式                        │
├──────────────────────────────┬──────────────────────────────────┤
│         主编辑区              │     AI 助手面板 [Proactive ●]     │
│                              │                                  │
│  用户正在输入：               │  📍 实时同步：                    │
│  "AI 技术正在快速发展，       │  "AI 技术正在快速发展，            │
│   但很多人对它有误解。"       │   但很多人对它有误解。"            │
│                              │                                  │
│          ↓                   │          ↓ (延迟 1-2 秒)          │
│                              │                                  │
│                              │  💡 建议改写：                     │
│                              │  "AI 技术正以前所未有的速度演进，  │
│                              │   然而公众对其认知仍存在诸多误区。"│
│                              │                                  │
│                              │  [采纳 ✓] [忽略 ✗] [修改 ✎]       │
│                              │                                  │
│  用户点击 [采纳] ──────────────────→ 自动替换原句                 │
│                              │                                  │
└──────────────────────────────┴──────────────────────────────────┘
```

---

##### 模式二：Chat 对话模式

**设计理念：** 传统对话式交互，用户主动提问，AI 回答。适合需要深度交互的场景。

```
┌─────────────────────────────────────────────────────────────────┐
│                        Chat 对话模式                             │
├──────────────────────────────┬──────────────────────────────────┤
│         主编辑区              │       AI 助手面板 [Chat ●]        │
│                              │                                  │
│  # 我的文章标题               │  ┌─────────────────────────────┐ │
│                              │  │ 🧑 帮我生成一个关于 AI 发展   │ │
│  正文内容...                  │  │    趋势的写作大纲            │ │
│                              │  └─────────────────────────────┘ │
│                              │                                  │
│                              │  ┌─────────────────────────────┐ │
│                              │  │ 🤖 好的，根据你的收藏素材，  │ │
│                              │  │    我为你生成以下大纲：      │ │
│                              │  │                             │ │
│                              │  │    ## AI 发展趋势            │ │
│                              │  │    1. 技术演进               │ │
│                              │  │    2. 应用场景               │ │
│                              │  │    3. 未来展望               │ │
│                              │  │                             │ │
│                              │  │    [插入到编辑器] [复制]     │ │
│                              │  └─────────────────────────────┘ │
│                              │                                  │
│                              │  ┌─────────────────────────────┐ │
│                              │  │ 输入消息...          [发送]  │ │
│                              │  └─────────────────────────────┘ │
└──────────────────────────────┴──────────────────────────────────┘
```

**Chat 模式支持的功能：**

| 功能 | 示例指令 |
|------|----------|
| 素材问答 | "根据收藏的文章，总结一下 RAG 的核心原理" |
| 大纲生成 | "帮我生成关于 X 主题的写作大纲" |
| 素材推荐 | "推荐与当前文章相关的收藏素材" |
| 续写扩展 | "帮我续写这段内容" |
| 翻译 | "把选中的内容翻译成英文" |
| 实时搜索 | "搜索一下 X 的最新进展" |

---

##### 模式切换逻辑

```typescript
// 模式状态
type AssistantMode = 'proactive' | 'chat';

interface AssistantState {
  mode: AssistantMode; // 默认 'proactive'
  // Proactive 模式状态
  proactive: {
    currentSentence: string;
    suggestion: string | null;
    isGenerating: boolean;
  };
  // Chat 模式状态  
  chat: {
    messages: Message[];
    isStreaming: boolean;
  };
}

// 切换时的行为
const switchMode = (newMode: AssistantMode) => {
  if (newMode === 'proactive') {
    // 切换到 Proactive：开始监听编辑器
    startEditorObserver();
  } else {
    // 切换到 Chat：停止监听，保留历史对话
    stopEditorObserver();
  }
};
```

**关键设计原则：**

| 原则 | 说明 |
|------|------|
| **句子粒度** | 建议单位最大是一句话，避免大段改写干扰心流 |
| **延迟触发** | 检测到句子完成（句号/问号/感叹号）后延迟 1-2 秒再给建议 |
| **非阻塞** | 建议显示在侧边栏，不打断主编辑区写作 |
| **可选采纳** | 用户完全控制，可采纳、忽略或修改建议 |
| **上下文感知** | 建议基于当前文章上下文，保持风格一致 |

**触发条件：**

```typescript
// 伪代码：建议触发逻辑
const shouldSuggest = (text: string, cursorPosition: number) => {
  const lastSentence = extractLastCompleteSentence(text, cursorPosition);
  if (!lastSentence) return false;
  
  // 句子完成 + 延迟 1.5 秒 + 用户无新输入
  return isSentenceComplete(lastSentence) 
    && timeSinceLastInput > 1500
    && lastSentence.length > 10; // 太短的句子不建议
};
```

#### 其他 AI 功能

| 功能 | 触发方式 | 说明 |
|------|----------|------|
| **素材问答** | 对话式 | "根据收藏的文章，总结 X 观点" |
| **大纲生成** | 对话式 | "帮我生成关于 X 的写作大纲" |
| **素材推荐** | 对话式 | "推荐与当前主题相关的收藏" |
| **续写扩展** | 对话式 / 快捷键 | 选中文本或光标处续写 |
| **实时搜索** | 对话式 | 调用浏览器搜索验证事实 |

---

## 四、UI 设计

### 4.1 三段式布局

```
┌──────────────────────────────────────────────────────────────────┐
│  🔧 工具栏：新建 | 保存 | 导出 | 设置              [Proactive: ON]│
├────────────┬─────────────────────────────┬───────────────────────┤
│            │                             │                       │
│   侧边栏    │         主编辑区            │      AI 助手面板       │
│  (240px)   │         (flex-1)            │       (360px)         │
│  可折叠     │                             │       可折叠          │
│            │                             │                       │
│ ┌────────┐ │  ┌─────────────────────────┐│  ┌─────────────────┐  │
│ │📁 收藏库│ │  │ # 文章标题              ││  │ 💬 对话模式     │  │
│ │ ├ 网页  │ │  │                         ││  │                 │  │
│ │ ├ PDF  │ │  │ 正文内容...              ││  │ 用户: 帮我生成  │  │
│ │ └ 笔记  │ │  │                         ││  │ 关于AI的大纲    │  │
│ ├────────┤ │  │ AI 技术正在快速发展，    ││  │                 │  │
│ │🏷️ 标签 │ │  │ 但很多人对它有误解。█    ││  │ AI: 好的...     │  │
│ ├────────┤ │  │                         ││  ├─────────────────┤  │
│ │🔍 搜索 │ │  │                         ││  │ ✨ Proactive    │  │
│ ├────────┤ │  │                         ││  │                 │  │
│ │📝 草稿 │ │  │                         ││  │ 当前句子:       │  │
│ │ ├ 草稿1│ │  │                         ││  │ "但很多人对它   │  │
│ │ └ 草稿2│ │  │                         ││  │  有误解。"      │  │
│ └────────┘ │  │                         ││  │                 │  │
│            │  │                         ││  │ 💡 建议:        │  │
│            │  │                         ││  │ "然而公众对其   │  │
│            │  │                         ││  │  认知仍存..."   │  │
│            │  │                         ││  │                 │  │
│            │  │                         ││  │ [采纳] [忽略]   │  │
│            │  └─────────────────────────┘│  └─────────────────┘  │
├────────────┴─────────────────────────────┴───────────────────────┤
│  📊 状态栏：字数 1,234 | 已保存 | Proactive 模式已启用 | 豆包 API  │
└──────────────────────────────────────────────────────────────────┘
```

### 4.2 响应式设计

| 屏幕 | 布局调整 |
|------|----------|
| 桌面 (>1200px) | 三栏同时显示 |
| 平板 (768-1200px) | 侧边栏可折叠，双栏 |
| 移动 (<768px) | 单栏，底部导航切换 |

---

## 五、技术架构

### 5.1 技术栈

| 层级 | 选型 | 理由 |
|------|------|------|
| 框架 | Next.js 14 + TypeScript | App Router、API Routes 一体化 |
| UI | Tailwind CSS + shadcn/ui | 现代、轻量、可定制 |
| 编辑器 | Tiptap (ProseMirror) | 所见即所得 Markdown，扩展性强 |
| 本地存储 | File System Access API | Markdown 明文，文件夹结构 |
| 浏览器存储 | IndexedDB | 索引、配置、向量缓存 |
| 搜索 | MiniSearch | 轻量全文搜索，离线可用 |
| AI | 豆包 API (OpenAI 兼容) | 成本可控，中文优化 |
| 状态管理 | Zustand | 轻量，适合中型应用 |

### 5.2 开发规范与最佳实践

#### UI 设计规范（Web Interface Guidelines）

遵循 Vercel Web Interface Guidelines，确保高质量的用户体验：

**Accessibility（无障碍）**
- Icon-only 按钮需要 `aria-label`
- 表单控件需要 `<label>` 或 `aria-label`
- 交互元素需要键盘处理 (`onKeyDown`/`onKeyUp`)
- 使用语义化 HTML：`<button>` 用于操作，`<a>` 用于导航
- 图片需要 `alt` 属性

**Focus States（焦点状态）**
- 交互元素需要可见焦点：`focus-visible:ring-*`
- 使用 `:focus-visible` 而非 `:focus`
- 复合控件使用 `:focus-within`

**Forms（表单）**
- 输入框需要 `autocomplete` 和有意义的 `name`
- 使用正确的 `type`（email, tel, url）
- 禁用时显示 spinner，提交按钮保持启用直到请求开始

**Animation（动画）**
- 尊重 `prefers-reduced-motion`
- 只动画 `transform`/`opacity`（compositor-friendly）
- 不使用 `transition: all`，明确列出属性

**Typography（排版）**
- 使用 `…` 而非 `...`
- Loading 状态以 `…` 结尾："加载中…"
- 数字列使用 `font-variant-numeric: tabular-nums`

**Dark Mode（深色模式）**
- 设置 `color-scheme: dark`
- 使用 `<meta name="theme-color">`

**Anti-patterns（避免的模式）**
- ❌ `user-scalable=no` 禁用缩放
- ❌ `outline-none` 无焦点替代
- ❌ `<div onClick>` 代替 `<button>`
- ❌ 无尺寸的图片
- ❌ 无虚拟化的大列表

#### React/Next.js 最佳实践（Vercel Engineering）

遵循 Vercel React Best Practices，确保高性能：

**CRITICAL - 消除瀑布流**
- `async-parallel`：使用 `Promise.all()` 并行独立操作
- `async-suspense-boundaries`：使用 Suspense 流式传输内容
- `async-defer-await`：将 await 移到实际使用的分支

**CRITICAL - Bundle 优化**
- `bundle-barrel-imports`：直接导入，避免 barrel 文件
- `bundle-dynamic-imports`：使用 `next/dynamic` 懒加载重组件
- `bundle-defer-third-party`：延迟加载分析/日志脚本

**HIGH - 服务端性能**
- `server-cache-react`：使用 `React.cache()` 请求级去重
- `server-serialization`：最小化传给客户端组件的数据
- `server-parallel-fetching`：重构组件以并行获取

**MEDIUM - 重渲染优化**
- `rerender-memo`：将昂贵计算提取到 memoized 组件
- `rerender-functional-setstate`：使用函数式 setState
- `rerender-transitions`：使用 `startTransition` 处理非紧急更新

### 5.2 核心数据流

```
┌─────────────────────────────────────────────────────────────────┐
│                        数据流架构                                │
└─────────────────────────────────────────────────────────────────┘

    ┌──────────────┐
    │  用户操作     │
    └──────┬───────┘
           │
           ▼
    ┌──────────────┐      ┌──────────────┐
    │  Zustand     │◄────►│  React 组件   │
    │  状态管理     │      │  UI 渲染      │
    └──────┬───────┘      └──────────────┘
           │
           ▼
    ┌──────────────────────────────────────┐
    │           存储层                      │
    ├──────────────────┬───────────────────┤
    │  File System     │    IndexedDB      │
    │  Access API      │                   │
    │  ───────────     │    ───────────    │
    │  • 文档 (.md)    │    • 搜索索引     │
    │  • 摘要缓存      │    • 配置信息     │
    │  • 草稿          │    • 向量缓存     │
    └──────────────────┴───────────────────┘
           │
           ▼
    ┌──────────────┐
    │  豆包 API    │
    │  (AI 服务)    │
    └──────────────┘
```

### 5.3 Proactive 模式技术实现

```typescript
// 核心状态
interface ProactiveState {
  isEnabled: boolean;
  currentSentence: string;
  suggestion: string | null;
  isGenerating: boolean;
}

// 监听编辑器变化
editor.on('update', debounce(({ editor }) => {
  if (!proactiveEnabled) return;
  
  const text = editor.getText();
  const lastSentence = extractLastCompleteSentence(text);
  
  if (shouldSuggest(lastSentence)) {
    generateSuggestion(lastSentence, getContext(editor));
  }
}, 1500)); // 1.5 秒延迟

// 采纳建议
const acceptSuggestion = () => {
  editor.commands.replaceCurrentSentence(suggestion);
  clearSuggestion();
};
```

---

## 六、开发计划

### 开发工具链

| 阶段 | 使用的工具/Skill |
|------|-----------------|
| **设计阶段** | Stitch (UI 设计稿)、Web Design Guidelines |
| **开发阶段** | Vercel React Best Practices、shadcn/ui |
| **AI 集成** | 豆包 API、agent-browser (实时搜索) |

### Phase 1：基础框架搭建（Week 1）

**目标：** 搭建可运行的 Next.js 项目骨架

- [ ] 初始化 Next.js 14 项目 + TypeScript
- [ ] 配置 Tailwind CSS + shadcn/ui
- [ ] 实现三段式响应式布局骨架（参照 Stitch 设计稿）
- [ ] 搭建基础路由：`/` (编辑器), `/library` (文档库)
- [ ] 集成 File System Access API 基础
- [ ] 实现深色/浅色模式切换
- [ ] 遵循 Web Design Guidelines：
  - 语义化 HTML
  - 键盘导航支持
  - `prefers-reduced-motion` 支持

**验收标准：**
- 三段式布局可正常展示
- 模式切换正常工作
- File System 授权流程完成

### Phase 2：编辑器核心（Week 2-3）

**目标：** 实现所见即所得 Markdown 编辑器

- [ ] 集成 Tiptap 编辑器
- [ ] 实现所见即所得 Markdown 编辑
  - 标题、列表、引用、代码块
  - 粗体、斜体、链接
- [ ] 代码高亮支持 (Shiki)
- [ ] 大纲导航（TOC）自动生成
- [ ] 自动保存到本地文件（防抖 2 秒）
- [ ] 文档 CRUD 基础功能
- [ ] 遵循 React Best Practices：
  - `bundle-dynamic-imports`：编辑器动态加载
  - `rerender-memo`：优化大文档性能
  - Uncontrolled input 模式

**验收标准：**
- Markdown 实时渲染正常
- 文件自动保存到本地文件夹
- 大纲导航可跳转

### Phase 3：文档收藏系统（Week 4-5）

**目标：** 实现多源文档导入和管理

- [ ] 网页内容抓取和保存
  - 使用 Readability.js 提取正文
  - 保存为 Markdown
- [ ] PDF 文件导入和解析 (pdf.js)
- [ ] Markdown 文件导入
- [ ] 标签系统和分类管理
- [ ] 全文搜索功能 (MiniSearch)
- [ ] 文档库 Grid/List 视图（参照 Stitch 设计）
- [ ] AI 摘要生成和缓存
  - 调用豆包 API 生成摘要
  - 缓存到 `summaries/` 文件夹
- [ ] 文件更新追踪机制
  - 比对 `lastModified` 时间戳
  - 提示重新生成摘要

**验收标准：**
- 可导入网页/PDF/Markdown
- 搜索功能正常工作
- 摘要自动生成并缓存

### Phase 4：AI 写作助手 - Chat 模式（Week 6）

**目标：** 实现对话式 AI 交互

- [ ] 豆包 API 集成（OpenAI 兼容格式）
- [ ] Chat 模式 UI（参照 Stitch 设计）
  - 消息气泡
  - Markdown 渲染
  - 流式输出
- [ ] 基于摘要的素材匹配
  - 先搜索摘要
  - 命中后加载原文
- [ ] 大纲生成功能
- [ ] 素材推荐功能
- [ ] "插入到编辑器" 功能
- [ ] 遵循 React Best Practices：
  - `async-suspense-boundaries`：流式渲染
  - `client-swr-dedup`：请求去重

**验收标准：**
- 对话流式输出正常
- 可基于收藏素材回答问题
- 生成内容可插入编辑器

### Phase 5：AI 写作助手 - Proactive 模式（Week 7-8）

**目标：** 实现创新的实时协同写作

- [ ] Proactive 模式 UI（参照 Stitch 设计）
  - 实时同步区域
  - 建议展示区域
  - 采纳/忽略/修改按钮
- [ ] 实时句子检测
  - 监听编辑器内容变化
  - 提取最后一个完整句子
- [ ] 延迟建议生成（1.5 秒防抖）
- [ ] 建议采纳/忽略机制
  - 采纳：替换原句
  - 忽略：清除建议
- [ ] 上下文感知
  - 传递前 N 个段落作为上下文
  - 保持风格一致
- [ ] 模式切换 (Proactive ↔ Chat)

**验收标准：**
- 实时同步正常显示
- 建议延迟触发正常
- 采纳后正确替换原句

### Phase 6：优化与发布（Week 9-10）

**目标：** 性能优化和最终交付

- [ ] 性能优化
  - Lighthouse 评分 > 90
  - 首屏加载 < 2 秒
- [ ] Bundle 分析和优化
  - `bundle-barrel-imports`
  - `bundle-defer-third-party`
- [ ] 错误处理完善
  - API 调用错误
  - 文件访问错误
- [ ] 用户体验打磨
  - 加载状态
  - 空状态
  - 错误提示
- [ ] Web Design Guidelines 最终审查
- [ ] 文档编写
  - README.md
  - 用户指南
- [ ] 部署上线 (Vercel)

---

## 七、Brainstorm 讨论记录

### 2026-01-31 初始讨论

**Q1: 主要写作场景？**
- A: 技术博客 + 个人笔记 + 长文创作（混合型）

**Q2: 素材来源？**
- A: 网页文章 + PDF/Markdown + 自己的笔记草稿

**Q3: AI 最重要的能力？**
- A: 
  - 基于素材总结要点（渐进式上下文加载设计）
  - 续写/润色（实时建议 + 对话式）
  - 大纲生成 + 素材推荐（对话式）
  - 实时搜索验证（agent-browser）

**Q4: 技术偏好？**
- A: Web 应用 + File System Access API（本地存储）
- AI 服务商：豆包

**Q5: 编辑器风格？**
- A: Typora/Obsidian 风格（所见即所得 Markdown）

**用户创新点 1：Proactive 实时协同写作模式**
- AI 实时同步显示用户正在写的内容
- 延迟给出改写建议（避免干扰心流）
- 建议粒度是句子级别（不是段落或整篇）
- 用户同意后才同步到主编辑区

**用户创新点 2：双模式 AI 助手**
- 默认 Proactive 模式：适合专注写作
- 可切换 Chat 模式：适合深度交互

**设计工具确认：**
- UI 设计：Stitch (Google)
- 设计规范：Web Design Guidelines (Vercel)
- 开发规范：Vercel React Best Practices

---

## 八、UI 设计资源（Stitch）

### Stitch 项目信息

| 项目 | 值 |
|------|-----|
| **项目名称** | MyWriteAssistant |
| **项目 ID** | `1840683527876412125` |
| **访问链接** | https://stitch.withgoogle.com/projects/1840683527876412125 |

### 已生成的设计稿

| 序号 | 设计稿名称 | 描述 | Screen ID |
|------|-----------|------|-----------|
| 1 | **Editor - Proactive Mode** | 编辑器主界面，AI Proactive 模式 | `55f84057ec2c45c6973abee50e2c54e6` |
| 2 | **Editor - Chat Mode** | 编辑器界面，AI Chat 对话模式 | `510fb128df934cca828307ebbc2b558e` |
| 3 | **Document Library Grid** | 文档库网格视图 | `862c2211d67b490899ce9e732f7edfeb` |
| 4 | **Dark Mode - Proactive** | 深色模式编辑器界面 | `d34ae9b20702461eb205323152cef668` |
| 5 | **Import Document Modal** | 文档导入流程（URL/上传/粘贴） | `6cb802dbb9f64bc5b49525a33bb38352` |
| 6 | **Document Detail & Summary** | 文档详情页，AI 摘要/要点/脑图 | `0fa0e70517d14f92bc256ce6b7733331` |
| 7 | **Empty State - Library** | 空状态：无文档收藏 | `13b8647e252041e5aa687373062de7de` |
| 8 | **Empty State - Drafts** | 空状态：无草稿 | `3001ab3eef4146b48864c4a71e261110` |
| 9 | **Empty State - Search** | 空状态：搜索无结果 | `db9764e4a0b241e791bf2b0da6cdddef` |
| 10 | **Settings Panel** | 设置面板（AI/Proactive/外观/存储） | `9b608e1bbb994de9b2da5d1c9a240154` |
| 11 | **Proactive - Analyzing** | Proactive 状态：正在分析 | `fa19367486aa486e81b5985d5a14182f` |
| 12 | **Proactive - Generating** | Proactive 状态：生成建议中 | `fac50f87b78043fb958c72c26635fb22` |
| 13 | **Proactive - Ready** | Proactive 状态：建议就绪 | `f6f11c7094d344a0b421091f687b3bd0` |
| 14 | **Proactive - Clear** | Proactive 状态：无需修改 | `a30bb74b78314449b198f9e7aa3d81f1` |
| 15 | **Related Materials** | 相关素材推荐交互 | `bbfddf08fff34fa281a2880bfdc8e9e9` |

### 设计规范

| 属性 | 值 |
|------|-----|
| **主题色** | `#4725f4` (Purple/Blue) |
| **字体** | Inter |
| **圆角** | 8px |
| **配色模式** | Light / Dark 双模式 |

---

## 九、待讨论事项

- [x] 具体的 UI 配色方案 → 已确定：#4725f4 紫蓝色
- [x] 是否需要深色模式 → 是，已设计
- [ ] 文档导出格式需求
- [ ] 是否考虑移动端适配
- [ ] 后续是否考虑云同步功能

---

*文档持续更新中...*
