# Phase 2: 编辑器核心 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现所见即所得 Markdown 编辑器，支持实时渲染、代码高亮、大纲导航和自动保存

**Architecture:** 
- Tiptap (ProseMirror) 作为编辑器核心，提供扩展性强的所见即所得编辑体验
- Shiki 用于代码语法高亮，支持多语言
- 自动保存使用防抖机制 (2秒)，通过 File System Access API 写入本地文件
- 大纲导航通过解析文档结构自动生成

**Tech Stack:** Tiptap, @tiptap/extension-*, Shiki, React, Zustand

**Design Reference:** Stitch Project ID: `1840683527876412125`

---

## Task 1: 安装 Tiptap 编辑器依赖

**Files:**
- Modify: `package.json`

**Step 1: 安装 Tiptap 核心和扩展包**

Run:
```bash
cd /Users/litianyi/Documents/Code/_ai-goods/myWriteAssistant
npm install @tiptap/react @tiptap/pm @tiptap/starter-kit @tiptap/extension-placeholder @tiptap/extension-typography @tiptap/extension-link @tiptap/extension-code-block-lowlight @tiptap/extension-highlight @tiptap/extension-task-list @tiptap/extension-task-item
```

Expected: Packages added to dependencies

**Step 2: 安装代码高亮依赖**

Run:
```bash
npm install lowlight highlight.js
```

Expected: lowlight and highlight.js installed

**Step 3: 提交依赖更新**

Run:
```bash
git add -A && git commit -m "chore: add Tiptap editor dependencies"
```

---

## Task 2: 创建 Tiptap 编辑器组件

**Files:**
- Create: `src/components/editor/tiptap-editor.tsx`
- Create: `src/components/editor/editor-content.tsx`

**Step 1: 创建编辑器内容组件**

Create file `src/components/editor/editor-content.tsx`:

```typescript
"use client";

import { EditorContent as TiptapEditorContent, Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";

interface EditorContentProps {
  editor: Editor | null;
  className?: string;
}

export function EditorContent({ editor, className }: EditorContentProps) {
  return (
    <TiptapEditorContent
      editor={editor}
      className={cn(
        "prose prose-slate dark:prose-invert max-w-none",
        "prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl",
        "prose-p:leading-7 prose-p:my-4",
        "prose-a:text-primary prose-a:underline-offset-4 hover:prose-a:underline",
        "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-sm",
        "prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg",
        "prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:italic",
        "prose-ul:list-disc prose-ol:list-decimal",
        "prose-li:my-1",
        "focus:outline-none",
        className
      )}
    />
  );
}
```

**Step 2: 创建 Tiptap 编辑器主组件**

Create file `src/components/editor/tiptap-editor.tsx`:

```typescript
"use client";

import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { useCallback, useEffect, useRef } from "react";
import { EditorContent } from "./editor-content";
import { useEditorStore } from "@/stores/editor-store";

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

interface TiptapEditorProps {
  onUpdate?: (content: string) => void;
  autosaveDelay?: number;
}

export function TiptapEditor({
  onUpdate,
  autosaveDelay = 2000,
}: TiptapEditorProps) {
  const { currentDocContent, updateContent } = useEditorStore();
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We use CodeBlockLowlight instead
      }),
      Placeholder.configure({
        placeholder: "开始写作...",
        emptyEditorClass: "is-editor-empty",
      }),
      Typography,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4",
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "javascript",
        HTMLAttributes: {
          class: "not-prose bg-muted border rounded-lg p-4 my-4 overflow-x-auto",
        },
      }),
    ],
    content: currentDocContent || "",
    editorProps: {
      attributes: {
        class: "min-h-[calc(100vh-14rem)] outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown?.getMarkdown?.() || editor.getText();
      const html = editor.getHTML();
      
      // Update store
      updateContent(html);
      
      // Trigger autosave with debounce
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      
      autosaveTimerRef.current = setTimeout(() => {
        onUpdate?.(html);
      }, autosaveDelay);
    },
  });

  // Sync content from store to editor when document changes
  useEffect(() => {
    if (editor && currentDocContent !== editor.getHTML()) {
      editor.commands.setContent(currentDocContent || "");
    }
  }, [editor, currentDocContent]);

  // Cleanup autosave timer
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full">
      <EditorContent editor={editor} />
    </div>
  );
}
```

**Step 3: 提交编辑器组件**

Run:
```bash
git add -A && git commit -m "feat: create Tiptap editor component with extensions"
```

---

## Task 3: 集成编辑器到主布局

