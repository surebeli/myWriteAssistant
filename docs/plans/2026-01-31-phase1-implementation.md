# Phase 1: 基础框架搭建 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 搭建可运行的 Next.js 项目骨架，实现三段式响应式布局和基础功能

**Architecture:** 
- Next.js 14 App Router + TypeScript + Tailwind CSS + shadcn/ui
- 三段式布局: Sidebar (240px) + MainEditor (flex-1) + AIPanel (360px)
- File System Access API 用于本地文件存储
- Zustand 用于状态管理
- next-themes 用于深色/浅色模式

**Tech Stack:** Next.js 14, TypeScript, Tailwind CSS, shadcn/ui, Zustand, next-themes

**Design Reference:** Stitch Project ID: `1840683527876412125`, Theme: `#4725f4`

---

## Task 1: 初始化 Next.js 项目

**Files:**
- Create: `package.json`, `tsconfig.json`, `tailwind.config.ts`, `next.config.ts`
- Create: `src/app/layout.tsx`, `src/app/page.tsx`, `src/app/globals.css`

**Step 1: 创建 Next.js 项目**

Run:
```bash
cd /Users/litianyi/Documents/Code/_ai-goods/myWriteAssistant
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

When prompted:
- Would you like to use Tailwind CSS? → Yes
- Would you like to use `src/` directory? → Yes  
- Would you like to customize the default import alias? → No (use @/*)

Expected: Project files created, dependencies installed

**Step 2: 验证项目创建成功**

Run:
```bash
cd /Users/litianyi/Documents/Code/_ai-goods/myWriteAssistant && pnpm dev
```

Expected: Server starts at http://localhost:3000, Next.js welcome page shows

**Step 3: 停止开发服务器，提交初始化**

Run:
```bash
git add -A && git commit -m "chore: initialize Next.js 14 project with TypeScript and Tailwind"
```

Expected: Clean commit with project scaffolding

---

## Task 2: 安装和配置 shadcn/ui

**Files:**
- Modify: `tailwind.config.ts`
- Create: `src/lib/utils.ts`
- Create: `components.json`

**Step 1: 初始化 shadcn/ui**

Run:
```bash
cd /Users/litianyi/Documents/Code/_ai-goods/myWriteAssistant
pnpm dlx shadcn@latest init
```

When prompted:
- Which style would you like to use? → New York
- Which color would you like to use as base color? → Slate
- Do you want to use CSS variables for colors? → Yes

Expected: `components.json` created, `tailwind.config.ts` updated

**Step 2: 更新主题色为设计稿配色**

Modify `src/app/globals.css`, 在 `:root` 中更新 primary 颜色：

```css
:root {
  /* ... existing vars ... */
  --primary: 248 76% 55%; /* #4725f4 - Design theme color */
  --primary-foreground: 0 0% 100%;
}

.dark {
  /* ... existing vars ... */
  --primary: 248 76% 65%; /* Lighter for dark mode */
  --primary-foreground: 0 0% 100%;
}
```

**Step 3: 安装常用组件**

Run:
```bash
pnpm dlx shadcn@latest add button card input scroll-area separator tabs tooltip
```

Expected: Components installed to `src/components/ui/`

**Step 4: 验证 shadcn/ui 安装**

Run:
```bash
ls src/components/ui/
```

Expected: `button.tsx`, `card.tsx`, `input.tsx`, etc.

**Step 5: 提交 shadcn/ui 配置**

Run:
```bash
git add -A && git commit -m "chore: configure shadcn/ui with design theme color #4725f4"
```

---

## Task 3: 安装 next-themes 并配置深色模式

**Files:**
- Create: `src/components/providers/theme-provider.tsx`
- Modify: `src/app/layout.tsx`

**Step 1: 安装 next-themes**

Run:
```bash
pnpm add next-themes
```

Expected: Package added to dependencies

**Step 2: 创建 ThemeProvider 组件**

Create file `src/components/providers/theme-provider.tsx`:

```typescript
"use client";

