# Phase 3: 文档收藏系统 Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** 实现多源文档导入和管理，包括网页抓取、PDF导入、标签系统、全文搜索和AI摘要

**Architecture:** 
- Readability.js 用于网页正文提取
- pdf.js 用于 PDF 解析
- MiniSearch 用于全文搜索
- 豆包 API 用于 AI 摘要生成
- IndexedDB 用于搜索索引缓存

**Tech Stack:** @mozilla/readability, pdfjs-dist, minisearch, idb-keyval

**Design Reference:** Stitch Project ID: `1840683527876412125`

---

## Task 1: 安装文档处理依赖

**Files:**
- Modify: `package.json`

**Step 1: 安装网页解析和搜索依赖**

Run:
```bash
cd /Users/litianyi/Documents/Code/_ai-goods/myWriteAssistant
npm install @mozilla/readability linkedom turndown minisearch idb-keyval
```

Expected: Packages added to dependencies
- `@mozilla/readability`: 网页正文提取
- `linkedom`: 服务端 DOM 解析
- `turndown`: HTML 转 Markdown
- `minisearch`: 客户端全文搜索
- `idb-keyval`: IndexedDB 简化封装

**Step 2: 安装 PDF 解析依赖**

Run:
```bash
npm install pdfjs-dist
```

Expected: pdfjs-dist installed

**Step 3: 安装类型声明**

Run:
```bash
npm install -D @types/turndown
```

**Step 4: 提交依赖更新**

Run:
```bash
git add -A && git commit -m "chore: add document processing dependencies"
```

---

## Task 2: 创建文档类型定义

**Files:**
- Create: `src/types/document.ts`

**Step 1: 创建文档类型**

Create file `src/types/document.ts`:

```typescript
/**
 * 文档收藏系统类型定义
 */

export type DocumentSource = "web" | "pdf" | "markdown" | "local";

export interface CollectedDocument {
  id: string;
  title: string;
  content: string;           // Markdown 格式的正文
  source: DocumentSource;
  sourceUrl?: string;        // 网页来源 URL
  sourcePath?: string;       // 本地文件路径
  
  // 元数据
  author?: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // 分类
  tags: string[];
  folderId?: string;
  
  // AI 摘要
  summary?: string;
  summaryGeneratedAt?: Date;
  
  // 文件信息
  wordCount: number;
  readingTime: number;       // 分钟
}

export interface DocumentFolder {
  id: string;
  name: string;
  parentId?: string;
  createdAt: Date;
  documentCount: number;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  documentCount: number;
}

export interface SearchResult {
  id: string;
  title: string;
  excerpt: string;           // 匹配的上下文片段
  score: number;
  highlightedTitle?: string;
  highlightedExcerpt?: string;
}

export interface ImportOptions {
  generateSummary?: boolean;
  tags?: string[];
  folderId?: string;
}
```

**Step 2: 提交类型定义**

Run:
```bash
git add -A && git commit -m "feat: add document type definitions"
```

---

## Task 3: 实现网页内容抓取

**Files:**
- Create: `src/lib/web-clipper.ts`

**Step 1: 创建网页抓取工具**

Create file `src/lib/web-clipper.ts`:

```typescript
/**
 * 网页内容抓取工具
 * 使用 Readability.js 提取正文，Turndown 转换为 Markdown
 */

import { Readability } from "@mozilla/readability";
import { parseHTML } from "linkedom";
import TurndownService from "turndown";

export interface ClippedContent {
  title: string;
  content: string;         // Markdown 格式
  excerpt: string;
  author?: string;
  siteName?: string;
  publishedTime?: string;
  wordCount: number;
}

const turndownService = new TurndownService({
  headingStyle: "atx",
  codeBlockStyle: "fenced",
  bulletListMarker: "-",
});

// 添加代码块规则
turndownService.addRule("codeBlock", {
  filter: ["pre"],
  replacement: (content, node) => {
    const element = node as HTMLElement;
    const code = element.querySelector("code");
    const language = code?.className?.match(/language-(\w+)/)?.[1] || "";
    const text = code?.textContent || element.textContent || "";
    return `\n\`\`\`${language}\n${text.trim()}\n\`\`\`\n`;
  },
});

/**
 * 从 URL 抓取网页内容
 */
