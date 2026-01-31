/**
 * 句子检测工具
 * 从编辑器内容中提取最后一个完整句子
 */

// 中文句子结束符
const CHINESE_SENTENCE_ENDINGS = ["。", "！", "？", "；"];
// 英文句子结束符
const ENGLISH_SENTENCE_ENDINGS = [".", "!", "?", ";"];
// 所有句子结束符
const ALL_SENTENCE_ENDINGS = [...CHINESE_SENTENCE_ENDINGS, ...ENGLISH_SENTENCE_ENDINGS];

/**
 * 从文本中提取最后一个完整句子
 */
export function extractLastSentence(text: string): string | null {
  if (!text?.trim()) return null;
  
  const trimmed = text.trimEnd();
  
  // 检查是否以句号等结束
  const lastChar = trimmed.slice(-1);
  if (!ALL_SENTENCE_ENDINGS.includes(lastChar)) {
    return null;
  }
  
  // 从后往前找上一个句子结束符
  let start = 0;
  for (let i = trimmed.length - 2; i >= 0; i--) {
    if (ALL_SENTENCE_ENDINGS.includes(trimmed[i])) {
      start = i + 1;
      break;
    }
  }
  
  // 提取句子并清理
  const sentence = trimmed.slice(start).trim();
  
  // 过滤太短的句子
  if (sentence.length < 5) return null;
  
  return sentence;
}

/**
 * 从文本中提取当前正在编写的句子（可能未完成）
 */
export function extractCurrentSentence(text: string): string | null {
  if (!text?.trim()) return null;
  
  const trimmed = text.trimEnd();
  
  // 从后往前找上一个句子结束符
  let start = 0;
  for (let i = trimmed.length - 1; i >= 0; i--) {
    if (ALL_SENTENCE_ENDINGS.includes(trimmed[i])) {
      start = i + 1;
      break;
    }
  }
  
  // 提取当前句子
  const sentence = trimmed.slice(start).trim();
  
  // 过滤太短的句子
  if (sentence.length < 5) return null;
  
  return sentence;
}

/**
 * 检测句子是否完整（以句号等结束）
 */
export function isSentenceComplete(text: string): boolean {
  if (!text?.trim()) return false;
  const lastChar = text.trimEnd().slice(-1);
  return ALL_SENTENCE_ENDINGS.includes(lastChar);
}

/**
 * 提取前 N 个段落作为上下文
 */
export function extractContext(text: string, maxParagraphs: number = 3): string {
  if (!text?.trim()) return "";
  
  // 分割段落（双换行或单换行）
  const paragraphs = text.split(/\n\n+/).filter((p) => p.trim());
  
  // 取最后 N 个段落（不包含最后一个正在编写的段落）
  if (paragraphs.length <= 1) return "";
  
  const contextParagraphs = paragraphs.slice(-maxParagraphs - 1, -1);
  
  return contextParagraphs.join("\n\n");
}

/**
 * 检测文本变化是否有意义（用于触发建议）
 */
export function isSignificantChange(oldText: string, newText: string): boolean {
  // 长度变化太小不触发
  const lengthDiff = Math.abs(newText.length - oldText.length);
  if (lengthDiff < 2) return false;
  
  // 只删除不触发
  if (newText.length < oldText.length) return false;
  
  return true;
}

/**
 * 判断是否应该触发建议
 */
export function shouldTriggerSuggestion(text: string): boolean {
  // 必须有完整句子
  const lastSentence = extractLastSentence(text);
  if (!lastSentence) return false;
  
  // 句子长度适中
  if (lastSentence.length < 10 || lastSentence.length > 500) return false;
  
  return true;
}
