"use client";

import { useState } from "react";
import { Link, FileUp, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useImportDocument } from "@/hooks/use-import-document";

interface ImportDialogProps {
  trigger?: React.ReactNode;
  onImportSuccess?: (documentId: string) => void;
}

export function ImportDialog({ trigger, onImportSuccess }: ImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const { isImporting, progress, error, importFromUrl, importFile, reset } =
    useImportDocument();

  const handleUrlImport = async () => {
    if (!url.trim()) return;

    const result = await importFromUrl(url);
    if (result.success && result.documentId) {
      onImportSuccess?.(result.documentId);
      setOpen(false);
      setUrl("");
      reset();
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await importFile(file);
    if (result.success && result.documentId) {
      onImportSuccess?.(result.documentId);
      setOpen(false);
      reset();
    }

    // 重置 input
    e.target.value = "";
  };

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
    if (!open) {
      setUrl("");
      reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || <Button>导入文档</Button>}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>导入文档</DialogTitle>
          <DialogDescription>
            从网页链接导入或上传本地文件
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="url" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="url" disabled={isImporting}>
              <Link className="mr-2 h-4 w-4" />
              网页链接
            </TabsTrigger>
            <TabsTrigger value="file" disabled={isImporting}>
              <FileUp className="mr-2 h-4 w-4" />
              上传文件
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="url">网页链接</Label>
              <Input
                id="url"
                placeholder="https://example.com/article"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                disabled={isImporting}
              />
            </div>

            <Button
              onClick={handleUrlImport}
              disabled={!url.trim() || isImporting}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  导入中...
                </>
              ) : (
                "导入网页"
              )}
            </Button>
          </TabsContent>

          <TabsContent value="file" className="space-y-4">
            <div className="space-y-2">
              <Label>支持的文件类型</Label>
              <p className="text-sm text-muted-foreground">
                PDF、Markdown (.md)、文本文件 (.txt)
              </p>
            </div>

            <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-6">
              <label className="cursor-pointer">
                <input
                  type="file"
                  className="hidden"
                  accept=".pdf,.md,.markdown,.txt,.text"
                  onChange={handleFileSelect}
                  disabled={isImporting}
                />
                <div className="flex flex-col items-center gap-2 text-center">
                  {isImporting ? (
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  ) : (
                    <FileUp className="h-8 w-8 text-muted-foreground" />
                  )}
                  <span className="text-sm text-muted-foreground">
                    {isImporting ? "处理中..." : "点击选择文件"}
                  </span>
                </div>
              </label>
            </div>
          </TabsContent>
        </Tabs>

        {/* 进度条 */}
        {isImporting && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-center text-sm text-muted-foreground">
              正在处理文档...
            </p>
          </div>
        )}

        {/* 错误提示 */}
        {error && (
          <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
