"use client";

import { useAppStore } from "@/stores/app-store";
import { useEditorStore } from "@/stores/editor-store";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  const {
    sidebarOpen,
    toggleSidebar,
    aiPanelOpen,
    toggleAIPanel,
    assistantMode,
    setAssistantMode,
  } = useAppStore();
  const { isDirty, currentDocTitle } = useEditorStore();

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
              <Button variant="ghost" size="icon" aria-label="新建文档">
                <FileText className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>新建文档</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="保存">
                <Save className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>保存</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="导出">
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
          {/* Mode switcher */}
          <Tabs
            value={assistantMode}
            onValueChange={(v) => setAssistantMode(v as "proactive" | "chat")}
          >
            <TabsList className="h-8">
              <TabsTrigger value="proactive" className="text-xs px-3">
                Proactive
              </TabsTrigger>
              <TabsTrigger value="chat" className="text-xs px-3">
                Chat
              </TabsTrigger>
            </TabsList>
          </Tabs>

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
              <Button variant="ghost" size="icon" aria-label="设置">
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