**Files:**
- Modify: `src/components/layout/main-editor.tsx`

**Step 1: 更新 MainEditor 使用 Tiptap**

Replace content of `src/components/layout/main-editor.tsx`:

```typescript
"use client";

import dynamic from "next/dynamic";
import { useEditorStore } from "@/stores/editor-store";
import { useFileSystem } from "@/hooks/use-file-system";
import { useCallback } from "react";

// Dynamic import to avoid SSR issues with Tiptap
const TiptapEditor = dynamic(
  () => import("@/components/editor/tiptap-editor").then((mod) => mod.TiptapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">加载编辑器中…</div>
      </div>
    ),
  }
);

export function MainEditor() {
  const { currentDocId, currentDocTitle, markSaved } = useEditorStore();
  const { writeFile, isConnected } = useFileSystem();

  const handleAutoSave = useCallback(
    async (content: string) => {
      if (!isConnected || !currentDocId) return;

      const filename = `drafts/${currentDocId}.html`;
      const success = await writeFile(filename, content);
      
      if (success) {
        markSaved();
      }
    },
    [isConnected, currentDocId, writeFile, markSaved]
  );

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-background">
      <div className="flex-1 overflow-auto p-8">
        <article className="max-w-3xl mx-auto">
          <TiptapEditor onUpdate={handleAutoSave} autosaveDelay={2000} />
        </article>
      </div>
    </main>
  );
}
```

**Step 2: 验证编辑器正常工作**

Run:
```bash
source ~/.nvm/nvm.sh && nvm use 22 && npm run dev
```

Expected: 编辑器加载正常，可以输入 Markdown 格式内容

**Step 3: 提交布局集成**

Run:
```bash
git add -A && git commit -m "feat: integrate Tiptap editor into main layout"
```

---

## Task 4: 添加编辑器工具栏

**Files:**
- Create: `src/components/editor/editor-toolbar.tsx`
- Modify: `src/components/editor/tiptap-editor.tsx`

**Step 1: 创建编辑器工具栏组件**

Create file `src/components/editor/editor-toolbar.tsx`:

```typescript
"use client";

import { Editor } from "@tiptap/react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Minus,
  Link as LinkIcon,
  Highlighter,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface EditorToolbarProps {
  editor: Editor | null;
}

interface ToolbarButtonProps {
  onClick: () => void;
  isActive?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
  tooltip: string;
}

function ToolbarButton({
  onClick,
  isActive,
  disabled,
  children,
  tooltip,
}: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            "h-8 w-8 p-0",
            isActive && "bg-muted text-primary"
          )}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>
        <p>{tooltip}</p>
      </TooltipContent>
    </Tooltip>
  );
}

export function EditorToolbar({ editor }: EditorToolbarProps) {
  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);

    if (url === null) return;

    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-0.5 p-1 border-b bg-muted/30 flex-wrap">
        {/* Undo/Redo */}
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          tooltip="撤销"
        >
          <Undo className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          tooltip="重做"
        >
          <Redo className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Text formatting */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive("bold")}
          tooltip="粗体 (⌘B)"
        >
          <Bold className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive("italic")}
          tooltip="斜体 (⌘I)"
        >
          <Italic className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive("strike")}
          tooltip="删除线"
        >
          <Strikethrough className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleCode().run()}
          isActive={editor.isActive("code")}
          tooltip="行内代码"
        >
          <Code className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHighlight().run()}
          isActive={editor.isActive("highlight")}
          tooltip="高亮"
        >
          <Highlighter className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Headings */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          isActive={editor.isActive("heading", { level: 1 })}
          tooltip="标题 1"
        >
          <Heading1 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          isActive={editor.isActive("heading", { level: 2 })}
          tooltip="标题 2"
        >
          <Heading2 className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          isActive={editor.isActive("heading", { level: 3 })}
          tooltip="标题 3"
        >
          <Heading3 className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Lists */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          isActive={editor.isActive("bulletList")}
          tooltip="无序列表"
        >
          <List className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          isActive={editor.isActive("orderedList")}
          tooltip="有序列表"
        >
          <ListOrdered className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleTaskList().run()}
          isActive={editor.isActive("taskList")}
          tooltip="任务列表"
        >
          <ListTodo className="h-4 w-4" />
        </ToolbarButton>

        <Separator orientation="vertical" className="mx-1 h-6" />

        {/* Block elements */}
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          isActive={editor.isActive("blockquote")}
          tooltip="引用"
        >
          <Quote className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          tooltip="分隔线"
        >
          <Minus className="h-4 w-4" />
        </ToolbarButton>
        <ToolbarButton
          onClick={setLink}
          isActive={editor.isActive("link")}
          tooltip="链接"
        >
          <LinkIcon className="h-4 w-4" />
        </ToolbarButton>
      </div>
    </TooltipProvider>
  );
}
```