import * as React from "react";
import { ThemeProvider as NextThemesProvider } from "next-themes";

export function ThemeProvider({
  children,
  ...props
}: React.ComponentProps<typeof NextThemesProvider>) {
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}
```

**Step 3: 更新 layout.tsx 使用 ThemeProvider**

Replace content of `src/app/layout.tsx`:

```typescript
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "MyWriteAssistant",
  description: "Personal writing assistant with AI-powered Proactive mode",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <meta name="color-scheme" content="light dark" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

**Step 4: 验证深色模式工作**

Run:
```bash
pnpm dev
```

在浏览器开发者工具中切换 `prefers-color-scheme`，验证页面响应正确

**Step 5: 提交深色模式配置**

Run:
```bash
git add -A && git commit -m "feat: add dark/light mode support with next-themes"
```

---

## Task 4: 安装 Zustand 状态管理

**Files:**
- Create: `src/stores/app-store.ts`
- Create: `src/stores/editor-store.ts`

**Step 1: 安装 Zustand**

Run:
```bash
pnpm add zustand
```

Expected: Package added to dependencies

**Step 2: 创建 App Store (UI 状态)**

Create file `src/stores/app-store.ts`:

```typescript
import { create } from 'zustand';

type AssistantMode = 'proactive' | 'chat';

interface AppState {
  // Sidebar state
  sidebarOpen: boolean;
  toggleSidebar: () => void;
  
  // AI Panel state
  aiPanelOpen: boolean;
  toggleAIPanel: () => void;
  
  // Assistant mode
  assistantMode: AssistantMode;
  setAssistantMode: (mode: AssistantMode) => void;
  
  // Current view
  currentView: 'editor' | 'library';
  setCurrentView: (view: 'editor' | 'library') => void;
}

export const useAppStore = create<AppState>((set) => ({
  // Sidebar - open by default
  sidebarOpen: true,
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  
  // AI Panel - open by default
  aiPanelOpen: true,
  toggleAIPanel: () => set((state) => ({ aiPanelOpen: !state.aiPanelOpen })),
  
  // Assistant mode - proactive by default
  assistantMode: 'proactive',
  setAssistantMode: (mode) => set({ assistantMode: mode }),
  
  // Current view
  currentView: 'editor',
  setCurrentView: (view) => set({ currentView: view }),
}));
```

**Step 3: 创建 Editor Store (编辑器状态)**

Create file `src/stores/editor-store.ts`:

```typescript
import { create } from 'zustand';

interface EditorState {
  // Current document
  currentDocId: string | null;
  currentDocTitle: string;
  currentDocContent: string;
  
  // Document state
  isDirty: boolean;
  lastSaved: Date | null;
  
  // Actions
  setCurrentDoc: (id: string | null, title: string, content: string) => void;
  updateContent: (content: string) => void;
  markSaved: () => void;
  newDocument: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  currentDocId: null,
  currentDocTitle: 'Untitled',
  currentDocContent: '',
  isDirty: false,
  lastSaved: null,
  
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
  
  markSaved: () => set({
    isDirty: false,
    lastSaved: new Date(),
  }),
  
  newDocument: () => set({
    currentDocId: null,
    currentDocTitle: 'Untitled',
    currentDocContent: '',
    isDirty: false,
    lastSaved: null,
  }),
}));
```

**Step 4: 提交 Zustand stores**

Run:
```bash
git add -A && git commit -m "feat: add Zustand stores for app and editor state"
```

---

## Task 5: 实现三段式布局骨架

**Files:**
- Create: `src/components/layout/sidebar.tsx`
- Create: `src/components/layout/main-editor.tsx`
- Create: `src/components/layout/ai-panel.tsx`
- Create: `src/components/layout/toolbar.tsx`
- Create: `src/components/layout/status-bar.tsx`
- Modify: `src/app/page.tsx`