export async function clipWebPage(url: string): Promise<ClippedContent | null> {
  try {
    // 获取网页 HTML
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch: ${response.status}`);
    }
    
    const html = await response.text();
    return parseHtmlContent(html, url);
  } catch (error) {
    console.error("Failed to clip web page:", error);
    return null;
  }
}

/**
 * 解析 HTML 内容
 */
export function parseHtmlContent(html: string, baseUrl?: string): ClippedContent | null {
  try {
    const { document } = parseHTML(html);
    
    // 设置 base URL 以解析相对链接
    if (baseUrl) {
      const base = document.createElement("base");
      base.href = baseUrl;
      document.head.appendChild(base);
    }
    
    // 使用 Readability 提取正文
    const reader = new Readability(document);
    const article = reader.parse();
    
    if (!article) {
      return null;
    }
    
    // 转换为 Markdown
    const markdown = turndownService.turndown(article.content);
    
    // 计算字数
    const wordCount = countWords(markdown);
    
    return {
      title: article.title || "Untitled",
      content: markdown,
      excerpt: article.excerpt || "",
      author: article.byline || undefined,
      siteName: article.siteName || undefined,
      publishedTime: article.publishedTime || undefined,
      wordCount,
    };
  } catch (error) {
    console.error("Failed to parse HTML:", error);
    return null;
  }
}

/**
 * 计算字数（中英文混合）
 */
function countWords(text: string): number {
  // 移除 Markdown 标记
  const cleanText = text
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_~>\-]/g, "");
  
  // 中文字符
  const chineseChars = (cleanText.match(/[\u4e00-\u9fa5]/g) || []).length;
  
  // 英文单词
  const englishWords = (cleanText.match(/[a-zA-Z]+/g) || []).length;
  
  return chineseChars + englishWords;
}

/**
 * 计算阅读时间（分钟）
 */
export function calculateReadingTime(wordCount: number): number {
  // 中英文平均阅读速度约 400 字/分钟
  return Math.max(1, Math.ceil(wordCount / 400));
}
```

**Step 2: 提交网页抓取工具**

Run:
```bash
git add -A && git commit -m "feat: add web clipper utility"
```

---

## Task 4: 实现 PDF 解析

**Files:**
- Create: `src/lib/pdf-parser.ts`

**Step 1: 创建 PDF 解析工具**

Create file `src/lib/pdf-parser.ts`:

```typescript
/**
 * PDF 文件解析工具
 * 使用 pdf.js 提取文本内容
 */

import * as pdfjsLib from "pdfjs-dist";

// 设置 worker
if (typeof window !== "undefined") {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
}

export interface ParsedPdf {
  title: string;
  content: string;
  pageCount: number;
  wordCount: number;
  metadata?: {
    author?: string;
    subject?: string;
    keywords?: string;
    creationDate?: Date;
  };
}

/**
 * 解析 PDF 文件
 */
export async function parsePdfFile(file: File): Promise<ParsedPdf | null> {
  try {
    const arrayBuffer = await file.arrayBuffer();
    return parsePdfBuffer(arrayBuffer, file.name);
  } catch (error) {
    console.error("Failed to parse PDF file:", error);
    return null;
  }
}

/**
 * 解析 PDF ArrayBuffer
 */
export async function parsePdfBuffer(
  buffer: ArrayBuffer,
  filename: string
): Promise<ParsedPdf | null> {
  try {
    const pdf = await pdfjsLib.getDocument({ data: buffer }).promise;
    
    // 获取元数据
    const metadata = await pdf.getMetadata();
    const info = metadata.info as Record<string, unknown>;
    
    // 提取所有页面的文本
    const textContents: string[] = [];
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      const pageText = content.items
        .map((item) => ("str" in item ? item.str : ""))
        .join(" ");
      textContents.push(pageText);
    }
    
    const fullText = textContents.join("\n\n");
    
    // 转换为 Markdown 格式
    const markdown = convertToMarkdown(fullText);
    
    // 计算字数
    const wordCount = countWords(markdown);
    
    // 提取标题
    const title = (info?.Title as string) || filename.replace(/\.pdf$/i, "") || "Untitled PDF";
    
    return {
      title,
      content: markdown,
      pageCount: pdf.numPages,
      wordCount,
      metadata: {
        author: info?.Author as string,
        subject: info?.Subject as string,
        keywords: info?.Keywords as string,
        creationDate: info?.CreationDate 
          ? parseDate(info.CreationDate as string) 
          : undefined,
      },
    };
  } catch (error) {
    console.error("Failed to parse PDF:", error);
    return null;
  }
}

/**
 * 将纯文本转换为基础 Markdown
 */
function convertToMarkdown(text: string): string {
  // 按段落分割
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);
  
  return paragraphs
    .map((p) => {
      // 检测可能的标题（短文本，无标点结尾）
      if (p.length < 100 && !/[.。!！?？]$/.test(p)) {
        // 可能是标题
        if (p.length < 30) {
          return `## ${p}`;
        }
        return `### ${p}`;
      }
      return p;
    })
    .join("\n\n");
}

