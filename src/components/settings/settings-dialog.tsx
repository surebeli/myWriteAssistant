"use client";

import { useState, useEffect } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import { useWorkspace } from "@/hooks/use-workspace";
import { useTheme } from "next-themes";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Sun, 
  Moon, 
  FolderOpen, 
  Key, 
  Palette,
  Check,
  AlertCircle,
  Loader2,
} from "lucide-react";

export function SettingsDialog() {
  const { theme, setTheme } = useTheme();
  const { selectWorkspace, isSelecting } = useWorkspace();
  const {
    aiConfig,
    setAIConfig,
    workspacePath,
    setWorkspacePath,
    settingsDialogOpen,
    settingsDialogTab,
    closeSettingsDialog,
    openSettingsDialog,
  } = useSettingsStore();

  const [localApiKey, setLocalApiKey] = useState(aiConfig.apiKey);
  const [localBaseUrl, setLocalBaseUrl] = useState(aiConfig.baseUrl);
  const [localModel, setLocalModel] = useState(aiConfig.model);
  const [localProvider, setLocalProvider] = useState(aiConfig.provider);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved">("idle");

  // 同步本地状态
  useEffect(() => {
    setLocalApiKey(aiConfig.apiKey);
    setLocalBaseUrl(aiConfig.baseUrl);
    setLocalModel(aiConfig.model);
    setLocalProvider(aiConfig.provider);
  }, [aiConfig]);

  const handleSelectWorkspace = async () => {
    console.log("[SettingsDialog] handleSelectWorkspace clicked");
    try {
      const path = await selectWorkspace();
      console.log("[SettingsDialog] selectWorkspace returned:", path);
      if (path) {
        setWorkspacePath(path);
      }
    } catch (err) {
      console.error("[SettingsDialog] Error:", err);
    }
  };

  const handleSaveAIConfig = () => {
    setAIConfig({
      provider: localProvider,
      apiKey: localApiKey,
      baseUrl: localBaseUrl,
      model: localModel,
    });
    setSaveStatus("saved");
    setTimeout(() => setSaveStatus("idle"), 2000);
  };

  const getProviderDefaults = (provider: string) => {
    switch (provider) {
      case "openai":
        return { baseUrl: "https://api.openai.com/v1", model: "gpt-4o" };
      case "anthropic":
        return { baseUrl: "https://api.anthropic.com", model: "claude-sonnet-4-20250514" };
      case "custom":
        return { baseUrl: "", model: "" };
      default:
        return { baseUrl: "", model: "" };
    }
  };

  const handleProviderChange = (provider: "openai" | "anthropic" | "custom") => {
    setLocalProvider(provider);
    const defaults = getProviderDefaults(provider);
    setLocalBaseUrl(defaults.baseUrl);
    setLocalModel(defaults.model);
  };

  return (
    <Dialog open={settingsDialogOpen} onOpenChange={(open) => !open && closeSettingsDialog()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>设置</DialogTitle>
          <DialogDescription>
            配置 API、工作目录和外观
          </DialogDescription>
        </DialogHeader>

        <Tabs value={settingsDialogTab} onValueChange={(v) => openSettingsDialog(v as "ai" | "workspace" | "appearance")}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai" className="gap-1.5">
              <Key className="h-4 w-4" />
              AI 配置
            </TabsTrigger>
            <TabsTrigger value="workspace" className="gap-1.5">
              <FolderOpen className="h-4 w-4" />
              工作目录
            </TabsTrigger>
            <TabsTrigger value="appearance" className="gap-1.5">
              <Palette className="h-4 w-4" />
              外观
            </TabsTrigger>
          </TabsList>

          {/* AI 配置 */}
          <TabsContent value="ai" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="provider">AI 服务商</Label>
              <Select value={localProvider} onValueChange={handleProviderChange}>
                <SelectTrigger>
                  <SelectValue placeholder="选择服务商" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="custom">自定义</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="apiKey">API Key</Label>
              <Input
                id="apiKey"
                type="password"
                placeholder="sk-..."
                value={localApiKey}
                onChange={(e) => setLocalApiKey(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                API Key 仅保存在本地，不会上传到任何服务器
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                placeholder="https://api.openai.com/v1"
                value={localBaseUrl}
                onChange={(e) => setLocalBaseUrl(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="model">模型</Label>
              <Input
                id="model"
                placeholder="gpt-4o"
                value={localModel}
                onChange={(e) => setLocalModel(e.target.value)}
              />
            </div>

            <Button onClick={handleSaveAIConfig} className="w-full">
              {saveStatus === "saved" ? (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  已保存
                </>
              ) : (
                "保存配置"
              )}
            </Button>

            {!localApiKey && (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                未配置 API Key，AI 功能将不可用
              </div>
            )}
          </TabsContent>

          {/* 工作目录 */}
          <TabsContent value="workspace" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>当前工作目录</Label>
              <div className="flex items-center gap-2">
                <div className="flex-1 px-3 py-2 bg-muted rounded-md text-sm truncate">
                  {workspacePath || "未设置"}
                </div>
                <Button variant="outline" onClick={handleSelectWorkspace} disabled={isSelecting}>
                  {isSelecting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FolderOpen className="h-4 w-4 mr-2" />
                  )}
                  选择
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                工作目录用于存储您的文档、草稿和素材
              </p>
            </div>

            {workspacePath && (
              <div className="text-sm text-muted-foreground space-y-1">
                <p>目录结构：</p>
                <ul className="list-disc list-inside pl-2 space-y-0.5">
                  <li><code>documents/</code> - 收藏的文档</li>
                  <li><code>drafts/</code> - 写作草稿</li>
                  <li><code>summaries/</code> - AI 生成的摘要</li>
                  <li><code>published/</code> - 已发布的文章</li>
                </ul>
              </div>
            )}

            {!workspacePath && (
              <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
                <AlertCircle className="h-4 w-4" />
                未设置工作目录，文档仅保存在浏览器本地存储中
              </div>
            )}
          </TabsContent>

          {/* 外观 */}
          <TabsContent value="appearance" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>主题</Label>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setTheme("light")}
                >
                  <Sun className="h-4 w-4 mr-2" />
                  浅色
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setTheme("dark")}
                >
                  <Moon className="h-4 w-4 mr-2" />
                  深色
                </Button>
                <Button
                  variant={theme === "system" ? "default" : "outline"}
                  className="flex-1"
                  onClick={() => setTheme("system")}
                >
                  跟随系统
                </Button>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
