/**
 * 全文搜索引擎
 * 使用 MiniSearch 实现客户端搜索
 */

import MiniSearch from "minisearch";
import { get, set, del } from "idb-keyval";
import type { SearchResult } from "@/types/document";

const SEARCH_INDEX_KEY = "search-index";

interface IndexedDocument {
  id: string;
  title: string;
  content: string;
  tags: string;
  summary: string;
}

// 用于索引的简化文档接口
export interface DocumentForIndex {
  id: string;
  title: string;
  content: string;
  tags: string[];
  summary?: string;
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
export async function indexDocument(doc: DocumentForIndex): Promise<void> {
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
  const results = engine.search(query).slice(0, limit);
  
  return results.map((result) => ({
    id: result.id,
    title: (result as unknown as { title?: string }).title || "Untitled",
    excerpt: extractExcerpt(result.match, query),
    score: result.score,
    highlightedTitle: highlightMatches(
      (result as unknown as { title?: string }).title || "",
      query
    ),
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
  const suggestions = engine.autoSuggest(query).slice(0, limit);
  
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
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _query: string
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
