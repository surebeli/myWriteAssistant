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