**Step 1: 创建 Toolbar 组件**

Create file `src/components/layout/toolbar.tsx`:

```typescript
"use client";

import { useAppStore } from "@/stores/app-store";
import { useEditorStore } from "@/stores/editor-store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  FileText,
  Save,
  Download,
  Settings,
  Sun,
  Moon,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Toolbar() {
  const { theme, setTheme } = useTheme();
  const {
    sidebarOpen,
    toggleSidebar,
    aiPanelOpen,
    toggleAIPanel,
    assistantMode,
    setAssistantMode,
  } = useAppStore();
  const { isDirty, currentDocTitle } = useEditorStore();

  return (
    <TooltipProvider>
      <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                aria-label={sidebarOpen ? "关闭侧边栏" : "打开侧边栏"}
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="h-5 w-5" />
                ) : (
                  <PanelLeftOpen className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {sidebarOpen ? "关闭侧边栏" : "打开侧边栏"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="新建文档">
                <FileText className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>新建文档</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="保存">
                <Save className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>保存</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="导出">
                <Download className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>导出</TooltipContent>
          </Tooltip>
        </div>

        {/* Center - Document title */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {currentDocTitle}
            {isDirty && <span className="text-muted-foreground"> •</span>}
          </span>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          {/* Mode switcher */}
          <Tabs
            value={assistantMode}
            onValueChange={(v) => setAssistantMode(v as "proactive" | "chat")}
          >
            <TabsList className="h-8">
              <TabsTrigger value="proactive" className="text-xs px-3">
                Proactive
              </TabsTrigger>
              <TabsTrigger value="chat" className="text-xs px-3">
                Chat
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="切换主题"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>切换主题</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="设置">
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>设置</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleAIPanel}
                aria-label={aiPanelOpen ? "关闭 AI 面板" : "打开 AI 面板"}
              >
                {aiPanelOpen ? (
                  <PanelRightClose className="h-5 w-5" />
                ) : (
                  <PanelRightOpen className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {aiPanelOpen ? "关闭 AI 面板" : "打开 AI 面板"}
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
}
```

**Step 2: 创建 Sidebar 组件**

Create file `src/components/layout/sidebar.tsx`:

```typescript
"use client";

import { useAppStore } from "@/stores/app-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FolderOpen,
  Globe,
  FileText,
  StickyNote,
  Tag,
  Search,
  FileEdit,
  Library,
} from "lucide-react";
import { cn } from "@/lib/utils";

export function Sidebar() {
  const { sidebarOpen, currentView, setCurrentView } = useAppStore();

  if (!sidebarOpen) return null;

  return (
    <aside className="w-60 border-r bg-muted/30 flex flex-col">
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索文档…"
            className="pl-8 h-9"
            aria-label="搜索文档"
          />
        </div>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Navigation */}
          <nav className="space-y-1">
            <Button
              variant={currentView === "editor" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setCurrentView("editor")}
            >
              <FileEdit className="h-4 w-4" />
              写作
            </Button>
            <Button
              variant={currentView === "library" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setCurrentView("library")}
            >
              <Library className="h-4 w-4" />
              文档库
            </Button>
          </nav>

          <Separator className="my-3" />

          {/* Collections */}
          <div className="space-y-1">
            <p className="px-2 text-xs font-medium text-muted-foreground mb-2">
              收藏文档
            </p>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
            >
              <Globe className="h-4 w-4" />
              网页文章
              <span className="ml-auto text-xs text-muted-foreground">12</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
            >
              <FileText className="h-4 w-4" />
              PDF 文档
              <span className="ml-auto text-xs text-muted-foreground">5</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
            >
              <StickyNote className="h-4 w-4" />
              笔记
              <span className="ml-auto text-xs text-muted-foreground">8</span>
            </Button>
          </div>

          <Separator className="my-3" />

          {/* Tags */}
          <div className="space-y-1">
            <p className="px-2 text-xs font-medium text-muted-foreground mb-2">
              标签
            </p>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
            >
              <Tag className="h-4 w-4 text-blue-500" />
              AI
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
            >
              <Tag className="h-4 w-4 text-green-500" />
              技术
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
            >
              <Tag className="h-4 w-4 text-purple-500" />
              产品
            </Button>
          </div>

          <Separator className="my-3" />

          {/* Recent drafts */}
          <div className="space-y-1">
            <p className="px-2 text-xs font-medium text-muted-foreground mb-2">
              最近草稿
            </p>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm truncate"
            >
              <FileEdit className="h-4 w-4 shrink-0" />
              <span className="truncate">AI 写作助手设计思路</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm truncate"
            >
              <FileEdit className="h-4 w-4 shrink-0" />
              <span className="truncate">Proactive 模式技术实现</span>
            </Button>
          </div>
        </div>
      </ScrollArea>

      {/* Storage folder */}
      <div className="p-3 border-t">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-xs"
        >
          <FolderOpen className="h-4 w-4" />
          <span className="truncate">~/myWriteAssistant-data</span>
        </Button>
      </div>
    </aside>
  );
}
```

