"use client";

import { useCallback, useRef } from "react";
import { useAIStore } from "@/stores/ai-store";
import { generateRequestId, resolveProviderConfig } from "@/lib/ai/request-assembly";

interface UseProactiveOptions {
  onError?: (error: Error) => void;
  debounceMs?: number;
}

export function useProactive(options: UseProactiveOptions = {}) {
  const { debounceMs = 1500 } = options;
  
  const currentSentence = useAIStore((s) => s.proactive.currentSentence);
  const suggestion = useAIStore((s) => s.proactive.suggestion);
  const isGenerating = useAIStore((s) => s.proactive.isGenerating);
  
  const setCurrentSentence = useAIStore((s) => s.setCurrentSentence);
  const setSuggestion = useAIStore((s) => s.setSuggestion);
  const setProactiveGenerating = useAIStore((s) => s.setProactiveGenerating);
  const clearSuggestion = useAIStore((s) => s.clearSuggestion);
  
  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastSentenceRef = useRef<string>("");

  // 取消当前生成
  const cancelGeneration = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    setProactiveGenerating(false);
  }, [setProactiveGenerating]);

  // 生成建议
  const generateSuggestion = useCallback(
    async (sentence: string, context?: string) => {
      if (!sentence.trim()) return;
      
      // 避免重复生成
      if (sentence === lastSentenceRef.current) return;
      lastSentenceRef.current = sentence;
      
      // 取消之前的请求
      cancelGeneration();
      
      setProactiveGenerating(true);
      setSuggestion(null);

      try {
        abortControllerRef.current = new AbortController();
        const requestId = generateRequestId();
        const providerConfig = await resolveProviderConfig("proactive");

        const response = await fetch("/api/proactive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            providerConfig,
            requestId,
            scenario: "proactive",
            sentence,
            context,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        if (!response.body) {
          throw new Error("No response body");
        }

        // 流式读取响应
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          
          // 解析 Vercel AI SDK 流格式
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("0:")) {
              try {
                const text = JSON.parse(line.slice(2));
                fullContent += text;
                // 实时更新建议
                setSuggestion(fullContent.trim());
              } catch {
                // 忽略解析错误
              }
            }
          }
        }

        // 清理引号（如果 AI 返回了引号包裹的内容）
        const cleanedSuggestion = fullContent
          .trim()
          .replace(/^["'「]/, "")
          .replace(/["'」]$/, "");
        
        setSuggestion(cleanedSuggestion);
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
        
        console.error("Proactive error:", error);
        options.onError?.(error instanceof Error ? error : new Error("Unknown error"));
      } finally {
        setProactiveGenerating(false);
        abortControllerRef.current = null;
      }
    },
    [cancelGeneration, options, setProactiveGenerating, setSuggestion]
  );

  // 带防抖的句子更新
  const updateSentence = useCallback(
    (sentence: string, context?: string) => {
      setCurrentSentence(sentence);
      
      // 清除之前的定时器
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      
      // 如果句子为空，清除建议
      if (!sentence.trim()) {
        cancelGeneration();
        clearSuggestion();
        return;
      }
      
      // 设置新的防抖定时器
      debounceTimerRef.current = setTimeout(() => {
        generateSuggestion(sentence, context);
      }, debounceMs);
    },
    [debounceMs, setCurrentSentence, cancelGeneration, clearSuggestion, generateSuggestion]
  );

  // 采纳建议
  const acceptSuggestion = useCallback(() => {
    const accepted = suggestion;
    clearSuggestion();
    lastSentenceRef.current = "";
    return accepted;
  }, [suggestion, clearSuggestion]);

  // 忽略建议
  const ignoreSuggestion = useCallback(() => {
    clearSuggestion();
    lastSentenceRef.current = "";
  }, [clearSuggestion]);

  return {
    currentSentence,
    suggestion,
    isGenerating,
    updateSentence,
    acceptSuggestion,
    ignoreSuggestion,
    cancelGeneration,
  };
}
