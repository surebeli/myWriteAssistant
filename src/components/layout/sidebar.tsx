"use client";

import { useAppStore } from "@/stores/app-store";
import { useSettingsStore } from "@/stores/settings-store";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FolderOpen,
  Globe,
  FileText,
  StickyNote,
  Tag,
  Search,
  FileEdit,
  Library,
} from "lucide-react";

export function Sidebar() {
  const { sidebarOpen, currentView, setCurrentView } = useAppStore();
  const { workspacePath, openSettingsDialog } = useSettingsStore();

  if (!sidebarOpen) return null;

  return (
    <aside className="w-60 border-r bg-muted/30 flex flex-col">
      {/* Search */}
      <div className="p-3">
        <div className="relative">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="搜索文档…"
            className="pl-8 h-9"
            aria-label="搜索文档"
          />
        </div>
      </div>

      <Separator />

      <ScrollArea className="flex-1">
        <div className="p-2">
          {/* Navigation */}
          <nav className="space-y-1">
            <Button
              variant={currentView === "editor" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setCurrentView("editor")}
            >
              <FileEdit className="h-4 w-4" />
              写作
            </Button>
            <Button
              variant={currentView === "library" ? "secondary" : "ghost"}
              className="w-full justify-start gap-2"
              onClick={() => setCurrentView("library")}
            >
              <Library className="h-4 w-4" />
              文档库
            </Button>
          </nav>

          <Separator className="my-3" />

          {/* Collections */}
          <div className="space-y-1">
            <p className="px-2 text-xs font-medium text-muted-foreground mb-2">
              收藏文档
            </p>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
            >
              <Globe className="h-4 w-4" />
              网页文章
              <span className="ml-auto text-xs text-muted-foreground">12</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
            >
              <FileText className="h-4 w-4" />
              PDF 文档
              <span className="ml-auto text-xs text-muted-foreground">5</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
            >
              <StickyNote className="h-4 w-4" />
              笔记
              <span className="ml-auto text-xs text-muted-foreground">8</span>
            </Button>
          </div>

          <Separator className="my-3" />

          {/* Tags */}
          <div className="space-y-1">
            <p className="px-2 text-xs font-medium text-muted-foreground mb-2">
              标签
            </p>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
            >
              <Tag className="h-4 w-4 text-blue-500" />
              AI
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
            >
              <Tag className="h-4 w-4 text-green-500" />
              技术
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm"
            >
              <Tag className="h-4 w-4 text-purple-500" />
              产品
            </Button>
          </div>

          <Separator className="my-3" />

          {/* Recent drafts */}
          <div className="space-y-1">
            <p className="px-2 text-xs font-medium text-muted-foreground mb-2">
              最近草稿
            </p>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm truncate"
            >
              <FileEdit className="h-4 w-4 shrink-0" />
              <span className="truncate">AI 写作助手设计思路</span>
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-2 text-sm truncate"
            >
              <FileEdit className="h-4 w-4 shrink-0" />
              <span className="truncate">Proactive 模式技术实现</span>
            </Button>
          </div>
        </div>
      </ScrollArea>

      {/* Storage folder */}
      <div className="p-3 border-t">
        <Button
          variant="outline"
          className="w-full justify-start gap-2 text-xs"
          onClick={() => openSettingsDialog("workspace")}
        >
          <FolderOpen className="h-4 w-4" />
          <span className="truncate">{workspacePath || "未设置工作目录"}</span>
        </Button>
      </div>
    </aside>
  );
}