**Step 3: 创建 MainEditor 占位组件**

Create file `src/components/layout/main-editor.tsx`:

```typescript
"use client";

import { useEditorStore } from "@/stores/editor-store";
import { cn } from "@/lib/utils";

export function MainEditor() {
  const { currentDocContent, updateContent } = useEditorStore();

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-background">
      <div className="flex-1 overflow-auto p-8">
        <article className="max-w-3xl mx-auto">
          {/* Placeholder for Tiptap editor - Phase 2 */}
          <textarea
            className={cn(
              "w-full min-h-[calc(100vh-12rem)] resize-none",
              "bg-transparent border-none outline-none",
              "text-lg leading-relaxed",
              "placeholder:text-muted-foreground",
              "focus:ring-0"
            )}
            placeholder="开始写作..."
            value={currentDocContent}
            onChange={(e) => updateContent(e.target.value)}
            aria-label="写作区域"
          />
        </article>
      </div>
    </main>
  );
}
```

**Step 4: 创建 AIPanel 组件**

Create file `src/components/layout/ai-panel.tsx`:

```typescript
"use client";

import { useAppStore } from "@/stores/app-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Check, X, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

function ProactivePanel() {
  return (
    <div className="flex flex-col h-full">
      {/* Current sentence sync */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Sparkles className="h-4 w-4" />
          <span>实时同步</span>
        </div>
        <p className="text-sm bg-muted/50 rounded-lg p-3 italic">
          "AI 技术正在快速发展，但很多人对它有误解。"
        </p>
      </div>

      {/* Suggestion area */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>建议改写</span>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <p className="text-sm">
              "AI 技术正以前所未有的速度演进，然而公众对其认知仍存在诸多误区。"
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="flex-1 gap-1">
              <Check className="h-4 w-4" />
              采纳
            </Button>
            <Button size="sm" variant="outline" className="flex-1 gap-1">
              <X className="h-4 w-4" />
              忽略
            </Button>
            <Button size="sm" variant="outline" className="gap-1">
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </ScrollArea>

      {/* Status */}
      <div className="p-3 border-t text-center">
        <span className="text-xs text-muted-foreground">
          Proactive 模式已启用
        </span>
      </div>
    </div>
  );
}

function ChatPanel() {
  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* User message */}
          <div className="flex justify-end">
            <div className="bg-primary text-primary-foreground rounded-lg rounded-br-none px-3 py-2 max-w-[80%]">
              <p className="text-sm">帮我生成一个关于 AI 发展趋势的写作大纲</p>
            </div>
          </div>

          {/* AI message */}
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg rounded-bl-none px-3 py-2 max-w-[80%]">
              <p className="text-sm">
                好的，根据你的收藏素材，我为你生成以下大纲：
              </p>
              <div className="mt-2 text-sm space-y-1">
                <p>## AI 发展趋势</p>
                <p>1. 技术演进</p>
                <p>2. 应用场景</p>
                <p>3. 未来展望</p>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="secondary" className="text-xs">
                  插入到编辑器
                </Button>
                <Button size="sm" variant="ghost" className="text-xs">
                  复制
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t">
        <form className="flex gap-2">
          <Input
            placeholder="输入消息…"
            className="flex-1"
            aria-label="聊天输入"
          />
          <Button type="submit" size="icon" aria-label="发送">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export function AIPanel() {
  const { aiPanelOpen, assistantMode } = useAppStore();

  if (!aiPanelOpen) return null;

  return (
    <aside className="w-[360px] border-l bg-muted/30 flex flex-col">
      <div className="h-full">
        {assistantMode === "proactive" ? <ProactivePanel /> : <ChatPanel />}
      </div>
    </aside>
  );
}
```

