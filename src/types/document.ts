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
  siteName?: string;         // 网站名称
  
  // 元数据
  author?: string;
  excerpt?: string;          // 内容摘录
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
  
  // 分类
  tags: string[];
  folderId?: string;
  
  // AI 摘要
  summary?: string;
  summaryGeneratedAt?: string;
  
  // 文件信息
  wordCount?: number;
  readingTime?: number;       // 分钟
}

export interface DocumentFolder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: string;
}

export interface Tag {
  id: string;
  name: string;
  color: string;
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
