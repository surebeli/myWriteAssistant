"use client";

import { useAppStore } from "@/stores/app-store";
import { useEditorStore } from "@/stores/editor-store";
import { cn } from "@/lib/utils";

export function StatusBar() {
  const { assistantMode } = useAppStore();
  const { currentDocContent, isDirty, lastSaved } = useEditorStore();

  const charCount = currentDocContent.length;

  const formatTime = (date: Date | null) => {
    if (!date) return "未保存";
    return `已保存 ${date.toLocaleTimeString("zh-CN", {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  };

  return (
    <footer className="h-7 border-t bg-muted/30 flex items-center justify-between px-4 text-xs text-muted-foreground">
      <div className="flex items-center gap-4">
        <span>字数 {charCount.toLocaleString()}</span>
        <span>{isDirty ? "未保存" : formatTime(lastSaved)}</span>
      </div>
      <div className="flex items-center gap-4">
        <span
          className={cn(
            "flex items-center gap-1",
            assistantMode === "proactive" && "text-primary"
          )}
        >
          <span
            className={cn(
              "w-2 h-2 rounded-full",
              assistantMode === "proactive" ? "bg-primary" : "bg-muted-foreground"
            )}
          />
          {assistantMode === "proactive" ? "Proactive 模式" : "Chat 模式"}
        </span>
        <span>豆包 API</span>
      </div>
    </footer>
  );
}