/**
 * 计算字数
 */
function countWords(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
}

/**
 * 解析 PDF 日期格式
 */
function parseDate(dateString: string): Date | undefined {
  // PDF 日期格式: D:YYYYMMDDHHmmSS
  const match = dateString.match(/D:(\d{4})(\d{2})(\d{2})(\d{2})?(\d{2})?(\d{2})?/);
  if (match) {
    const [, year, month, day, hour = "0", minute = "0", second = "0"] = match;
    return new Date(
      parseInt(year),
      parseInt(month) - 1,
      parseInt(day),
      parseInt(hour),
      parseInt(minute),
      parseInt(second)
    );
  }
  return undefined;
}
```

**Step 2: 提交 PDF 解析工具**

Run:
```bash
git add -A && git commit -m "feat: add PDF parser utility"
```

---

## Task 5: 实现全文搜索

**Files:**
- Create: `src/lib/search-engine.ts`
- Create: `src/hooks/use-search.ts`

**Step 1: 创建搜索引擎**

Create file `src/lib/search-engine.ts`:

```typescript
/**
 * 全文搜索引擎
 * 使用 MiniSearch 实现客户端搜索
 */

import MiniSearch from "minisearch";
import { get, set, del } from "idb-keyval";
import type { CollectedDocument, SearchResult } from "@/types/document";

const SEARCH_INDEX_KEY = "search-index";

interface IndexedDocument {
  id: string;
  title: string;
  content: string;
  tags: string;
  summary: string;
}

let searchInstance: MiniSearch<IndexedDocument> | null = null;

/**
 * 初始化搜索引擎
 */
export async function initSearchEngine(): Promise<MiniSearch<IndexedDocument>> {
  if (searchInstance) {
    return searchInstance;
  }
  
  // 尝试从 IndexedDB 恢复索引
  const savedIndex = await get<string>(SEARCH_INDEX_KEY);
  
  if (savedIndex) {
    try {
      searchInstance = MiniSearch.loadJSON(savedIndex, {
        fields: ["title", "content", "tags", "summary"],
        storeFields: ["title"],
        searchOptions: {
          boost: { title: 2, summary: 1.5 },
          fuzzy: 0.2,
          prefix: true,
        },
      });
      return searchInstance;
    } catch (error) {
      console.warn("Failed to load search index, creating new one:", error);
    }
  }
  
  // 创建新索引
  searchInstance = new MiniSearch<IndexedDocument>({
    fields: ["title", "content", "tags", "summary"],
    storeFields: ["title"],
    searchOptions: {
      boost: { title: 2, summary: 1.5 },
      fuzzy: 0.2,
      prefix: true,
    },
  });
  
  return searchInstance;
}

/**
 * 添加文档到索引
 */
export async function indexDocument(doc: CollectedDocument): Promise<void> {
  const engine = await initSearchEngine();
  
  const indexedDoc: IndexedDocument = {
    id: doc.id,
    title: doc.title,
    content: doc.content,
    tags: doc.tags.join(" "),
    summary: doc.summary || "",
  };
  
  // 如果已存在，先删除
  if (engine.has(doc.id)) {
    engine.discard(doc.id);
  }
  
  engine.add(indexedDoc);
  await saveIndex();
}

/**
 * 从索引中移除文档
 */
export async function removeFromIndex(docId: string): Promise<void> {
  const engine = await initSearchEngine();
  
  if (engine.has(docId)) {
    engine.discard(docId);
    await saveIndex();
  }
}

/**
 * 搜索文档
 */
export async function searchDocuments(
  query: string,
  limit: number = 20
): Promise<SearchResult[]> {
  if (!query.trim()) {
    return [];
  }
  
  const engine = await initSearchEngine();
  const results = engine.search(query, { limit });
  
  return results.map((result) => ({
    id: result.id,
    title: result.title || "Untitled",
    excerpt: extractExcerpt(result.match, query),
    score: result.score,
    highlightedTitle: highlightMatches(result.title || "", query),
    highlightedExcerpt: "",
  }));
}

