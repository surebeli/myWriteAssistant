"use client";

import { useEffect, useRef, useCallback } from "react";
import type { Editor } from "@tiptap/react";
import {
  extractLastSentence,
  extractContext,
  shouldTriggerSuggestion,
  isSignificantChange,
} from "@/lib/sentence-detector";

interface UseEditorObserverOptions {
  editor: Editor | null;
  enabled?: boolean;
  onSentenceComplete?: (sentence: string, context: string) => void;
}

/**
 * 监听编辑器内容变化，检测完整句子
 */
export function useEditorObserver(options: UseEditorObserverOptions) {
  const { editor, enabled = true, onSentenceComplete } = options;
  
  const lastTextRef = useRef<string>("");
  const lastSentenceRef = useRef<string>("");
  const callbackRef = useRef(onSentenceComplete);
  
  // 更新回调引用
  useEffect(() => {
    callbackRef.current = onSentenceComplete;
  }, [onSentenceComplete]);

  // 获取编辑器纯文本内容
  const getEditorText = useCallback(() => {
    if (!editor) return "";
    return editor.getText();
  }, [editor]);

  // 处理内容更新
  const handleUpdate = useCallback(() => {
    if (!enabled || !callbackRef.current) return;
    
    const currentText = getEditorText();
    
    // 检查变化是否有意义
    if (!isSignificantChange(lastTextRef.current, currentText)) {
      lastTextRef.current = currentText;
      return;
    }
    
    lastTextRef.current = currentText;
    
    // 检查是否应该触发建议
    if (!shouldTriggerSuggestion(currentText)) {
      return;
    }
    
    // 提取最后一个完整句子
    const sentence = extractLastSentence(currentText);
    if (!sentence) return;
    
    // 避免重复触发同一句子
    if (sentence === lastSentenceRef.current) return;
    lastSentenceRef.current = sentence;
    
    // 提取上下文
    const context = extractContext(currentText, 3);
    
    // 触发回调
    callbackRef.current(sentence, context);
  }, [enabled, getEditorText]);

  // 监听编辑器更新事件
  useEffect(() => {
    if (!editor || !enabled) return;
    
    // TipTap 的 onUpdate 事件
    editor.on("update", handleUpdate);
    
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, enabled, handleUpdate]);

  // 重置状态
  const reset = useCallback(() => {
    lastTextRef.current = "";
    lastSentenceRef.current = "";
  }, []);

  return { reset };
}
