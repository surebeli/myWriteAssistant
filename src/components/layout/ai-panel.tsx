"use client";

import { useAppStore } from "@/stores/app-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Send, Check, X, Pencil } from "lucide-react";

function ProactivePanel() {
  return (
    <div className="flex flex-col h-full">
      {/* Current sentence sync */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Sparkles className="h-4 w-4" />
          <span>实时同步</span>
        </div>
        <p className="text-sm bg-muted/50 rounded-lg p-3 italic">
          &quot;AI 技术正在快速发展，但很多人对它有误解。&quot;
        </p>
      </div>

      {/* Suggestion area */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>建议改写</span>
          </div>
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
            <p className="text-sm">
              &quot;AI 技术正以前所未有的速度演进，然而公众对其认知仍存在诸多误区。&quot;
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-3">
            <Button size="sm" className="flex-1 gap-1">
              <Check className="h-4 w-4" />
              采纳
            </Button>
            <Button size="sm" variant="outline" className="flex-1 gap-1">
              <X className="h-4 w-4" />
              忽略
            </Button>
            <Button size="sm" variant="outline" className="gap-1">
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </ScrollArea>

      {/* Status */}
      <div className="p-3 border-t text-center">
        <span className="text-xs text-muted-foreground">
          Proactive 模式已启用
        </span>
      </div>
    </div>
  );
}

function ChatPanel() {
  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {/* User message */}
          <div className="flex justify-end">
            <div className="bg-primary text-primary-foreground rounded-lg rounded-br-none px-3 py-2 max-w-[80%]">
              <p className="text-sm">帮我生成一个关于 AI 发展趋势的写作大纲</p>
            </div>
          </div>

          {/* AI message */}
          <div className="flex justify-start">
            <div className="bg-muted rounded-lg rounded-bl-none px-3 py-2 max-w-[80%]">
              <p className="text-sm">
                好的，根据你的收藏素材，我为你生成以下大纲：
              </p>
              <div className="mt-2 text-sm space-y-1">
                <p>## AI 发展趋势</p>
                <p>1. 技术演进</p>
                <p>2. 应用场景</p>
                <p>3. 未来展望</p>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="secondary" className="text-xs">
                  插入到编辑器
                </Button>
                <Button size="sm" variant="ghost" className="text-xs">
                  复制
                </Button>
              </div>
            </div>
          </div>
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-3 border-t">
        <form className="flex gap-2">
          <Input
            placeholder="输入消息…"
            className="flex-1"
            aria-label="聊天输入"
          />
          <Button type="submit" size="icon" aria-label="发送">
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export function AIPanel() {
  const { aiPanelOpen, assistantMode } = useAppStore();

  if (!aiPanelOpen) return null;

  return (
    <aside className="w-[360px] border-l bg-muted/30 flex flex-col">
      <div className="h-full">
        {assistantMode === "proactive" ? <ProactivePanel /> : <ChatPanel />}
      </div>
    </aside>
  );
}
