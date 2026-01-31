"use client";

import { useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Sparkles, Check, X, Pencil, Loader2 } from "lucide-react";
import { useProactive } from "@/hooks/use-proactive";
import { useEditorObserver } from "@/hooks/use-editor-observer";
import { useEditorContext } from "@/components/editor/editor-context";
import { extractLastSentence } from "@/lib/sentence-detector";

export function ProactivePanel() {
  const { editor } = useEditorContext();
  
  const {
    currentSentence,
    suggestion,
    isGenerating,
    updateSentence,
    acceptSuggestion,
    ignoreSuggestion,
  } = useProactive({
    debounceMs: 1500,
    onError: (error) => console.error("Proactive error:", error),
  });

  // 监听编辑器变化
  useEditorObserver({
    editor,
    enabled: true,
    onSentenceComplete: useCallback(
      (sentence: string, context: string) => {
        updateSentence(sentence, context);
      },
      [updateSentence]
    ),
  });

  // 采纳建议 - 替换原句
  const handleAccept = useCallback(() => {
    if (!editor || !suggestion || !currentSentence) return;
    
    const editorText = editor.getText();
    const lastSentence = extractLastSentence(editorText);
    
    if (lastSentence && lastSentence === currentSentence) {
      // 找到原句的位置并替换
      const html = editor.getHTML();
      const escapedSentence = currentSentence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedSentence);
      const newHtml = html.replace(regex, suggestion);
      
      editor.commands.setContent(newHtml);
      editor.commands.focus("end");
    }
    
    acceptSuggestion();
  }, [editor, suggestion, currentSentence, acceptSuggestion]);

  // 忽略建议
  const handleIgnore = useCallback(() => {
    ignoreSuggestion();
  }, [ignoreSuggestion]);

  // 编辑建议（将建议插入编辑器让用户编辑）
  const handleEdit = useCallback(() => {
    if (!editor || !suggestion) return;
    
    // 插入建议文本，让用户自己编辑
    editor.commands.insertContent(`\n\n[建议] ${suggestion}`);
    editor.commands.focus("end");
    
    ignoreSuggestion();
  }, [editor, suggestion, ignoreSuggestion]);

  // 当没有编辑器时显示提示
  if (!editor) {
    return (
      <div className="flex flex-col h-full items-center justify-center p-4 text-center">
        <Sparkles className="h-10 w-10 text-muted-foreground/50 mb-4" />
        <p className="text-sm text-muted-foreground">
          请在编辑器中开始写作
        </p>
        <p className="text-xs text-muted-foreground/70 mt-2">
          Proactive 模式会在你写完一个句子后自动提供改写建议
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Current sentence sync */}
      <div className="p-4 border-b">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
          <Sparkles className="h-4 w-4" />
          <span>实时同步</span>
          {isGenerating && (
            <Loader2 className="h-3 w-3 animate-spin ml-auto" />
          )}
        </div>
        {currentSentence ? (
          <p className="text-sm bg-muted/50 rounded-lg p-3 italic">
            &quot;{currentSentence}&quot;
          </p>
        ) : (
          <p className="text-sm text-muted-foreground/60 bg-muted/30 rounded-lg p-3 italic">
            等待输入完整句子...
          </p>
        )}
      </div>

      {/* Suggestion area */}
      <ScrollArea className="flex-1">
        <div className="p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <span>建议改写</span>
          </div>
          
          {isGenerating && !suggestion ? (
            <div className="bg-muted/30 border border-dashed rounded-lg p-3 flex items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              <span className="text-sm text-muted-foreground">正在生成建议...</span>
            </div>
          ) : suggestion ? (
            <>
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-3">
                <p className="text-sm">
                  &quot;{suggestion}&quot;
                </p>
              </div>

              {/* Action buttons */}
              <div className="flex gap-2 mt-3">
                <Button size="sm" className="flex-1 gap-1" onClick={handleAccept}>
                  <Check className="h-4 w-4" />
                  采纳
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 gap-1"
                  onClick={handleIgnore}
                >
                  <X className="h-4 w-4" />
                  忽略
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="gap-1"
                  onClick={handleEdit}
                  title="编辑建议"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </>
          ) : (
            <div className="text-sm text-muted-foreground/60 bg-muted/30 rounded-lg p-3">
              <p>完成一个句子后，AI 将自动提供改写建议。</p>
              <p className="mt-2 text-xs">提示：用句号、问号或感叹号结束句子</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Status */}
      <div className="p-3 border-t text-center">
        <span className="text-xs text-muted-foreground">
          Proactive 模式 • {isGenerating ? "生成中..." : "就绪"}
        </span>
      </div>
    </div>
  );
}
