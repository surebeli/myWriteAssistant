import { Toolbar } from "@/components/layout/toolbar";
import { Sidebar } from "@/components/layout/sidebar";
import { AIPanel } from "@/components/layout/ai-panel";
import { StatusBar } from "@/components/layout/status-bar";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Globe, StickyNote, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

function DocumentGrid() {
  // Placeholder documents
  const documents = [
    { id: "1", title: "RAG 技术原理详解", type: "web", date: "2026-01-30" },
    { id: "2", title: "大模型应用开发指南.pdf", type: "pdf", date: "2026-01-29" },
    { id: "3", title: "产品设计笔记", type: "note", date: "2026-01-28" },
    { id: "4", title: "Prompt 工程最佳实践", type: "web", date: "2026-01-27" },
  ];

  const getIcon = (type: string) => {
    switch (type) {
      case "web":
        return <Globe className="h-8 w-8 text-blue-500" />;
      case "pdf":
        return <FileText className="h-8 w-8 text-red-500" />;
      case "note":
        return <StickyNote className="h-8 w-8 text-yellow-500" />;
      default:
        return <FileText className="h-8 w-8" />;
    }
  };

  return (
    <main className="flex-1 overflow-auto p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">文档库</h1>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            导入文档
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {documents.map((doc) => (
            <Card
              key={doc.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
            >
              <CardContent className="p-4">
                <div className="flex flex-col items-center text-center gap-3">
                  {getIcon(doc.type)}
                  <div>
                    <p className="font-medium text-sm line-clamp-2">
                      {doc.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {doc.date}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
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