**Step 2: 更新 TiptapEditor 包含工具栏**

Modify `src/components/editor/tiptap-editor.tsx`, 在 return 语句中添加工具栏：

在 `return` 语句前添加 import:
```typescript
import { EditorToolbar } from "./editor-toolbar";
```

更新 return 语句:
```typescript
  return (
    <div className="w-full border rounded-lg overflow-hidden">
      <EditorToolbar editor={editor} />
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
```

**Step 3: 提交工具栏**

Run:
```bash
git add -A && git commit -m "feat: add editor toolbar with formatting buttons"
```

---

## Task 5: 实现大纲导航 (TOC)

**Files:**
- Create: `src/components/editor/table-of-contents.tsx`
- Modify: `src/components/layout/main-editor.tsx`

**Step 1: 创建 TOC 组件**

Create file `src/components/editor/table-of-contents.tsx`:

```typescript
"use client";

import { Editor } from "@tiptap/react";
import { useEffect, useState } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

interface TocItem {
  id: string;
  level: number;
  text: string;
}

interface TableOfContentsProps {
  editor: Editor | null;
}

export function TableOfContents({ editor }: TableOfContentsProps) {
  const [items, setItems] = useState<TocItem[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!editor) return;

    const updateToc = () => {
      const headings: TocItem[] = [];
      const { doc } = editor.state;

      doc.descendants((node, pos) => {
        if (node.type.name === "heading") {
          const id = `heading-${pos}`;
          headings.push({
            id,
            level: node.attrs.level as number,
            text: node.textContent,
          });
        }
      });

      setItems(headings);
    };

    // Initial update
    updateToc();

    // Listen for changes
    editor.on("update", updateToc);

    return () => {
      editor.off("update", updateToc);
    };
  }, [editor]);

  const scrollToHeading = (item: TocItem) => {
    if (!editor) return;

    const { doc } = editor.state;
    let targetPos = 0;

    doc.descendants((node, pos) => {
      if (node.type.name === "heading" && `heading-${pos}` === item.id) {
        targetPos = pos;
        return false;
      }
    });

    if (targetPos > 0) {
      editor.chain().focus().setTextSelection(targetPos).run();
      setActiveId(item.id);
    }
  };

  if (items.length === 0) {
    return (
      <div className="text-sm text-muted-foreground p-4">
        暂无标题
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <nav className="p-4 space-y-1">
        <h3 className="text-sm font-medium mb-3">大纲</h3>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => scrollToHeading(item)}
            className={cn(
              "block w-full text-left text-sm py-1 px-2 rounded transition-colors",
              "hover:bg-muted truncate",
              item.level === 1 && "font-medium",
              item.level === 2 && "pl-4",
              item.level === 3 && "pl-6 text-muted-foreground",
              item.level === 4 && "pl-8 text-muted-foreground text-xs",
              activeId === item.id && "bg-primary/10 text-primary"
            )}
          >
            {item.text || "(空标题)"}
          </button>
        ))}
      </nav>
    </ScrollArea>
  );
}
```

**Step 2: 创建编辑器 Context 以共享 editor 实例**

Create file `src/components/editor/editor-context.tsx`:

```typescript
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Editor } from "@tiptap/react";

interface EditorContextType {
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [editor, setEditor] = useState<Editor | null>(null);

  return (
    <EditorContext.Provider value={{ editor, setEditor }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext() {
  const context = useContext(EditorContext);
  if (!context) {
    throw new Error("useEditorContext must be used within an EditorProvider");
  }
  return context;
}
```

**Step 3: 更新 TiptapEditor 注册到 Context**

在 `src/components/editor/tiptap-editor.tsx` 中添加:

添加 import:
```typescript
import { useEditorContext } from "./editor-context";
```

在 `useEditor` 后添加:
```typescript
  const { setEditor } = useEditorContext();

  useEffect(() => {
    setEditor(editor);
    return () => setEditor(null);
  }, [editor, setEditor]);
```

**Step 4: 提交 TOC 组件**

Run:
```bash
git add -A && git commit -m "feat: add table of contents navigation"
```

---

## Task 6: 添加 Markdown 输入/输出支持

