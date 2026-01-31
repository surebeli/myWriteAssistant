"use client";

import { useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Plus, FileText } from "lucide-react";
import { Toolbar } from "@/components/layout/toolbar";
import { Sidebar } from "@/components/layout/sidebar";
import { AIPanel } from "@/components/layout/ai-panel";
import { StatusBar } from "@/components/layout/status-bar";
import { Button } from "@/components/ui/button";
import { DocumentCard } from "@/components/library/document-card";
import { SearchBar } from "@/components/library/search-bar";
import { ImportDialog } from "@/components/library/import-dialog";
import { useDocumentStore } from "@/stores/document-store";
import type { CollectedDocument } from "@/types/document";

function DocumentGrid() {
  const router = useRouter();
  const documents = useDocumentStore((s) => s.documents);
  const tags = useDocumentStore((s) => s.tags);
  const deleteDocument = useDocumentStore((s) => s.deleteDocument);
  const initializeSearch = useDocumentStore((s) => s.initializeSearch);
  const searchEngineReady = useDocumentStore((s) => s.searchEngineReady);

  useEffect(() => {
    if (!searchEngineReady) {
      initializeSearch();
    }
  }, [searchEngineReady, initializeSearch]);

  const handleSelect = useCallback(
    (doc: CollectedDocument) => {
      // 可以在这里显示文档详情或导航到预览页
      console.log("Selected document:", doc.id);
    },
    []
  );

  const handleDelete = useCallback(
    async (id: string) => {
      if (confirm("确定要删除这篇文档吗？")) {
        await deleteDocument(id);
      }
    },
    [deleteDocument]
  );

  const handleOpenInEditor = useCallback(
    (doc: CollectedDocument) => {
      // 将文档内容存入 localStorage，然后导航到编辑器
      localStorage.setItem("pendingEditorContent", JSON.stringify({
        title: doc.title,
        content: doc.content,
      }));
      router.push("/");
    },
    [router]
  );

  const handleImportSuccess = useCallback(
    (documentId: string) => {
      console.log("Imported document:", documentId);
    },
    []
  );

  const handleSearchResultSelect = useCallback(
    (documentId: string) => {
      const doc = documents.find((d) => d.id === documentId);
      if (doc) {
        handleSelect(doc);
      }
    },
    [documents, handleSelect]
  );

  return (
    <main className="flex-1 overflow-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col gap-4 mb-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-semibold">文档库</h1>
            <ImportDialog
              trigger={
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  导入文档
                </Button>
              }
              onImportSuccess={handleImportSuccess}
            />
          </div>
          
          <SearchBar onResultSelect={handleSearchResultSelect} />
        </div>

        {documents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <FileText className="h-16 w-16 text-muted-foreground/50 mb-4" />
            <h2 className="text-xl font-medium mb-2">暂无文档</h2>
            <p className="text-muted-foreground mb-6">
              导入网页、PDF 或 Markdown 文件开始构建您的知识库
            </p>
            <ImportDialog
              trigger={
                <Button className="gap-2">
                  <Plus className="h-4 w-4" />
                  导入第一篇文档
                </Button>
              }
              onImportSuccess={handleImportSuccess}
            />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <DocumentCard
                key={doc.id}
                document={doc}
                tags={tags}
                onSelect={handleSelect}
                onDelete={handleDelete}
                onOpenInEditor={handleOpenInEditor}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

export default function LibraryPage() {
  return (
    <div className="h-screen flex flex-col">
      <Toolbar />
      <div className="flex-1 flex overflow-hidden">
        <Sidebar />
        <DocumentGrid />
        <AIPanel />
      </div>
      <StatusBar />
    </div>
  );
}