**Step 5: 创建 StatusBar 组件**

Create file `src/components/layout/status-bar.tsx`:

```typescript
"use client";

import { useAppStore } from "@/stores/app-store";
import { useEditorStore } from "@/stores/editor-store";
import { cn } from "@/lib/utils";

export function StatusBar() {
  const { assistantMode } = useAppStore();
  const { currentDocContent, isDirty, lastSaved } = useEditorStore();

  const wordCount = currentDocContent.trim()
    ? currentDocContent.trim().split(/\s+/).length
    : 0;
  const charCount = currentDocContent.length;

  const formatTime = (date: Date | null) => {
    if (!date) return "未保存";
    return `已保存 ${date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <footer className="h-7 border-t bg-muted/30 flex items-center justify-between px-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <span>字数 {charCount.toLocaleString()}</span>
        <span>{isDirty ? "未保存" : formatTime(lastSaved)}</span>
      </div>
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "flex items-center gap-1",
            assistantMode === "proactive" && "text-primary"
          )}
        >
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              assistantMode === "proactive" ? "bg-primary" : "bg-muted-foreground"
            )}
          />
          {assistantMode === "proactive" ? "Proactive 模式" : "Chat 模式"}
        </span>
        <span>豆包 API</span>
      </div>
    </footer>
  );
}
```

**Step 6: 更新 page.tsx 组合布局**

Replace content of `src/app/page.tsx`:

```typescript
import { Toolbar } from "@/components/layout/toolbar";
import { Sidebar } from "@/components/layout/sidebar";
import { MainEditor } from "@/components/layout/main-editor";
import { AIPanel } from "@/components/layout/ai-panel";
import { StatusBar } from "@/components/layout/status-bar";

export default function Home() {
  return (
    <div className="h-screen flex flex-col">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <MainEditor />
        <AIPanel />
      </div>
      <StatusBar />
    </div>
  );
}
```

**Step 7: 安装 Lucide Icons**

Run:
```bash
pnpm add lucide-react
```

**Step 8: 验证布局正常显示**

Run:
```bash
pnpm dev
```

Expected:
- 三段式布局正确显示
- 侧边栏可折叠
- AI 面板可折叠
- Proactive/Chat 模式可切换
- 深色/浅色模式可切换

**Step 9: 提交布局组件**

Run:
```bash
git add -A && git commit -m "feat: implement three-panel layout with toolbar, sidebar, editor, AI panel"
```

---

## Task 6: 创建文档库页面路由

**Files:**
- Create: `src/app/library/page.tsx`
- Modify: `src/app/page.tsx` (optional enhancement)

**Step 1: 创建文档库页面**

Create file `src/app/library/page.tsx`:

```typescript
import { Toolbar } from "@/components/layout/toolbar";
import { Sidebar } from "@/components/layout/sidebar";
import { AIPanel } from "@/components/layout/ai-panel";
import { StatusBar } from "@/components/layout/status-bar";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Globe, StickyNote, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

