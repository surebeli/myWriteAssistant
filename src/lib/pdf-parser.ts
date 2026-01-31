/**
 * PDF 文件解析工具
 * 使用 pdf.js 提取文本内容
 */

import type { TextItem } from "pdfjs-dist/types/src/display/api";

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
    // 动态导入 pdf.js 以避免 SSR 问题
    const pdfjsLib = await import("pdfjs-dist");
    
    // 设置 worker
    if (typeof window !== "undefined") {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
    }
    
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
        .map((item) => {
          if ("str" in item) {
            return (item as TextItem).str;
          }
          return "";
        })
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
