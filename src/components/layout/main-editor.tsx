"use client";

import dynamic from "next/dynamic";
import { useEditorStore } from "@/stores/editor-store";
import { useAppStore } from "@/stores/app-store";
import { useFileSystem } from "@/hooks/use-file-system";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, Share2, Download, FileText, Clock, Check, Save } from "lucide-react";

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
  const { currentDocId, currentDocTitle, currentDocContent, isDirty, markSaved, wordCount } = useEditorStore();
  const { toggleSidebar } = useAppStore();
  const { writeFile, isConnected } = useFileSystem();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");

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

  const handleExport = () => {
    if (!currentDocContent && !currentDocTitle) {
      alert("当前没有可导出的内容");
      return;
    }
    
    const markdown = `# ${currentDocTitle}\n\n${currentDocContent}`;
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${currentDocTitle || "untitled"}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      const docId = currentDocId || `doc-${Date.now()}`;
      const docData = {
        id: docId,
        title: currentDocTitle,
        content: currentDocContent,
        updatedAt: new Date().toISOString(),
      };
      
      const savedDocs = JSON.parse(localStorage.getItem("savedDocuments") || "[]");
      const existingIndex = savedDocs.findIndex((d: { id: string }) => d.id === docId);
      
      if (existingIndex >= 0) {
        savedDocs[existingIndex] = docData;
      } else {
        savedDocs.unshift(docData);
      }
      
      localStorage.setItem("savedDocuments", JSON.stringify(savedDocs.slice(0, 50)));
      localStorage.setItem(`doc-${docId}`, JSON.stringify(docData));
      
      markSaved();
      setSaveStatus("saved");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("保存失败:", error);
      setSaveStatus("idle");
    }
  };

  return (
    <main className="flex-1 flex flex-col min-w-0 bg-white dark:bg-black overflow-hidden">
      {/* Editor Header - inside main area */}
      <header className="h-16 border-b border-gray-100 dark:border-gray-900 flex items-center justify-between px-8 shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <Menu className="h-5 w-5" />
          </button>
          <span className="text-sm text-gray-400">
            Personal / Notes / {currentDocTitle}
            {isDirty && <span className="ml-1">•</span>}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            className="bg-primary/10 text-primary hover:bg-primary/20 px-4"
            onClick={handleSave}
          >
            {saveStatus === "saved" ? (
              <Check className="h-4 w-4 mr-1" />
            ) : (
              <Save className="h-4 w-4 mr-1" />
            )}
            {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved" : "Save"}
          </Button>
          <Button
            size="sm"
            className="bg-primary text-white hover:bg-primary/90 px-4"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-1" />
            Export
          </Button>
        </div>
      </header>

      {/* Editor Content */}
      <div className="flex-1 overflow-auto px-4 py-4">
        <TiptapEditor onUpdate={handleAutoSave} autosaveDelay={2000} />
      </div>

      {/* Editor Footer - inside main area */}
      <footer className="border-t border-gray-100 dark:border-gray-900 px-8 py-3 flex items-center justify-between bg-white dark:bg-black shrink-0">
        <div className="flex items-center gap-6 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <FileText className="h-3.5 w-3.5" />
            {wordCount} Words
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3.5 w-3.5" />
            Edited just now
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 rounded-full bg-green-500"></span>
          <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
            Proactive mode active
          </span>
        </div>
      </footer>
    </main>
  );
}
