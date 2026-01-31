"use client";

import { useCallback } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { RefreshCw, Check, X, Pencil, Loader2, Lightbulb, Wand2, Languages } from "lucide-react";
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
      const html = editor.getHTML();
      const escapedSentence = currentSentence.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(escapedSentence);
      const newHtml = html.replace(regex, suggestion);
      
      editor.commands.setContent(newHtml);
      editor.commands.focus("end");
    }
    
    acceptSuggestion();
  }, [editor, suggestion, currentSentence, acceptSuggestion]);

  const handleIgnore = useCallback(() => {
    ignoreSuggestion();
  }, [ignoreSuggestion]);

  const handleEdit = useCallback(() => {
    if (!editor || !suggestion) return;
    editor.commands.insertContent(`\n\n[建议] ${suggestion}`);
    editor.commands.focus("end");
    ignoreSuggestion();
  }, [editor, suggestion, ignoreSuggestion]);

  if (!editor) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-center">
        <Wand2 className="h-10 w-10 text-gray-300 mb-4" />
        <p className="text-sm text-gray-500">请在编辑器中开始写作</p>
        <p className="text-xs text-gray-400 mt-2">
          Proactive 模式会自动提供改写建议
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1">
      <div className="space-y-4">
        {/* Real-time Sync Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <RefreshCw className={`h-4 w-4 text-gray-400 ${isGenerating ? "animate-spin" : ""}`} />
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">实时同步</h3>
          </div>
          {currentSentence ? (
            <p className="text-sm text-gray-600 dark:text-gray-300 leading-relaxed italic">
              &quot;{currentSentence}&quot;
            </p>
          ) : (
            <p className="text-sm text-gray-400 italic">
              等待输入完整句子...
            </p>
          )}
        </div>

        {/* Suggestion Card */}
        <div className={`bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border ${
          suggestion ? "border-primary/20 ring-1 ring-primary/10" : "border-gray-100 dark:border-gray-700"
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4 text-amber-500" />
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide">建议改写</h3>
            </div>
            {suggestion && (
              <span className="text-[10px] text-gray-400">更专业 · 简洁</span>
            )}
          </div>

          {isGenerating && !suggestion ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin mr-2 text-primary" />
              <span className="text-sm text-gray-500">正在生成建议...</span>
            </div>
          ) : suggestion ? (
            <>
              <div className="p-3 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/10 mb-4">
                <p className="text-sm text-gray-800 dark:text-white leading-relaxed font-medium">
                  {suggestion}
                </p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={handleAccept}
                  className="flex items-center justify-center gap-1 py-2 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary/90"
                >
                  <Check className="h-4 w-4" />
                  采纳
                </button>
                <button
                  onClick={handleIgnore}
                  className="flex items-center justify-center gap-1 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <X className="h-4 w-4" />
                  忽略
                </button>
                <button
                  onClick={handleEdit}
                  className="flex items-center justify-center gap-1 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-200 dark:hover:bg-gray-600"
                >
                  <Pencil className="h-4 w-4" />
                  修改
                </button>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-400 italic">
              完成一个句子后，AI 将自动提供改写建议
            </p>
          )}
        </div>

        {/* Quick Tools */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Quick Tools</h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-1 cursor-pointer hover:border-primary/30 transition-colors">
              <Wand2 className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">润色</span>
            </div>
            <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700 flex flex-col items-center gap-1 cursor-pointer hover:border-primary/30 transition-colors">
              <Languages className="h-5 w-5 text-primary" />
              <span className="text-xs font-medium">翻译</span>
            </div>
          </div>
        </div>
      </div>
    </ScrollArea>
  );
}
