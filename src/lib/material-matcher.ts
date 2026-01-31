/**
 * 素材匹配器
 * 基于搜索引擎匹配相关文档，构建上下文
 */

import { searchDocuments } from "@/lib/search-engine";
import { useDocumentStore } from "@/stores/document-store";

interface MatchedMaterial {
  id: string;
  title: string;
  excerpt: string;
  content: string;
  score: number;
}

/**
 * 根据查询匹配相关素材
 */
export async function matchMaterials(
  query: string,
  limit: number = 3
): Promise<MatchedMaterial[]> {
  if (!query.trim()) {
    return [];
  }

  // 搜索相关文档
  const searchResults = await searchDocuments(query, limit * 2);
  
  if (searchResults.length === 0) {
    return [];
  }

  // 获取完整文档内容
  const documentStore = useDocumentStore.getState();
  const materials: MatchedMaterial[] = [];

  for (const result of searchResults) {
    const doc = documentStore.getDocument(result.id);
    if (doc) {
      materials.push({
        id: doc.id,
        title: doc.title,
        excerpt: doc.excerpt || doc.content.slice(0, 200) + "...",
        content: doc.content,
        score: result.score,
      });

      if (materials.length >= limit) {
        break;
      }
    }
  }

  return materials;
}

/**
 * 构建 AI 上下文
 * 将匹配的素材格式化为上下文字符串
 */
export function buildContext(
  materials: MatchedMaterial[],
  maxLength: number = 8000
): string {
  if (materials.length === 0) {
    return "";
  }

  let context = "# 相关素材\n\n";
  let currentLength = context.length;

  for (const material of materials) {
    const materialSection = `## ${material.title}\n\n${material.content}\n\n---\n\n`;
    
    // 检查是否超过最大长度
    if (currentLength + materialSection.length > maxLength) {
      // 截断内容
      const availableSpace = maxLength - currentLength - 100;
      if (availableSpace > 200) {
        const truncatedContent = material.content.slice(0, availableSpace) + "...";
        context += `## ${material.title}\n\n${truncatedContent}\n\n---\n\n`;
      }
      break;
    }

    context += materialSection;
    currentLength += materialSection.length;
  }

  return context;
}

/**
 * 智能素材匹配
 * 分析用户问题，匹配最相关的素材
 */
export async function smartMatchMaterials(
  userMessage: string
): Promise<{ materials: MatchedMaterial[]; context: string }> {
  // 提取关键词（简单实现）
  const keywords = extractKeywords(userMessage);
  
  // 搜索匹配
  const materials = await matchMaterials(keywords.join(" "));
  
  // 构建上下文
  const context = buildContext(materials);
  
  return { materials, context };
}

/**
 * 提取关键词
 */
function extractKeywords(text: string): string[] {
  // 移除常见停用词
  const stopWords = new Set([
    "的", "是", "在", "了", "有", "和", "与", "或", "但", "如果",
    "这", "那", "什么", "怎么", "如何", "为什么", "哪", "哪些",
    "a", "an", "the", "is", "are", "was", "were", "be", "been",
    "do", "does", "did", "have", "has", "had", "will", "would",
    "can", "could", "should", "may", "might", "must",
    "to", "of", "in", "on", "at", "by", "for", "with", "about",
    "帮我", "请", "能", "可以", "吗", "呢", "吧",
  ]);

  // 分词（简单实现）
  const words = text
    .replace(/[,.!?;:，。！？；：]/g, " ")
    .split(/\s+/)
    .filter((word) => word.length > 1 && !stopWords.has(word.toLowerCase()));

  return words.slice(0, 10); // 最多取 10 个关键词
}

/**
 * 检查是否需要素材匹配
 */
export function shouldMatchMaterials(message: string): boolean {
  const materialKeywords = [
    "素材", "收藏", "文档", "文章",
    "根据", "参考", "引用", "总结",
    "我的", "之前", "保存",
  ];

  const lowerMessage = message.toLowerCase();
  return materialKeywords.some((keyword) => lowerMessage.includes(keyword));
}
