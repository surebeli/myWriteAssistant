"use client";

import { useCallback } from "react";
import { useAppStore } from "@/stores/app-store";
import { useAIStore, type AssistantMode } from "@/stores/ai-store";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, Wand2 } from "lucide-react";
import { ChatPanel as ChatPanelComponent } from "@/components/ai/chat-panel";
import { ProactivePanel } from "@/components/ai/proactive-panel";
import { useEditorContext } from "@/components/editor/editor-context";

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
