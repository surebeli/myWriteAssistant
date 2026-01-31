"use client";

import dynamic from "next/dynamic";
import { useEditorStore } from "@/stores/editor-store";
import { useFileSystem } from "@/hooks/use-file-system";
import { useCallback } from "react";

// Dynamic import to avoid SSR issues with Tiptap
const TiptapEditor = dynamic(
  () => import("@/components/editor/tiptap-editor").then((mod) => mod.TiptapEditor),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-muted-foreground">加载编辑器中…</div>
      </div>
    ),
  }
);

export function MainEditor() {
  const { currentDocId, markSaved } = useEditorStore();
  const { writeFile, isConnected } = useFileSystem();

  const handleAutoSave = useCallback(
    async (content: string) => {
      if (!isConnected || !currentDocId) return;

      const filename = `drafts/${currentDocId}.html`;
      const success = await writeFile(filename, content);
      
      if (success) {
        markSaved();
      }
    },
    [isConnected, currentDocId, writeFile, markSaved]
  );

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-background">
      <div className="flex-1 overflow-auto p-8">
        <article className="max-w-3xl mx-auto">
          <TiptapEditor onUpdate={handleAutoSave} autosaveDelay={2000} />
        </article>
      </div>
    </main>
  );
}
