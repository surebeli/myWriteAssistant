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