function DocumentGrid() {
  // Placeholder documents
  const documents = [
    { id: "1", title: "RAG 技术原理详解", type: "web", date: "2026-01-30" },
    { id: "2", title: "大模型应用开发指南.pdf", type: "pdf", date: "2026-01-29" },
    { id: "3", title: "产品设计笔记", type: "note", date: "2026-01-28" },
    { id: "4", title: "Prompt 工程最佳实践", type: "web", date: "2026-01-27" },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "web":
        return <Globe className="h-8 w-8 text-blue-500" />;
      case "pdf":
        return <FileText className="h-8 w-8 text-red-500" />;
      case "note":
        return <StickyNote className="h-8 w-8 text-yellow-500" />;
      default:
        return <FileText className="h-8 w-8" />;
    }
  };

  return (
    <main className="flex-1 overflow-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">文档库</h1>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            导入文档
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center gap-3">
                  {getIcon(doc.type)}
                  <div>
                    <p className="font-medium text-sm line-clamp-2">
                      {doc.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {doc.date}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}

export default function LibraryPage() {
  return (
    <div className="h-screen flex flex-col">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <DocumentGrid />
        <AIPanel />
      </div>
      <StatusBar />
    </div>
  );
}
```

**Step 2: 验证路由正常工作**

Run:
```bash
pnpm dev
```

访问 http://localhost:3000/library，验证文档库页面正常显示

**Step 3: 提交文档库页面**

Run:
```bash
git add -A && git commit -m "feat: add document library page with grid view"
```

---

## Task 7: 实现 File System Access API Hook

**Files:**
- Create: `src/hooks/use-file-system.ts`
- Create: `src/lib/file-system.ts`

**Step 1: 创建 File System 工具函数**

Create file `src/lib/file-system.ts`:

```typescript
/**
 * File System Access API utilities
 * 用于本地文件存储的工具函数
 */

export interface FileSystemState {
  isSupported: boolean;
  hasPermission: boolean;
  directoryHandle: FileSystemDirectoryHandle | null;
}

/**
 * 检查浏览器是否支持 File System Access API
 */
export function isFileSystemSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    "showDirectoryPicker" in window &&
    "FileSystemDirectoryHandle" in window
  );
}

/**
 * 请求目录访问权限
 */
export async function requestDirectoryAccess(): Promise<FileSystemDirectoryHandle | null> {
  if (!isFileSystemSupported()) {
    console.warn("File System Access API is not supported");
    return null;
  }

  try {
    const handle = await window.showDirectoryPicker({
      id: "myWriteAssistant",
      mode: "readwrite",
      startIn: "documents",
    });
    return handle;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      // User cancelled the picker
      return null;
    }
    throw error;
  }
}

/**
 * 验证目录权限
 */
export async function verifyPermission(
  handle: FileSystemDirectoryHandle,
  mode: "read" | "readwrite" = "readwrite"
): Promise<boolean> {
  const options: FileSystemHandlePermissionDescriptor = { mode };
  
  // 检查现有权限
  if ((await handle.queryPermission(options)) === "granted") {
    return true;
  }
  
  // 请求权限
  if ((await handle.requestPermission(options)) === "granted") {
    return true;
  }
  
  return false;
}

/**
 * 在目录中创建或获取子目录
 */
export async function getOrCreateDirectory(
  parentHandle: FileSystemDirectoryHandle,
  name: string
): Promise<FileSystemDirectoryHandle> {
  return await parentHandle.getDirectoryHandle(name, { create: true });
}

/**
 * 读取文本文件
 */
