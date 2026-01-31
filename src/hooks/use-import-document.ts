"use client";

import { useState, useCallback } from "react";
import { clipWebPage } from "@/lib/web-clipper";
import { parsePdfFile } from "@/lib/pdf-parser";
import { useDocumentStore } from "@/stores/document-store";
import type { DocumentSource, ImportOptions } from "@/types/document";

interface ImportState {
  isImporting: boolean;
  progress: number;
  error: string | null;
}

interface ImportResult {
  success: boolean;
  documentId?: string;
  error?: string;
}

export function useImportDocument() {
  const [state, setState] = useState<ImportState>({
    isImporting: false,
    progress: 0,
    error: null,
  });

  const addDocument = useDocumentStore((s) => s.addDocument);

  // 导入网页
  const importFromUrl = useCallback(
    async (url: string, options?: ImportOptions): Promise<ImportResult> => {
      setState({ isImporting: true, progress: 10, error: null });

      try {
        setState((s) => ({ ...s, progress: 30 }));
        
        const clipped = await clipWebPage(url);
        
        setState((s) => ({ ...s, progress: 70 }));

        const docId = await addDocument({
          title: clipped.title,
          content: clipped.content,
          source: "web" as DocumentSource,
          sourceUrl: url,
          author: clipped.author,
          excerpt: clipped.excerpt,
          siteName: clipped.siteName,
          wordCount: clipped.wordCount,
          readingTime: clipped.readingTime,
          tags: options?.tags || [],
          folderId: options?.folderId,
        });

        setState({ isImporting: false, progress: 100, error: null });
        
        return { success: true, documentId: docId };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to import from URL";
        setState({ isImporting: false, progress: 0, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    },
    [addDocument]
  );

  // 导入 PDF 文件
  const importFromPdf = useCallback(
    async (file: File, options?: ImportOptions): Promise<ImportResult> => {
      setState({ isImporting: true, progress: 10, error: null });

      try {
        setState((s) => ({ ...s, progress: 30 }));
        
        const parsed = await parsePdfFile(file);
        
        setState((s) => ({ ...s, progress: 70 }));

        // 生成摘录
        const excerpt = parsed.content.slice(0, 200).trim() + "...";
        
        // 估算阅读时间
        const wordCount = parsed.content.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200);

        const docId = await addDocument({
          title: parsed.title || file.name.replace(/\.pdf$/i, ""),
          content: parsed.content,
          source: "pdf" as DocumentSource,
          author: parsed.author,
          excerpt,
          wordCount,
          readingTime,
          tags: options?.tags || [],
          folderId: options?.folderId,
        });

        setState({ isImporting: false, progress: 100, error: null });
        
        return { success: true, documentId: docId };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to import PDF";
        setState({ isImporting: false, progress: 0, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    },
    [addDocument]
  );

  // 导入 Markdown 文件
  const importFromMarkdown = useCallback(
    async (file: File, options?: ImportOptions): Promise<ImportResult> => {
      setState({ isImporting: true, progress: 10, error: null });

      try {
        setState((s) => ({ ...s, progress: 30 }));
        
        const content = await file.text();
        
        setState((s) => ({ ...s, progress: 50 }));

        // 提取标题 (第一个 # 标题或文件名)
        const titleMatch = content.match(/^#\s+(.+)$/m);
        const title = titleMatch?.[1] || file.name.replace(/\.md$/i, "");

        // 生成摘录
        const contentWithoutTitle = content.replace(/^#\s+.+$/m, "").trim();
        const excerpt = contentWithoutTitle.slice(0, 200).trim() + "...";

        // 估算字数和阅读时间
        const wordCount = content.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200);

        setState((s) => ({ ...s, progress: 70 }));

        const docId = await addDocument({
          title,
          content,
          source: "markdown" as DocumentSource,
          excerpt,
          wordCount,
          readingTime,
          tags: options?.tags || [],
          folderId: options?.folderId,
        });

        setState({ isImporting: false, progress: 100, error: null });
        
        return { success: true, documentId: docId };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to import Markdown";
        setState({ isImporting: false, progress: 0, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    },
    [addDocument]
  );

  // 导入本地文本文件
  const importFromText = useCallback(
    async (file: File, options?: ImportOptions): Promise<ImportResult> => {
      setState({ isImporting: true, progress: 10, error: null });

      try {
        setState((s) => ({ ...s, progress: 30 }));
        
        const content = await file.text();
        
        setState((s) => ({ ...s, progress: 50 }));

        const title = file.name.replace(/\.(txt|text)$/i, "");
        const excerpt = content.slice(0, 200).trim() + "...";
        const wordCount = content.split(/\s+/).length;
        const readingTime = Math.ceil(wordCount / 200);

        setState((s) => ({ ...s, progress: 70 }));

        const docId = await addDocument({
          title,
          content,
          source: "local" as DocumentSource,
          excerpt,
          wordCount,
          readingTime,
          tags: options?.tags || [],
          folderId: options?.folderId,
        });

        setState({ isImporting: false, progress: 100, error: null });
        
        return { success: true, documentId: docId };
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Failed to import text file";
        setState({ isImporting: false, progress: 0, error: errorMessage });
        return { success: false, error: errorMessage };
      }
    },
    [addDocument]
  );

  // 通用文件导入
  const importFile = useCallback(
    async (file: File, options?: ImportOptions): Promise<ImportResult> => {
      const extension = file.name.split(".").pop()?.toLowerCase();

      switch (extension) {
        case "pdf":
          return importFromPdf(file, options);
        case "md":
        case "markdown":
          return importFromMarkdown(file, options);
        case "txt":
        case "text":
          return importFromText(file, options);
        default:
          return {
            success: false,
            error: `Unsupported file type: ${extension}`,
          };
      }
    },
    [importFromPdf, importFromMarkdown, importFromText]
  );

  // 重置状态
  const reset = useCallback(() => {
    setState({ isImporting: false, progress: 0, error: null });
  }, []);

  return {
    ...state,
    importFromUrl,
    importFromPdf,
    importFromMarkdown,
    importFromText,
    importFile,
    reset,
  };
}