/**
 * 搜索建议（自动补全）
 */
export async function getSearchSuggestions(
  query: string,
  limit: number = 5
): Promise<string[]> {
  if (!query.trim()) {
    return [];
  }
  
  const engine = await initSearchEngine();
  const suggestions = engine.autoSuggest(query, { limit });
  
  return suggestions.map((s) => s.suggestion);
}

/**
 * 保存索引到 IndexedDB
 */
async function saveIndex(): Promise<void> {
  if (searchInstance) {
    const json = JSON.stringify(searchInstance);
    await set(SEARCH_INDEX_KEY, json);
  }
}

/**
 * 清空索引
 */
export async function clearIndex(): Promise<void> {
  searchInstance = null;
  await del(SEARCH_INDEX_KEY);
}

/**
 * 提取搜索结果摘要
 */
function extractExcerpt(
  matches: Record<string, string[]>,
  query: string
): string {
  // 简单实现：返回匹配的字段名
  const matchedFields = Object.keys(matches);
  return `匹配: ${matchedFields.join(", ")}`;
}

/**
 * 高亮匹配文本
 */
function highlightMatches(text: string, query: string): string {
  const terms = query.toLowerCase().split(/\s+/);
  let result = text;
  
  terms.forEach((term) => {
    if (term) {
      const regex = new RegExp(`(${escapeRegex(term)})`, "gi");
      result = result.replace(regex, "<mark>$1</mark>");
    }
  });
  
  return result;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
```

**Step 2: 创建搜索 Hook**

Create file `src/hooks/use-search.ts`:

```typescript
"use client";

import { useState, useCallback, useRef } from "react";
import {
  searchDocuments,
  getSearchSuggestions,
} from "@/lib/search-engine";
import type { SearchResult } from "@/types/document";

export function useSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const debounceRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback(async (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (!searchQuery.trim()) {
      setResults([]);
      setSuggestions([]);
      return;
    }
    
    // 清除之前的防抖
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    
    // 防抖搜索
    debounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      
      try {
        const [searchResults, searchSuggestions] = await Promise.all([
          searchDocuments(searchQuery),
          getSearchSuggestions(searchQuery),
        ]);
        
        setResults(searchResults);
        setSuggestions(searchSuggestions);
      } catch (error) {
        console.error("Search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 200);
  }, []);

  const clearSearch = useCallback(() => {
    setQuery("");
    setResults([]);
    setSuggestions([]);
  }, []);

  return {
    query,
    results,
    suggestions,
    isSearching,
    search,
    clearSearch,
  };
}
```

**Step 3: 提交搜索功能**

Run:
```bash
git add -A && git commit -m "feat: add full-text search engine"
```

---

## Task 6: 创建文档 Store

**Files:**
- Create: `src/stores/document-store.ts`

**Step 1: 创建文档状态管理**

Create file `src/stores/document-store.ts`:

```typescript
import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CollectedDocument, Tag, DocumentFolder } from "@/types/document";

interface DocumentState {
  // 文档列表
  documents: CollectedDocument[];
  
  // 标签和文件夹
  tags: Tag[];
  folders: DocumentFolder[];
  
  // 视图状态
  viewMode: "grid" | "list";
  sortBy: "updatedAt" | "createdAt" | "title";
  sortOrder: "asc" | "desc";
  selectedTags: string[];
  selectedFolderId: string | null;
  
  // Actions
  addDocument: (doc: CollectedDocument) => void;
  updateDocument: (id: string, updates: Partial<CollectedDocument>) => void;
  removeDocument: (id: string) => void;
  
  addTag: (tag: Tag) => void;
  removeTag: (id: string) => void;
  
  addFolder: (folder: DocumentFolder) => void;
  removeFolder: (id: string) => void;
  
  setViewMode: (mode: "grid" | "list") => void;
  setSortBy: (sortBy: "updatedAt" | "createdAt" | "title") => void;
  setSortOrder: (order: "asc" | "desc") => void;
  setSelectedTags: (tags: string[]) => void;
  setSelectedFolderId: (id: string | null) => void;
  
  // 获取过滤后的文档
  getFilteredDocuments: () => CollectedDocument[];
}

export const useDocumentStore = create<DocumentState>()(
  persist(
    (set, get) => ({
      documents: [],
      tags: [],
      folders: [],
      
      viewMode: "grid",
      sortBy: "updatedAt",
      sortOrder: "desc",
      selectedTags: [],
      selectedFolderId: null,
      
      addDocument: (doc) => set((state) => ({
        documents: [doc, ...state.documents],
      })),
      
      updateDocument: (id, updates) => set((state) => ({
        documents: state.documents.map((doc) =>
          doc.id === id ? { ...doc, ...updates, updatedAt: new Date() } : doc
        ),
      })),
      
      removeDocument: (id) => set((state) => ({
        documents: state.documents.filter((doc) => doc.id !== id),
      })),
      
      addTag: (tag) => set((state) => ({
        tags: [...state.tags, tag],
      })),
      
      removeTag: (id) => set((state) => ({
        tags: state.tags.filter((tag) => tag.id !== id),
        // 同时从所有文档中移除该标签
        documents: state.documents.map((doc) => ({
          ...doc,
          tags: doc.tags.filter((t) => t !== id),
        })),
      })),
      
      addFolder: (folder) => set((state) => ({
        folders: [...state.folders, folder],
      })),
      
      removeFolder: (id) => set((state) => ({
        folders: state.folders.filter((f) => f.id !== id),
        // 将该文件夹下的文档移到根目录
        documents: state.documents.map((doc) =>
          doc.folderId === id ? { ...doc, folderId: undefined } : doc
        ),
      })),
      
      setViewMode: (mode) => set({ viewMode: mode }),
      setSortBy: (sortBy) => set({ sortBy }),
      setSortOrder: (order) => set({ sortOrder: order }),
      setSelectedTags: (tags) => set({ selectedTags: tags }),
      setSelectedFolderId: (id) => set({ selectedFolderId: id }),
      
      getFilteredDocuments: () => {
        const state = get();
        let docs = [...state.documents];
        
        // 按文件夹过滤
        if (state.selectedFolderId) {
          docs = docs.filter((doc) => doc.folderId === state.selectedFolderId);
        }
        
        // 按标签过滤
        if (state.selectedTags.length > 0) {
          docs = docs.filter((doc) =>
            state.selectedTags.every((tag) => doc.tags.includes(tag))
          );
        }
        
        // 排序
        docs.sort((a, b) => {
          let comparison = 0;
          
          switch (state.sortBy) {
            case "title":
              comparison = a.title.localeCompare(b.title);
              break;
            case "createdAt":
              comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
              break;
            case "updatedAt":
            default:
              comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime();
          }
          
          return state.sortOrder === "asc" ? comparison : -comparison;
        });
        
        return docs;
      },
    }),
    {
      name: "document-store",
      partialize: (state) => ({
        documents: state.documents,
        tags: state.tags,
        folders: state.folders,
        viewMode: state.viewMode,
        sortBy: state.sortBy,
        sortOrder: state.sortOrder,
      }),
    }
  )
);
```

**Step 2: 提交文档 Store**

Run:
```bash
git add -A && git commit -m "feat: add document store with persistence"
```

---

## Task 7: 创建导入功能 Hook

**Files:**
- Create: `src/hooks/use-import-document.ts`

**Step 1: 创建导入 Hook**

Create file `src/hooks/use-import-document.ts`:

```typescript
"use client";

import { useState, useCallback } from "react";
import { clipWebPage, calculateReadingTime } from "@/lib/web-clipper";
import { parsePdfFile } from "@/lib/pdf-parser";
import { indexDocument } from "@/lib/search-engine";
import { useDocumentStore } from "@/stores/document-store";
import type { CollectedDocument, ImportOptions } from "@/types/document";

export function useImportDocument() {
  const [isImporting, setIsImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const { addDocument } = useDocumentStore();

  /**
   * 从 URL 导入网页
   */
  const importFromUrl = useCallback(async (
    url: string,
    options: ImportOptions = {}
  ): Promise<CollectedDocument | null> => {
    setIsImporting(true);
    setImportError(null);
    
    try {
      const clipped = await clipWebPage(url);
      
      if (!clipped) {
        throw new Error("无法解析网页内容");
      }
      
      const doc: CollectedDocument = {
        id: `web-${Date.now()}`,
        title: clipped.title,
        content: clipped.content,
        source: "web",
        sourceUrl: url,
        author: clipped.author,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: options.tags || [],
        folderId: options.folderId,
        wordCount: clipped.wordCount,
        readingTime: calculateReadingTime(clipped.wordCount),
      };
      
      // 添加到 store
      addDocument(doc);
      
      // 索引文档
      await indexDocument(doc);
      
      return doc;
    } catch (error) {
      const message = error instanceof Error ? error.message : "导入失败";
      setImportError(message);
      return null;
    } finally {
      setIsImporting(false);
    }
  }, [addDocument]);

  /**
   * 导入 PDF 文件
   */
  const importPdf = useCallback(async (
    file: File,
    options: ImportOptions = {}
  ): Promise<CollectedDocument | null> => {
    setIsImporting(true);
    setImportError(null);
    
    try {
      const parsed = await parsePdfFile(file);
      
      if (!parsed) {
        throw new Error("无法解析 PDF 文件");
      }
      
      const doc: CollectedDocument = {
        id: `pdf-${Date.now()}`,
        title: parsed.title,
        content: parsed.content,
        source: "pdf",
        sourcePath: file.name,
        author: parsed.metadata?.author,
        publishedAt: parsed.metadata?.creationDate,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: options.tags || [],
        folderId: options.folderId,
        wordCount: parsed.wordCount,
        readingTime: calculateReadingTime(parsed.wordCount),
      };
      
      // 添加到 store
      addDocument(doc);
      
      // 索引文档
      await indexDocument(doc);
      
      return doc;
    } catch (error) {
      const message = error instanceof Error ? error.message : "导入失败";
      setImportError(message);
      return null;
    } finally {
      setIsImporting(false);
    }
  }, [addDocument]);

  /**
   * 导入 Markdown 文件
   */
  const importMarkdown = useCallback(async (
    file: File,
    options: ImportOptions = {}
  ): Promise<CollectedDocument | null> => {
    setIsImporting(true);
    setImportError(null);
    
    try {
      const content = await file.text();
      
      // 提取标题（第一个 # 标题或文件名）
      const titleMatch = content.match(/^#\s+(.+)$/m);
      const title = titleMatch?.[1] || file.name.replace(/\.md$/i, "");
      
      // 计算字数
      const wordCount = countWords(content);
      
      const doc: CollectedDocument = {
        id: `md-${Date.now()}`,
        title,
        content,
        source: "markdown",
        sourcePath: file.name,
        createdAt: new Date(),
        updatedAt: new Date(),
        tags: options.tags || [],
        folderId: options.folderId,
        wordCount,
        readingTime: calculateReadingTime(wordCount),
      };
      
      // 添加到 store
      addDocument(doc);
      
      // 索引文档
      await indexDocument(doc);
      
      return doc;
    } catch (error) {
      const message = error instanceof Error ? error.message : "导入失败";
      setImportError(message);
      return null;
    } finally {
      setIsImporting(false);
    }
  }, [addDocument]);

  /**
   * 处理文件拖放或选择
   */
  const importFile = useCallback(async (
    file: File,
    options: ImportOptions = {}
  ): Promise<CollectedDocument | null> => {
    const ext = file.name.split(".").pop()?.toLowerCase();
    
    switch (ext) {
      case "pdf":
        return importPdf(file, options);
      case "md":
      case "markdown":
        return importMarkdown(file, options);
      default:
        setImportError(`不支持的文件格式: ${ext}`);
        return null;
    }
  }, [importPdf, importMarkdown]);

  return {
    isImporting,
    importError,
    importFromUrl,
    importPdf,
    importMarkdown,
    importFile,
  };
}

function countWords(text: string): number {
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z]+/g) || []).length;
  return chineseChars + englishWords;
}