export async function readTextFile(
  directoryHandle: FileSystemDirectoryHandle,
  path: string
): Promise<string | null> {
  try {
    const parts = path.split("/");
    let currentHandle: FileSystemDirectoryHandle = directoryHandle;
    
    // Navigate to parent directory
    for (let i = 0; i < parts.length - 1; i++) {
      currentHandle = await currentHandle.getDirectoryHandle(parts[i]);
    }
    
    // Get file
    const fileName = parts[parts.length - 1];
    const fileHandle = await currentHandle.getFileHandle(fileName);
    const file = await fileHandle.getFile();
    return await file.text();
  } catch {
    return null;
  }
}

/**
 * 写入文本文件
 */
export async function writeTextFile(
  directoryHandle: FileSystemDirectoryHandle,
  path: string,
  content: string
): Promise<boolean> {
  try {
    const parts = path.split("/");
    let currentHandle: FileSystemDirectoryHandle = directoryHandle;
    
    // Create parent directories if needed
    for (let i = 0; i < parts.length - 1; i++) {
      currentHandle = await getOrCreateDirectory(currentHandle, parts[i]);
    }
    
    // Create/overwrite file
    const fileName = parts[parts.length - 1];
    const fileHandle = await currentHandle.getFileHandle(fileName, { create: true });
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    
    return true;
  } catch (error) {
    console.error("Failed to write file:", error);
    return false;
  }
}

/**
 * 列出目录内容
 */
export async function listDirectory(
  directoryHandle: FileSystemDirectoryHandle,
  path?: string
): Promise<Array<{ name: string; kind: "file" | "directory" }>> {
  try {
    let targetHandle = directoryHandle;
    
    if (path) {
      const parts = path.split("/");
      for (const part of parts) {
        targetHandle = await targetHandle.getDirectoryHandle(part);
      }
    }
    
    const entries: Array<{ name: string; kind: "file" | "directory" }> = [];
    for await (const [name, handle] of targetHandle.entries()) {
      entries.push({ name, kind: handle.kind });
    }
    
    return entries.sort((a, b) => {
      // Directories first, then alphabetically
      if (a.kind !== b.kind) {
        return a.kind === "directory" ? -1 : 1;
      }
      return a.name.localeCompare(b.name);
    });
  } catch {
    return [];
  }
}
```

**Step 2: 创建 useFileSystem Hook**

Create file `src/hooks/use-file-system.ts`:

```typescript
"use client";

import { useState, useCallback, useEffect } from "react";
import {
  isFileSystemSupported,
  requestDirectoryAccess,
  verifyPermission,
  readTextFile,
  writeTextFile,
  listDirectory,
  getOrCreateDirectory,
} from "@/lib/file-system";

const STORAGE_KEY = "myWriteAssistant:directoryHandle";

interface UseFileSystemReturn {
  isSupported: boolean;
  isConnected: boolean;
  isLoading: boolean;
  error: string | null;
  directoryName: string | null;
  connect: () => Promise<boolean>;
  disconnect: () => void;
  readFile: (path: string) => Promise<string | null>;
  writeFile: (path: string, content: string) => Promise<boolean>;
  listDir: (path?: string) => Promise<Array<{ name: string; kind: "file" | "directory" }>>;
  ensureDirectory: (name: string) => Promise<boolean>;
}

