"use client";

import { useAppStore } from "@/stores/app-store";
import { useSettingsStore } from "@/stores/settings-store";
import { ScrollArea } from "@/components/ui/scroll-area";
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
  Settings,
  Pencil,
} from "lucide-react";

export function Sidebar() {
  const { sidebarOpen, currentView, setCurrentView } = useAppStore();
  const { workspacePath, openSettingsDialog } = useSettingsStore();

  if (!sidebarOpen) return null;

  return (
    <aside className="w-64 border-r bg-[#f6f5f8] dark:bg-[#131022] flex flex-col">
      {/* Logo */}
      <div className="p-6">
        <h1 className="text-primary text-lg font-bold flex items-center gap-2">
          <Pencil className="h-5 w-5" />
          MyWriteAssistant
        </h1>
      </div>

      {/* Search */}
      <div className="px-4 py-2">
        <div className="flex items-center bg-[#e9e7f4] dark:bg-gray-800 rounded-lg overflow-hidden">
          <div className="text-[#57499c] flex items-center justify-center pl-3">
            <Search className="h-5 w-5" />
          </div>
          <Input
            type="search"
            placeholder="Search folders..."
            className="border-none bg-transparent text-sm placeholder:text-[#57499c] focus-visible:ring-0 focus-visible:ring-offset-0"
          />
        </div>
      </div>

      <ScrollArea className="flex-1 px-4 py-4">
        {/* Folders */}
        <p className="text-[#57499c] text-xs font-semibold uppercase tracking-wider px-3 mb-2">
          Folders
        </p>
        <nav className="space-y-1">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 py-2 h-auto font-medium"
            onClick={() => setCurrentView("library")}
          >
            <Globe className="h-5 w-5" />
            Web
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3 px-3 py-2 h-auto font-medium"
          >
            <FileText className="h-5 w-5" />
            PDF
          </Button>
          <Button
            variant={currentView === "editor" ? "default" : "ghost"}
            className={`w-full justify-start gap-3 px-3 py-2 h-auto font-medium ${
              currentView === "editor" ? "bg-primary text-white hover:bg-primary/90" : ""
            }`}
            onClick={() => setCurrentView("editor")}
          >
            <StickyNote className="h-5 w-5" />
            Notes
          </Button>
        </nav>

        {/* Tags */}
        <div className="mt-8">
          <p className="text-[#57499c] text-xs font-semibold uppercase tracking-wider px-3 mb-2">
            Tags
          </p>
          <nav className="space-y-1">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-2 h-auto font-medium"
            >
              <Tag className="h-5 w-5 text-primary" />
              AI Trends
            </Button>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 px-3 py-2 h-auto font-medium"
            >
              <Tag className="h-5 w-5" />
              Drafts
            </Button>
          </nav>
        </div>
      </ScrollArea>

      {/* Settings */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 px-3 py-2 h-auto font-medium"
          onClick={() => openSettingsDialog()}
        >
          <Settings className="h-5 w-5" />
          Settings
        </Button>
      </div>
    </aside>
  );
}
