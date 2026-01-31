"use client";

import { useState } from "react";
import { useAppStore } from "@/stores/app-store";
import { useEditorStore } from "@/stores/editor-store";
import { useSettingsStore } from "@/stores/settings-store";
import { Button } from "@/components/ui/button";
import {
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  FileText,
  Save,
  Download,
  Settings,
  Sun,
  Moon,
  Check,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function Toolbar() {
  const { theme, setTheme } = useTheme();
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle");
  const { openSettingsDialog } = useSettingsStore();
  const {
    sidebarOpen,
    toggleSidebar,
    aiPanelOpen,
    toggleAIPanel,
  } = useAppStore();
  const { 
    isDirty, 
    currentDocTitle, 
    currentDocContent,
    currentDocId,
    markSaved,
    newDocument,
  } = useEditorStore();

  const handleNew = () => {
    if (isDirty) {
      if (window.confirm("当前文档未保存，确定创建新文档？")) {
        newDocument();
      }
    } else {
      newDocument();
    }
  };

  const handleSave = async () => {
    setSaveStatus("saving");
    try {
      // 保存到 localStorage
      const docId = currentDocId || `doc-${Date.now()}`;
      const docData = {
        id: docId,
        title: currentDocTitle,
        content: currentDocContent,
        updatedAt: new Date().toISOString(),
      };
      
      // 获取已保存的文档列表
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
      
      // 2秒后恢复状态
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (error) {
      console.error("保存失败:", error);
      setSaveStatus("idle");
      alert("保存失败，请重试");
    }
  };

  const handleExport = () => {
    if (!currentDocContent && !currentDocTitle) {
      alert("当前没有可导出的内容");
      return;
    }
    
    // 生成 Markdown 内容
    const markdown = `# ${currentDocTitle}\n\n${currentDocContent}`;
    
    // 创建 Blob 并下载
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

  return (
    <TooltipProvider>
      <header className="h-14 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-between px-4">
        {/* Left section */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleSidebar}
                aria-label={sidebarOpen ? "关闭侧边栏" : "打开侧边栏"}
              >
                {sidebarOpen ? (
                  <PanelLeftClose className="h-5 w-5" />
                ) : (
                  <PanelLeftOpen className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {sidebarOpen ? "关闭侧边栏" : "打开侧边栏"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="新建文档" onClick={handleNew}>
                <FileText className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>新建文档</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="保存" onClick={handleSave} disabled={saveStatus === "saving"}>
                {saveStatus === "saved" ? (
                  <Check className="h-5 w-5 text-green-500" />
                ) : (
                  <Save className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {saveStatus === "saving" ? "保存中..." : saveStatus === "saved" ? "已保存" : "保存"}
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="导出" onClick={handleExport}>
                <Download className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>导出</TooltipContent>
          </Tooltip>
        </div>

        {/* Center - Document title */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">
            {currentDocTitle}
            {isDirty && <span className="text-muted-foreground"> •</span>}
          </span>
        </div>

        {/* Right section */}
        <div className="flex items-center gap-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                aria-label="切换主题"
              >
                <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>切换主题</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="设置" onClick={() => openSettingsDialog()}>
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>设置</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleAIPanel}
                aria-label={aiPanelOpen ? "关闭 AI 面板" : "打开 AI 面板"}
              >
                {aiPanelOpen ? (
                  <PanelRightClose className="h-5 w-5" />
                ) : (
                  <PanelRightOpen className="h-5 w-5" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              {aiPanelOpen ? "关闭 AI 面板" : "打开 AI 面板"}
            </TooltipContent>
          </Tooltip>
        </div>
      </header>
    </TooltipProvider>
  );
}