export function useFileSystem(): UseFileSystemReturn {
  const [isSupported] = useState(() => isFileSystemSupported());
  const [isConnected, setIsConnected] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [directoryHandle, setDirectoryHandle] = useState<FileSystemDirectoryHandle | null>(null);
  const [directoryName, setDirectoryName] = useState<string | null>(null);

  // Try to restore connection on mount
  useEffect(() => {
    // Note: We can't actually persist FileSystemDirectoryHandle across sessions
    // in a reliable way. User needs to re-grant permission each session.
    // This is a browser security limitation.
  }, []);

  const connect = useCallback(async (): Promise<boolean> => {
    if (!isSupported) {
      setError("您的浏览器不支持 File System Access API");
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      const handle = await requestDirectoryAccess();
      
      if (!handle) {
        setIsLoading(false);
        return false; // User cancelled
      }

      const hasPermission = await verifyPermission(handle);
      
      if (!hasPermission) {
        setError("未获得文件夹访问权限");
        setIsLoading(false);
        return false;
      }

      // Create default directory structure
      await getOrCreateDirectory(handle, "documents");
      await getOrCreateDirectory(handle, "summaries");
      await getOrCreateDirectory(handle, "drafts");
      await getOrCreateDirectory(handle, "published");

      setDirectoryHandle(handle);
      setDirectoryName(handle.name);
      setIsConnected(true);
      setIsLoading(false);
      
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : "连接失败";
      setError(message);
      setIsLoading(false);
      return false;
    }
  }, [isSupported]);

  const disconnect = useCallback(() => {
    setDirectoryHandle(null);
    setDirectoryName(null);
    setIsConnected(false);
    setError(null);
  }, []);

  const readFile = useCallback(async (path: string): Promise<string | null> => {
    if (!directoryHandle) {
      setError("未连接到存储文件夹");
      return null;
    }
    return readTextFile(directoryHandle, path);
  }, [directoryHandle]);

  const writeFile = useCallback(async (path: string, content: string): Promise<boolean> => {
    if (!directoryHandle) {
      setError("未连接到存储文件夹");
      return false;
    }
    return writeTextFile(directoryHandle, path, content);
  }, [directoryHandle]);

  const listDir = useCallback(async (path?: string) => {
    if (!directoryHandle) {
      return [];
    }
    return listDirectory(directoryHandle, path);
  }, [directoryHandle]);

  const ensureDirectory = useCallback(async (name: string): Promise<boolean> => {
    if (!directoryHandle) {
      return false;
    }
    try {
      await getOrCreateDirectory(directoryHandle, name);
      return true;
    } catch {
      return false;
    }
  }, [directoryHandle]);

  return {
    isSupported,
    isConnected,
    isLoading,
    error,
    directoryName,
    connect,
    disconnect,
    readFile,
    writeFile,
    listDir,
    ensureDirectory,
  };
}
```

**Step 3: 提交 File System 代码**

Run:
```bash
git add -A && git commit -m "feat: add File System Access API hook and utilities"
```

---

## Task 8: 最终验证和完善

**Step 1: 运行完整验证**

Run:
```bash
pnpm dev
```

验证清单：
- [ ] 首页三段式布局正常显示
- [ ] 侧边栏可折叠/展开
- [ ] AI 面板可折叠/展开
- [ ] Proactive/Chat 模式切换正常
- [ ] 深色/浅色模式切换正常
- [ ] 文档库页面 (/library) 正常访问
- [ ] 无 console 错误

**Step 2: 运行 lint 检查**

Run:
```bash
pnpm lint
```

Expected: No errors (warnings are acceptable for Phase 1)

**Step 3: 最终提交**

Run:
```bash
git add -A && git commit -m "feat: complete Phase 1 - basic framework with three-panel layout"
```

**Step 4: 创建 Phase 1 完成标签**

Run:
```bash
git tag -a v0.1.0-phase1 -m "Phase 1 Complete: Basic framework with three-panel layout"
```

---

## Phase 1 验收标准

完成后应满足：

| 功能 | 状态 |
|------|------|
| Next.js 14 + TypeScript 项目 | ✅ |
| Tailwind CSS + shadcn/ui 配置 | ✅ |
| 三段式响应式布局 | ✅ |
| 侧边栏 (240px) 可折叠 | ✅ |
| AI 面板 (360px) 可折叠 | ✅ |
| Proactive/Chat 模式切换 | ✅ |
| 深色/浅色模式切换 | ✅ |
| 文档库页面路由 | ✅ |
| File System Access API hook | ✅ |
| Zustand 状态管理 | ✅ |

---

## 下一步：Phase 2

Phase 1 完成后，继续 Phase 2：编辑器核心
- 集成 Tiptap 编辑器
- 实现所见即所得 Markdown 编辑
- 自动保存到本地文件
