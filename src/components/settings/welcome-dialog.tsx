"use client";

import { useEffect, useState } from "react";
import { useSettingsStore } from "@/stores/settings-store";
import { useWorkspace } from "@/hooks/use-workspace";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FolderOpen, Sparkles, Loader2 } from "lucide-react";

export function WelcomeDialog() {
  const { selectWorkspace, isSelecting } = useWorkspace();
  const {
    isFirstLaunch,
    setFirstLaunch,
    workspacePath,
    setWorkspacePath,
    openSettingsDialog,
  } = useSettingsStore();

  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<"welcome" | "workspace">("welcome");

  useEffect(() => {
    // 首次启动时显示欢迎弹窗
    if (isFirstLaunch) {
      setOpen(true);
    }
  }, [isFirstLaunch]);

  const handleSelectWorkspace = async () => {
    console.log("[WelcomeDialog] handleSelectWorkspace clicked");
    try {
      const path = await selectWorkspace();
      console.log("[WelcomeDialog] selectWorkspace returned:", path);
      if (path) {
        setWorkspacePath(path);
        handleComplete();
      }
    } catch (err) {
      console.error("[WelcomeDialog] Error:", err);
    }
  };

  const handleComplete = () => {
    setFirstLaunch(false);
    setOpen(false);
  };

  const handleSkip = () => {
    setFirstLaunch(false);
    setOpen(false);
    // 打开设置弹窗让用户配置 API
    openSettingsDialog("ai");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-md" onInteractOutside={(e) => e.preventDefault()}>
        {step === "welcome" ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                欢迎使用 MyWriteAssistant
              </DialogTitle>
              <DialogDescription>
                AI 驱动的写作助手，帮助您收集素材、整理思路、高效创作
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="space-y-2 text-sm text-muted-foreground">
                <p>✨ <strong>Proactive 模式</strong>：AI 主动分析您的写作，提供实时建议</p>
                <p>💬 <strong>Chat 模式</strong>：随时与 AI 对话，获取写作帮助</p>
                <p>📚 <strong>素材库</strong>：收集网页、PDF，构建个人知识库</p>
              </div>

              <Button className="w-full" onClick={() => setStep("workspace")}>
                开始设置
              </Button>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                选择工作目录
              </DialogTitle>
              <DialogDescription>
                选择一个文件夹来存储您的文档和素材
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="text-sm text-muted-foreground">
                <p>工作目录将用于存储：</p>
                <ul className="list-disc list-inside mt-2 space-y-1">
                  <li>写作草稿</li>
                  <li>收藏的文档</li>
                  <li>AI 生成的摘要</li>
                </ul>
              </div>

              {workspacePath && (
                <div className="px-3 py-2 bg-muted rounded-md text-sm">
                  已选择：<strong>{workspacePath}</strong>
                </div>
              )}

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={handleSkip}>
                  稍后设置
                </Button>
                <Button className="flex-1" onClick={handleSelectWorkspace} disabled={isSelecting}>
                  {isSelecting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <FolderOpen className="h-4 w-4 mr-2" />
                  )}
                  选择文件夹
                </Button>
              </div>

              <p className="text-xs text-muted-foreground text-center">
                您可以稍后在设置中修改工作目录
              </p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
