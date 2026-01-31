"use client";

import { useEditorStore } from "@/stores/editor-store";
import { cn } from "@/lib/utils";

export function MainEditor() {
  const { currentDocContent, updateContent } = useEditorStore();

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-background">
      <div className="flex-1 overflow-auto p-8">
        <article className="max-w-3xl mx-auto">
          {/* Placeholder for Tiptap editor - Phase 2 */}
          <textarea
            className={cn(
              "w-full min-h-[calc(100vh-12rem)] resize-none",
              "bg-transparent border-none outline-none",
              "text-lg leading-relaxed",
              "placeholder:text-muted-foreground",
              "focus:ring-0"
            )}
            placeholder="开始写作..."
            value={currentDocContent}
            onChange={(e) => updateContent(e.target.value)}
            aria-label="写作区域"
          />
        </article>
      </div>
    </main>
  );
}
