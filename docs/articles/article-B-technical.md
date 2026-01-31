# 风格 B：技术实践类

---

# 从零搭建 AI 写作助手：技术架构与选型实战

> Next.js 14 + Tiptap + File System Access API + 豆包 API

---

## 项目背景

我要做一个本地优先的 AI 写作助手，核心需求：

- 三段式布局（侧边栏 + 编辑器 + AI 面板）
- 所见即所得 Markdown 编辑器
- 本地文件存储（Markdown 明文）
- AI 实时润色建议

技术选型需要平衡：**开发效率、用户体验、可维护性**。

---

## 架构总览

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browser (Chrome/Edge)                     │
├─────────────────────────────────────────────────────────────────┤
│                         Next.js 14 App                          │
│  ┌─────────────┬─────────────────────┬───────────────────────┐  │
│  │  Sidebar    │     Tiptap Editor   │    AI Panel           │  │
│  │  (React)    │     (ProseMirror)   │    (React + Stream)   │  │
│  └─────────────┴─────────────────────┴───────────────────────┘  │
│                              │                                   │
│                       Zustand Store                              │
│                              │                                   │
│  ┌───────────────────────────┴───────────────────────────────┐  │
│  │                     Storage Layer                          │  │
│  │  ┌─────────────────────┐  ┌─────────────────────────────┐ │  │
│  │  │ File System Access  │  │      IndexedDB              │ │  │
│  │  │ API                 │  │                             │ │  │
│  │  │ - documents/*.md    │  │  - Search index             │ │  │
│  │  │ - summaries/*.md    │  │  - App config               │ │  │
│  │  │ - drafts/*.md       │  │  - Vector cache             │ │  │
│  │  └─────────────────────┘  └─────────────────────────────┘ │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   豆包 API      │
                    │  (OpenAI 兼容)   │
                    └─────────────────┘
```

---

## 核心技术选型

### 1. 框架：Next.js 14 (App Router)

**为什么选 Next.js？**

| 对比项 | Next.js | Vite + React | Electron |
|--------|---------|--------------|----------|
| 路由 | 内置 App Router | 需自行配置 | 需自行配置 |
| API 层 | Route Handlers | 需额外后端 | Node.js 进程 |
| 部署 | Vercel 一键 | 需配置 | 打包分发 |
| 学习曲线 | 中 | 低 | 高 |

虽然这是一个本地优先应用，但 Next.js 的 API Routes 可以用于：
- 代理 AI API 调用（隐藏 API Key）
- 处理 PDF 解析等重计算
- 未来可扩展为 SaaS

```typescript
// app/api/ai/suggest/route.ts
export async function POST(request: Request) {
  const { sentence, context } = await request.json();
  
  const response = await fetch('https://ark.cn-beijing.volces.com/api/v3/chat/completions', {
    headers: {
      'Authorization': `Bearer ${process.env.DOUBAO_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'doubao-pro-32k',
      messages: [
        { role: 'system', content: '你是一个写作润色助手...' },
        { role: 'user', content: `请润色这句话：${sentence}\n\n上下文：${context}` }
      ],
      stream: true,
    }),
  });
  
  return new Response(response.body, {
    headers: { 'Content-Type': 'text/event-stream' },
  });
}
```

### 2. 编辑器：Tiptap (ProseMirror)

**编辑器选型对比**

| 编辑器 | 优点 | 缺点 | 适合场景 |
|--------|------|------|----------|
| **Tiptap** | 高度可扩展、React 友好 | 学习曲线 | 复杂富文本 |
| Milkdown | Markdown 优先 | 社区较小 | 纯 Markdown |
| BlockNote | 类 Notion 块编辑 | 定制性有限 | 快速原型 |
| Lexical | Meta 出品、性能好 | API 复杂 | 大规模应用 |

选择 Tiptap 的原因：
1. **所见即所得 Markdown**：用户写 Markdown 语法，实时渲染
2. **扩展系统**：可自定义 AI 交互节点
3. **React 集成**：`@tiptap/react` 开箱即用

```typescript
// 编辑器配置
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Markdown from 'tiptap-markdown';
import CodeBlockLowlight from '@tiptap/extension-code-block-lowlight';

const Editor = () => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Markdown.configure({
        html: false,
        transformPastedText: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
      }),
    ],
    content: '',
    onUpdate: ({ editor }) => {
      // 自动保存 + Proactive 触发
      debouncedSave(editor.storage.markdown.getMarkdown());
      checkForProactiveSuggestion(editor);
    },
  });
  
  return <EditorContent editor={editor} />;
};
```

### 3. 本地存储：File System Access API

**为什么不用 IndexedDB 存文档？**

| 方案 | 文件格式 | 跨应用访问 | 容量限制 |
|------|----------|------------|----------|
| IndexedDB | 二进制 blob | ❌ | ~50MB-几GB |
| LocalStorage | 字符串 | ❌ | 5MB |
| **File System Access** | 原生文件 | ✅ | 无限制 |

File System Access API 让 Web 应用可以读写本地文件夹：

```typescript
// 请求文件夹访问权限
const requestDirectoryAccess = async () => {
  const handle = await window.showDirectoryPicker({
    mode: 'readwrite',
    startIn: 'documents',
  });
  
  // 持久化权限
  await handle.requestPermission({ mode: 'readwrite' });
  
  // 保存 handle 到 IndexedDB 供下次使用
  await saveHandleToIDB(handle);
  
  return handle;
};

// 写入文件
const saveDocument = async (handle: FileSystemDirectoryHandle, path: string, content: string) => {
  const parts = path.split('/');
  let current = handle;
  
  // 创建子目录
  for (const part of parts.slice(0, -1)) {
    current = await current.getDirectoryHandle(part, { create: true });
  }
  
  // 写入文件
  const fileHandle = await current.getFileHandle(parts.at(-1)!, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(content);
  await writable.close();
};
```

**目录结构设计**

```
~/myWriteAssistant-data/
├── documents/           # 收藏的原始文档
│   ├── web/            # 网页文章
│   │   └── abc123.md
│   ├── pdf/            # PDF 转换
│   │   └── def456.md
│   └── imports/        # 直接导入
├── summaries/          # AI 生成的摘要
│   └── abc123-summary.md
├── drafts/             # 写作草稿
│   └── my-article.md
└── index.json          # 文档索引
```

### 4. AI 集成：豆包 API

豆包 API 兼容 OpenAI 格式，接入成本低：

```typescript
// lib/ai/doubao.ts
import OpenAI from 'openai';

export const doubao = new OpenAI({
  apiKey: process.env.DOUBAO_API_KEY,
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
});

// 流式润色建议
export async function* streamSuggestion(sentence: string, context: string) {
  const stream = await doubao.chat.completions.create({
    model: 'doubao-pro-32k',
    messages: [
      {
        role: 'system',
        content: `你是一个专业的中文写作助手。用户会给你一个句子和上下文，请给出更流畅、更有表现力的改写建议。
        
规则：
1. 保持原意不变
2. 改写幅度适中，不要完全重写
3. 保持与上下文的风格一致
4. 直接输出改写后的句子，不要解释`,
      },
      {
        role: 'user',
        content: `句子：${sentence}\n\n上下文：${context}`,
      },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    yield chunk.choices[0]?.delta?.content || '';
  }
}
```

### 5. 状态管理：Zustand

轻量、无 Provider、TypeScript 友好：

```typescript
// store/editor.ts
import { create } from 'zustand';

interface EditorState {
  // 文档状态
  currentDocument: Document | null;
  isDirty: boolean;
  
  // AI 助手状态
  assistantMode: 'proactive' | 'chat';
  proactiveState: {
    currentSentence: string;
    suggestion: string | null;
    status: 'idle' | 'analyzing' | 'generating' | 'ready';
  };
  
  // Actions
  setDocument: (doc: Document) => void;
  switchMode: (mode: 'proactive' | 'chat') => void;
  updateProactiveSuggestion: (suggestion: string) => void;
  acceptSuggestion: () => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  currentDocument: null,
  isDirty: false,
  assistantMode: 'proactive',
  proactiveState: {
    currentSentence: '',
    suggestion: null,
    status: 'idle',
  },
  
  setDocument: (doc) => set({ currentDocument: doc, isDirty: false }),
  
  switchMode: (mode) => set({ assistantMode: mode }),
  
  updateProactiveSuggestion: (suggestion) => 
    set((state) => ({
      proactiveState: { ...state.proactiveState, suggestion, status: 'ready' },
    })),
    
  acceptSuggestion: () => {
    const { proactiveState } = get();
    // 触发编辑器替换...
    set((state) => ({
      proactiveState: { ...state.proactiveState, suggestion: null, status: 'idle' },
    }));
  },
}));
```

---

## Proactive 模式核心实现

这是本项目最有特色的功能：**AI 实时观察写作，延迟给出句子级建议**。

### 流程设计

```
用户输入 → 防抖 1.5s → 提取最后完整句子 → 调用 AI → 显示建议 → 等待用户决策
    ↑                                                              │
    └──────────────────────────────────────────────────────────────┘
                              用户继续输入时清除建议
```

### 核心代码

```typescript
// hooks/useProactive.ts
import { useEffect, useRef } from 'react';
import { useEditorStore } from '@/store/editor';
import { useDebouncedCallback } from 'use-debounce';

export function useProactive(editor: Editor | null) {
  const { assistantMode, proactiveState, updateProactiveSuggestion } = useEditorStore();
  const abortControllerRef = useRef<AbortController | null>(null);
  
  // 提取最后一个完整句子
  const extractLastSentence = (text: string): string | null => {
    const sentences = text.match(/[^。！？.!?]*[。！？.!?]/g);
    return sentences?.at(-1)?.trim() || null;
  };
  
  // 防抖处理
  const debouncedAnalyze = useDebouncedCallback(async (text: string) => {
    if (assistantMode !== 'proactive') return;
    
    const sentence = extractLastSentence(text);
    if (!sentence || sentence.length < 10) return;
    
    // 取消之前的请求
    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();
    
    try {
      const response = await fetch('/api/ai/suggest', {
        method: 'POST',
        body: JSON.stringify({ 
          sentence, 
          context: text.slice(-500) // 最近 500 字作为上下文
        }),
        signal: abortControllerRef.current.signal,
      });
      
      // 流式读取
      const reader = response.body?.getReader();
      let suggestion = '';
      
      while (true) {
        const { done, value } = await reader!.read();
        if (done) break;
        suggestion += new TextDecoder().decode(value);
        updateProactiveSuggestion(suggestion);
      }
    } catch (e) {
      if (e.name !== 'AbortError') console.error(e);
    }
  }, 1500);
  
  useEffect(() => {
    if (!editor) return;
    
    const handleUpdate = () => {
      const text = editor.getText();
      debouncedAnalyze(text);
    };
    
    editor.on('update', handleUpdate);
    return () => editor.off('update', handleUpdate);
  }, [editor, debouncedAnalyze]);
}
```

---

## 性能优化要点

遵循 Vercel React Best Practices：

### 1. 编辑器动态加载

```typescript
// 避免首屏加载 Tiptap 的大包
import dynamic from 'next/dynamic';

const Editor = dynamic(() => import('@/components/Editor'), {
  ssr: false,
  loading: () => <EditorSkeleton />,
});
```

### 2. AI 请求去重

```typescript
// 使用 SWR 管理 Chat 模式的请求
import useSWR from 'swr';

const { data: chatHistory } = useSWR(
  ['chat', documentId],
  () => fetchChatHistory(documentId),
  { dedupingInterval: 5000 }
);
```

### 3. 虚拟列表

```typescript
// 文档库使用 virtua 虚拟化
import { VList } from 'virtua';

const DocumentList = ({ documents }) => (
  <VList style={{ height: '100%' }}>
    {documents.map((doc) => (
      <DocumentCard key={doc.id} document={doc} />
    ))}
  </VList>
);
```

---

## 项目结构

```
myWriteAssistant/
├── app/
│   ├── layout.tsx
│   ├── page.tsx              # 编辑器主页
│   ├── library/
│   │   └── page.tsx          # 文档库
│   └── api/
│       ├── ai/
│       │   ├── suggest/route.ts
│       │   └── summarize/route.ts
│       └── parse/
│           └── pdf/route.ts
├── components/
│   ├── Editor/
│   ├── Sidebar/
│   ├── AIPanel/
│   └── ui/                   # shadcn/ui 组件
├── lib/
│   ├── ai/
│   │   └── doubao.ts
│   ├── storage/
│   │   ├── filesystem.ts
│   │   └── indexeddb.ts
│   └── utils/
├── store/
│   ├── editor.ts
│   └── documents.ts
└── hooks/
    ├── useProactive.ts
    └── useFileSystem.ts
```

---

## 下一步

这篇文章介绍了整体架构和核心选型。下一篇将深入：

1. Tiptap 编辑器的自定义扩展开发
2. File System Access API 的完整封装
3. 摘要生成和向量检索的实现

代码已开源，欢迎关注项目进展。

---

*技术栈：Next.js 14 + React 18 + TypeScript + Tiptap + Tailwind CSS + shadcn/ui + Zustand*