function calculateReadingTime(wordCount: number): number {
  return Math.max(1, Math.ceil(wordCount / 400));
}
```

**Step 2: 提交导入功能**

Run:
```bash
git add -A && git commit -m "feat: add document import hook"
```

---

## Task 8: 更新文档库页面 UI

**Files:**
- Modify: `src/app/library/page.tsx`
- Create: `src/components/library/document-card.tsx`
- Create: `src/components/library/import-dialog.tsx`
- Create: `src/components/library/search-bar.tsx`

**Step 1: 创建文档卡片组件**

Create file `src/components/library/document-card.tsx`:

```typescript
"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Globe, FileText, File, MoreVertical, Clock, Tag } from "lucide-react";
import { cn } from "@/lib/utils";
import type { CollectedDocument } from "@/types/document";

interface DocumentCardProps {
  document: CollectedDocument;
  viewMode: "grid" | "list";
  onOpen: (doc: CollectedDocument) => void;
  onDelete: (id: string) => void;
}

const sourceIcons = {
  web: Globe,
  pdf: FileText,
  markdown: File,
  local: File,
};

export function DocumentCard({
  document,
  viewMode,
  onOpen,
  onDelete,
}: DocumentCardProps) {
  const Icon = sourceIcons[document.source];
  
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("zh-CN", {
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  if (viewMode === "list") {
    return (
      <div
        className="flex items-center gap-4 p-4 border-b hover:bg-muted/50 cursor-pointer transition-colors"
        onClick={() => onOpen(document)}
      >
        <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium truncate">{document.title}</h3>
          {document.summary && (
            <p className="text-sm text-muted-foreground truncate mt-1">
              {document.summary}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-4 shrink-0 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {document.readingTime} min
          </span>
          <span>{formatDate(document.updatedAt)}</span>
        </div>
        
        <DropdownMenu>
          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
            <Button variant="ghost" size="icon" className="h-8 w-8">
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onOpen(document)}>
              打开
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => onDelete(document.id)}
            >
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    );
  }

  return (
    <Card
      className={cn(
        "cursor-pointer transition-all hover:shadow-md hover:border-primary/50",
        "group"
      )}
      onClick={() => onOpen(document)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <Icon className="h-5 w-5 text-muted-foreground" />
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onOpen(document)}>
                打开
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => onDelete(document.id)}
              >
                删除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <h3 className="font-medium line-clamp-2 mt-2">{document.title}</h3>
      </CardHeader>
      <CardContent>
        {document.summary && (
          <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
            {document.summary}
          </p>
        )}
        
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {document.readingTime} min
          </span>
          <span>{formatDate(document.updatedAt)}</span>
        </div>
        
        {document.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {document.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs bg-muted"
              >
                <Tag className="h-3 w-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

**Step 2: 创建搜索栏组件**

Create file `src/components/library/search-bar.tsx`:

```typescript
"use client";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, X, Grid, List } from "lucide-react";
import { useSearch } from "@/hooks/use-search";
import { useDocumentStore } from "@/stores/document-store";

export function SearchBar() {
  const { query, search, clearSearch, isSearching } = useSearch();
  const { viewMode, setViewMode } = useDocumentStore();

  return (
    <div className="flex items-center gap-4">
      <div className="relative flex-1 max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="搜索文档..."
          value={query}
          onChange={(e) => search(e.target.value)}
          className="pl-10 pr-10"
        />
        {query && (
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
            onClick={clearSearch}
          >
            <X className="h-4 w-4" />
          </Button>
        )}
        {isSearching && (
          <div className="absolute right-10 top-1/2 -translate-y-1/2">
            <div className="h-4 w-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
      
      <div className="flex items-center border rounded-lg p-1">
        <Button
          variant={viewMode === "grid" ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setViewMode("grid")}
        >
          <Grid className="h-4 w-4" />
        </Button>
        <Button
          variant={viewMode === "list" ? "secondary" : "ghost"}
          size="icon"
          className="h-8 w-8"
          onClick={() => setViewMode("list")}
        >
          <List className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
```

**Step 3: 创建导入对话框**

Create file `src/components/library/import-dialog.tsx`:

```typescript
"use client";

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Globe, Upload, FileText, Loader2 } from "lucide-react";
import { useImportDocument } from "@/hooks/use-import-document";

interface ImportDialogProps {
  onImportComplete?: () => void;
}

export function ImportDialog({ onImportComplete }: ImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const { isImporting, importError, importFromUrl, importFile } = useImportDocument();

  const handleUrlImport = async () => {
    if (!url.trim()) return;
    
    const doc = await importFromUrl(url);
    if (doc) {
      setUrl("");
      setOpen(false);
      onImportComplete?.();
    }
  };

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const doc = await importFile(file);
    if (doc) {
      setOpen(false);
      onImportComplete?.();
    }
    
    // Reset input
    e.target.value = "";
  }, [importFile, onImportComplete]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (!file) return;
    
    const doc = await importFile(file);
    if (doc) {
      setOpen(false);
      onImportComplete?.();
    }
  }, [importFile, onImportComplete]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          导入文档
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>导入文档</DialogTitle>
        </DialogHeader>
        
        <Tabs defaultValue="url" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url">
              <Globe className="h-4 w-4 mr-2" />
              网页
            </TabsTrigger>
            <TabsTrigger value="file">
              <Upload className="h-4 w-4 mr-2" />
              文件
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="url" className="mt-4 space-y-4">
            <div className="flex gap-2">
              <Input
                type="url"
                placeholder="输入网页 URL..."
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUrlImport()}
              />
              <Button onClick={handleUrlImport} disabled={isImporting || !url.trim()}>
                {isImporting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  "导入"
                )}
              </Button>
            </div>
            {importError && (
              <p className="text-sm text-destructive">{importError}</p>
            )}
          </TabsContent>
          
          <TabsContent value="file" className="mt-4">
            <div
              className="border-2 border-dashed rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <input
                type="file"
                accept=".pdf,.md,.markdown"
                onChange={handleFileSelect}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <FileText className="h-10 w-10 mx-auto text-muted-foreground" />
                <p className="mt-2 text-sm text-muted-foreground">
                  拖放文件或点击选择
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  支持 PDF、Markdown 格式
                </p>
              </label>
            </div>
            {isImporting && (
              <div className="flex items-center justify-center mt-4">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm">正在导入...</span>
              </div>
            )}
            {importError && (
              <p className="text-sm text-destructive mt-2">{importError}</p>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
```

**Step 4: 添加缺少的 shadcn/ui 组件**

Run:
```bash
cd /Users/litianyi/Documents/Code/_ai-goods/myWriteAssistant
npx shadcn@latest add dialog dropdown-menu
```

**Step 5: 更新文档库页面**

更新 `src/app/library/page.tsx`：

```typescript
"use client";

import { useDocumentStore } from "@/stores/document-store";
import { DocumentCard } from "@/components/library/document-card";
import { SearchBar } from "@/components/library/search-bar";
import { ImportDialog } from "@/components/library/import-dialog";
import { removeFromIndex } from "@/lib/search-engine";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

export default function LibraryPage() {
  const router = useRouter();
  const { 
    viewMode, 
    getFilteredDocuments, 
    removeDocument 
  } = useDocumentStore();
  
  const documents = getFilteredDocuments();

  const handleOpenDocument = (doc: { id: string }) => {
    // 跳转到编辑器页面
    router.push(`/?doc=${doc.id}`);
  };

  const handleDeleteDocument = async (id: string) => {
    if (window.confirm("确定要删除这个文档吗？")) {
      removeDocument(id);
      await removeFromIndex(id);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">文档库</h1>
            <ImportDialog />
          </div>
          <SearchBar />
        </div>
      </header>

      <main className="container mx-auto px-4 py-6">
        {documents.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">暂无文档</p>
            <p className="text-sm text-muted-foreground mt-1">
              点击"导入文档"开始收藏
            </p>
          </div>
        ) : (
          <div
            className={cn(
              viewMode === "grid"
                ? "grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                : "flex flex-col border rounded-lg overflow-hidden"
            )}
          >
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                viewMode={viewMode}
                onOpen={handleOpenDocument}
                onDelete={handleDeleteDocument}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
```

**Step 6: 提交 UI 更新**

Run:
```bash
git add -A && git commit -m "feat: update library page with document cards and import dialog"
```

---

## Task 9: 验证和完善

**Step 1: 运行 lint 检查**

Run:
```bash
cd /Users/litianyi/Documents/Code/_ai-goods/myWriteAssistant
source ~/.nvm/nvm.sh && nvm use 22 && npm run lint
```

**Step 2: 运行构建验证**

Run:
```bash
npm run build
```

**Step 3: 修复可能的错误并提交**

Run:
```bash
git add -A && git commit -m "fix: resolve Phase 3 build issues"
```

**Step 4: 创建 Phase 3 完成标签**

Run:
```bash
git tag -a v0.3.0-phase3 -m "Phase 3 Complete: Document collection system"
```

---

## Phase 3 验收标准

完成后应满足：

| 功能 | 状态 |
|------|------|
| 网页内容抓取 (Readability.js) | ✅ |
| PDF 文件解析 (pdf.js) | ✅ |
| Markdown 文件导入 | ✅ |
| 全文搜索 (MiniSearch) | ✅ |
| 文档库 Grid/List 视图 | ✅ |
| 标签系统基础 | ✅ |
| 导入对话框 UI | ✅ |
| 持久化存储 (Zustand persist) | ✅ |

---

## 下一步：Phase 4

Phase 3 完成后，继续 Phase 4：AI 写作助手 - Chat 模式
- 豆包 API 集成
- Chat 模式 UI（消息气泡、流式输出）
- 基于摘要的素材匹配
- 大纲生成功能