**Files:**
- Modify: `package.json` (add tiptap-markdown)
- Modify: `src/components/editor/tiptap-editor.tsx`

**Step 1: 安装 Markdown 扩展**

Run:
```bash
npm install tiptap-markdown
```

**Step 2: 更新编辑器配置**

在 `src/components/editor/tiptap-editor.tsx` 中添加 Markdown 扩展:

添加 import:
```typescript
import { Markdown } from "tiptap-markdown";
```

在 extensions 数组中添加:
```typescript
      Markdown.configure({
        html: true,
        transformCopiedText: true,
        transformPastedText: true,
      }),
```

**Step 3: 更新自动保存使用 Markdown 格式**

修改 onUpdate 回调:
```typescript
    onUpdate: ({ editor }) => {
      const markdown = editor.storage.markdown?.getMarkdown() || "";
      
      // Update store with HTML for rendering
      updateContent(editor.getHTML());
      
      // Trigger autosave with Markdown
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      
      autosaveTimerRef.current = setTimeout(() => {
        onUpdate?.(markdown);
      }, autosaveDelay);
    },
```

**Step 4: 提交 Markdown 支持**

Run:
```bash
git add -A && git commit -m "feat: add Markdown import/export support"
```

---

## Task 7: 实现文档 CRUD 功能

**Files:**
- Modify: `src/stores/editor-store.ts`
- Create: `src/hooks/use-document.ts`

**Step 1: 扩展 Editor Store**

更新 `src/stores/editor-store.ts`:

```typescript
import { create } from 'zustand';

export interface Document {
  id: string;
  title: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
}

interface EditorState {
  // Current document
  currentDocId: string | null;
  currentDocTitle: string;
  currentDocContent: string;
  
  // Document state
  isDirty: boolean;
  lastSaved: Date | null;
  
  // Recent documents
  recentDocs: Array<{ id: string; title: string; updatedAt: Date }>;
  
  // Actions
  setCurrentDoc: (id: string | null, title: string, content: string) => void;
  updateContent: (content: string) => void;
  updateTitle: (title: string) => void;
  markSaved: () => void;
  newDocument: () => void;
  addRecentDoc: (doc: { id: string; title: string; updatedAt: Date }) => void;
}

export const useEditorStore = create<EditorState>((set, get) => ({
  currentDocId: null,
  currentDocTitle: 'Untitled',
  currentDocContent: '',
  isDirty: false,
  lastSaved: null,
  recentDocs: [],
  
  setCurrentDoc: (id, title, content) => set({
    currentDocId: id,
    currentDocTitle: title,
    currentDocContent: content,
    isDirty: false,
  }),
  
  updateContent: (content) => set({
    currentDocContent: content,
    isDirty: true,
  }),
  
  updateTitle: (title) => set({
    currentDocTitle: title,
    isDirty: true,
  }),
  
  markSaved: () => {
    const { currentDocId, currentDocTitle, addRecentDoc } = get();
    const now = new Date();
    
    set({
      isDirty: false,
      lastSaved: now,
    });
    
    if (currentDocId) {
      addRecentDoc({ id: currentDocId, title: currentDocTitle, updatedAt: now });
    }
  },
  
  newDocument: () => {
    const id = `doc-${Date.now()}`;
    set({
      currentDocId: id,
      currentDocTitle: 'Untitled',
      currentDocContent: '',
      isDirty: false,
      lastSaved: null,
    });
  },
  
  addRecentDoc: (doc) => set((state) => {
    const filtered = state.recentDocs.filter((d) => d.id !== doc.id);
    return {
      recentDocs: [doc, ...filtered].slice(0, 10), // Keep only 10 recent docs
    };
  }),
}));
```

**Step 2: 创建 Document Hook**

Create file `src/hooks/use-document.ts`:

```typescript
"use client";

import { useCallback } from "react";
import { useEditorStore } from "@/stores/editor-store";
import { useFileSystem } from "./use-file-system";

export function useDocument() {
  const {
    currentDocId,
    currentDocTitle,
    currentDocContent,
    isDirty,
    setCurrentDoc,
    updateTitle,
    markSaved,
    newDocument,
  } = useEditorStore();
  
  const { readFile, writeFile, listDir, isConnected } = useFileSystem();

  const saveDocument = useCallback(async () => {
    if (!isConnected || !currentDocId) return false;

    const filename = `drafts/${currentDocId}.md`;
    const frontmatter = `---
title: ${currentDocTitle}
updatedAt: ${new Date().toISOString()}
---

