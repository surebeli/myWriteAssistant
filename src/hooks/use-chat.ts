"use client";

import { useCallback, useRef } from "react";
import { useAIStore, type ChatMessage } from "@/stores/ai-store";

interface UseChatOptions {
  onError?: (error: Error) => void;
}

export function useChat(options: UseChatOptions = {}) {
  const messages = useAIStore((s) => s.chat.messages);
  const isStreaming = useAIStore((s) => s.chat.isStreaming);
  const streamingContent = useAIStore((s) => s.chat.streamingContent);
  
  const addMessage = useAIStore((s) => s.addMessage);
  const updateLastMessage = useAIStore((s) => s.updateLastMessage);
  const setStreaming = useAIStore((s) => s.setStreaming);
  const setStreamingContent = useAIStore((s) => s.setStreamingContent);
  const clearMessages = useAIStore((s) => s.clearMessages);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  // 发送消息
  const sendMessage = useCallback(
    async (content: string, context?: string) => {
      if (!content.trim() || isStreaming) return;

      // 添加用户消息
      addMessage({ role: "user", content });

      // 添加空的 AI 消息占位
      addMessage({ role: "assistant", content: "" });
      
      setStreaming(true);
      setStreamingContent("");

      // 准备消息历史
      const chatMessages: { role: "user" | "assistant"; content: string }[] = [
        ...messages.map((m) => ({ role: m.role, content: m.content })),
        { role: "user" as const, content },
      ];

      try {
        abortControllerRef.current = new AbortController();

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: chatMessages,
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
          
          // Vercel AI SDK 使用特定的流格式
          // 解析数据块
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("0:")) {
              // 文本内容
              try {
                const text = JSON.parse(line.slice(2));
                fullContent += text;
                setStreamingContent(fullContent);
                updateLastMessage(fullContent);
              } catch {
                // 忽略解析错误
              }
            }
          }
        }

        // 完成
        setStreamingContent("");
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          // 用户取消，不处理
          return;
        }
        
        console.error("Chat error:", error);
        updateLastMessage("抱歉，发生了错误，请稍后重试。");
        options.onError?.(error instanceof Error ? error : new Error("Unknown error"));
      } finally {
        setStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [
      messages,
      isStreaming,
      addMessage,
      updateLastMessage,
      setStreaming,
      setStreamingContent,
      options,
    ]
  );

  // 停止生成
  const stopGenerating = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setStreaming(false);
    }
  }, [setStreaming]);

  // 重新生成最后一条消息
  const regenerate = useCallback(async () => {
    if (messages.length < 2) return;
    
    // 找到最后一条用户消息
    const lastUserMessage = [...messages]
      .reverse()
      .find((m) => m.role === "user");
    
    if (!lastUserMessage) return;
    
    // 移除最后两条消息（用户+AI）
    const messagesWithoutLast = messages.slice(0, -2);
    clearMessages();
    messagesWithoutLast.forEach((m) => addMessage({ role: m.role, content: m.content }));
    
    // 重新发送
    await sendMessage(lastUserMessage.content);
  }, [messages, clearMessages, addMessage, sendMessage]);

  return {
    messages,
    isStreaming,
    streamingContent,
    sendMessage,
    stopGenerating,
    regenerate,
    clearMessages,
  };
}
