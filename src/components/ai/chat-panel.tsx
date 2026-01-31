"use client";

import { useRef, useEffect, useCallback } from "react";
import { Trash2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MessageBubble } from "./message-bubble";
import { ChatInput } from "./chat-input";
import { useChat } from "@/hooks/use-chat";

interface ChatPanelProps {
  onInsertToEditor?: (content: string) => void;
}

export function ChatPanel({ onInsertToEditor }: ChatPanelProps) {
  const {
    messages,
    isStreaming,
    sendMessage,
    stopGenerating,
    clearMessages,
  } = useChat();

  const scrollRef = useRef<HTMLDivElement>(null);

  // 自动滚动到底部
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = useCallback(
    (content: string) => {
      sendMessage(content);
    },
    [sendMessage]
  );

  return (
    <div className="flex flex-col h-full">
      {/* 头部 */}
      <div className="flex items-center justify-between p-3 border-b">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <span className="font-medium text-sm">AI 助手</span>
        </div>
        
        {messages.length > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearMessages}
            className="h-7 px-2 text-xs text-muted-foreground"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            清空对话
          </Button>
        )}
      </div>

      {/* 消息列表 */}
      <ScrollArea className="flex-1" ref={scrollRef}>
        <div className="flex flex-col">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 px-4 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground/30 mb-4" />
              <h3 className="font-medium text-sm mb-2">开始对话</h3>
              <p className="text-xs text-muted-foreground max-w-[200px]">
                我可以帮你生成大纲、润色文章、根据收藏素材回答问题
              </p>
              
              {/* 快捷提示 */}
              <div className="flex flex-col gap-2 mt-6 w-full max-w-[220px]">
                <QuickPrompt
                  text="帮我生成一个写作大纲"
                  onClick={() => handleSend("帮我生成一个写作大纲")}
                />
                <QuickPrompt
                  text="润色一下这段文字"
                  onClick={() => handleSend("润色一下这段文字")}
                />
                <QuickPrompt
                  text="总结我的收藏素材"
                  onClick={() => handleSend("总结我的收藏素材")}
                />
              </div>
            </div>
          ) : (
            messages.map((message, index) => (
              <MessageBubble
                key={message.id}
                message={message}
                isStreaming={isStreaming && index === messages.length - 1}
                onInsertToEditor={onInsertToEditor}
              />
            ))
          )}
        </div>
      </ScrollArea>

      {/* 输入框 */}
      <ChatInput
        onSend={handleSend}
        onStop={stopGenerating}
        isStreaming={isStreaming}
      />
    </div>
  );
}

// 快捷提示按钮
function QuickPrompt({
  text,
  onClick,
}: {
  text: string;
  onClick: () => void;
}) {
  return (
    <button
      className="text-left text-xs px-3 py-2 rounded-md border hover:bg-muted transition-colors"
      onClick={onClick}
    >
      {text}
    </button>
  );
}