`;
    const success = await writeFile(filename, frontmatter + currentDocContent);
    
    if (success) {
      markSaved();
    }
    
    return success;
  }, [isConnected, currentDocId, currentDocTitle, currentDocContent, writeFile, markSaved]);

  const loadDocument = useCallback(async (docId: string) => {
    if (!isConnected) return false;

    const filename = `drafts/${docId}.md`;
    const content = await readFile(filename);
    
    if (content) {
      // Parse frontmatter
      const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
      
      if (frontmatterMatch) {
        const frontmatter = frontmatterMatch[1];
        const bodyContent = frontmatterMatch[2];
        const titleMatch = frontmatter.match(/title:\s*(.+)/);
        const title = titleMatch ? titleMatch[1].trim() : "Untitled";
        
        setCurrentDoc(docId, title, bodyContent);
      } else {
        setCurrentDoc(docId, "Untitled", content);
      }
      
      return true;
    }
    
    return false;
  }, [isConnected, readFile, setCurrentDoc]);

  const listDocuments = useCallback(async () => {
    if (!isConnected) return [];

    const files = await listDir("drafts");
    return files
      .filter((f) => f.kind === "file" && f.name.endsWith(".md"))
      .map((f) => ({
        id: f.name.replace(".md", ""),
        name: f.name,
      }));
  }, [isConnected, listDir]);

  const createNewDocument = useCallback(() => {
    newDocument();
  }, [newDocument]);

  return {
    currentDocId,
    currentDocTitle,
    isDirty,
    saveDocument,
    loadDocument,
    listDocuments,
    createNewDocument,
    updateTitle,
  };
}
```

**Step 3: 提交 CRUD 功能**

Run:
```bash
git add -A && git commit -m "feat: add document CRUD operations"
```

---

## Task 8: 完善工具栏功能绑定

**Files:**
- Modify: `src/components/layout/toolbar.tsx`

**Step 1: 更新 Toolbar 绑定真实功能**

更新 `src/components/layout/toolbar.tsx` 中的按钮事件:

添加 import:
```typescript
import { useDocument } from "@/hooks/use-document";
```

在组件中添加:
```typescript
  const { createNewDocument, saveDocument, isDirty } = useDocument();

  const handleNew = () => {
    if (isDirty) {
      if (window.confirm("当前文档未保存，确定创建新文档？")) {
        createNewDocument();
      }
    } else {
      createNewDocument();
    }
  };

  const handleSave = async () => {
    await saveDocument();
  };
```

更新按钮 onClick:
- 新建文档按钮: `onClick={handleNew}`
- 保存按钮: `onClick={handleSave}`

**Step 2: 提交工具栏绑定**

Run:
```bash
git add -A && git commit -m "feat: bind toolbar buttons to document operations"
```

---

## Task 9: 最终验证和完善

**Step 1: 运行完整验证**

Run:
```bash
source ~/.nvm/nvm.sh && nvm use 22 && npm run dev
```

验证清单：
- [ ] 编辑器加载正常
- [ ] 可以输入文字，实时渲染 Markdown
- [ ] 工具栏按钮功能正常（加粗、斜体、标题等）
- [ ] 代码块语法高亮正常
- [ ] 大纲导航显示标题
- [ ] 自动保存功能工作
- [ ] 新建/保存文档功能正常

**Step 2: 运行 lint 检查**

Run:
```bash
npm run lint
```

Expected: No errors

**Step 3: 最终提交**

Run:
```bash
git add -A && git commit -m "feat: complete Phase 2 - WYSIWYG Markdown editor"
```

**Step 4: 创建 Phase 2 完成标签**

Run:
```bash
git tag -a v0.2.0-phase2 -m "Phase 2 Complete: WYSIWYG Markdown editor with Tiptap"
```

---

## Phase 2 验收标准

完成后应满足：

| 功能 | 状态 |
|------|------|
| Tiptap 编辑器集成 | ✅ |
| 所见即所得 Markdown 编辑 | ✅ |
| 编辑器工具栏 | ✅ |
| 代码高亮 (Lowlight) | ✅ |
| 大纲导航 (TOC) | ✅ |
| 自动保存 (2秒防抖) | ✅ |
| 文档 CRUD 功能 | ✅ |
| Markdown 导入/导出 | ✅ |

---

## 下一步：Phase 3

Phase 2 完成后，继续 Phase 3：文档收藏系统
- 网页内容抓取和保存
- PDF 文件导入和解析
- 标签系统和分类管理
- 全文搜索功能
- AI 摘要生成和缓存
