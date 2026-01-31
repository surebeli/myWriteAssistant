"use client";

import { useCallback } from "react";
import { useAppStore } from "@/stores/app-store";
import { useAIStore, type AssistantMode } from "@/stores/ai-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Check, X, Pencil, MessageSquare, Wand2 } from "lucide-react";
import { ChatPanel as ChatPanelComponent } from "@/components/ai/chat-panel";
import { useEditorContext } from "@/components/editor/editor-context";

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
          Proactive 模式已启用 (即将推出)
        </span>
      </div>
    </div>
  );
}

function ChatPanelWrapper() {
  const { editor } = useEditorContext();
  
  const handleInsertToEditor = useCallback((content: string) => {
    if (editor) {
      editor.commands.insertContent(content);
      editor.commands.focus();
    }
  }, [editor]);

  return <ChatPanelComponent onInsertToEditor={handleInsertToEditor} />;
}

export function AIPanel() {
  const { aiPanelOpen } = useAppStore();
  const mode = useAIStore((s) => s.mode);
  const setMode = useAIStore((s) => s.setMode);

  if (!aiPanelOpen) return null;

  const handleModeChange = (value: string) => {
    setMode(value as AssistantMode);
  };

  return (
    <aside className="w-[360px] border-l bg-muted/30 flex flex-col">
      {/* Mode Tabs */}
      <div className="p-2 border-b">
        <Tabs value={mode} onValueChange={handleModeChange} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat" className="gap-1.5 text-xs">
              <MessageSquare className="h-3.5 w-3.5" />
              Chat
            </TabsTrigger>
            <TabsTrigger value="proactive" className="gap-1.5 text-xs">
              <Wand2 className="h-3.5 w-3.5" />
              Proactive
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
      
      {/* Panel Content */}
      <div className="flex-1 overflow-hidden">
        {mode === "proactive" ? <ProactivePanel /> : <ChatPanelWrapper />}
      </div>
    </aside>
  );
}
