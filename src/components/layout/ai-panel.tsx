"use client";

import { useCallback } from "react";
import { useAppStore } from "@/stores/app-store";
import { useAIStore, type AssistantMode } from "@/stores/ai-store";
import { Sparkles, MessageSquare, Wand2 } from "lucide-react";
import { ChatPanel as ChatPanelComponent } from "@/components/ai/chat-panel";
import { ProactivePanel } from "@/components/ai/proactive-panel";
import { useEditorContext } from "@/components/editor/editor-context";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

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

  return (
    <aside className="w-[360px] border-l border-gray-200 dark:border-gray-800 bg-[#f9f8fc] dark:bg-gray-900 flex flex-col">
      {/* Header */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            AI Assistant
          </h2>
          <Badge 
            variant={mode === "proactive" ? "default" : "secondary"}
            className={`text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
              mode === "proactive" 
                ? "bg-primary text-white hover:bg-primary/90" 
                : "bg-gray-200 text-gray-600 hover:bg-gray-300"
            }`}
            onClick={() => setMode(mode === "proactive" ? "chat" : "proactive")}
          >
            {mode === "proactive" ? "Proactive" : "Chat"}
          </Badge>
        </div>

        {/* Mode Selector */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setMode("chat")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              mode === "chat"
                ? "bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700"
                : "text-gray-500 hover:bg-white/50"
            }`}
          >
            <MessageSquare className="h-4 w-4" />
            Chat
          </button>
          <button
            onClick={() => setMode("proactive")}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
              mode === "proactive"
                ? "bg-white dark:bg-gray-800 shadow-sm border border-gray-100 dark:border-gray-700"
                : "text-gray-500 hover:bg-white/50"
            }`}
          >
            <Wand2 className="h-4 w-4" />
            Proactive
          </button>
        </div>
      </div>
      
      {/* Panel Content */}
      <div className="flex-1 overflow-hidden px-6">
        {mode === "proactive" ? <ProactivePanel /> : <ChatPanelWrapper />}
      </div>

      {/* Footer with Usage */}
      <div className="mt-auto p-6">
        <div className="flex items-center justify-between text-[11px] text-gray-400 mb-2">
          <span>AI Usage</span>
          <span>72%</span>
        </div>
        <Progress value={72} className="h-1" />
      </div>
    </aside>
  );
}
