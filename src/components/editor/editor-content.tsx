"use client";

import { EditorContent as TiptapEditorContent, Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";

interface EditorContentProps {
  editor: Editor | null;
  className?: string;
}

export function EditorContent({ editor, className }: EditorContentProps) {
  return (
    <TiptapEditorContent
      editor={editor}
      className={cn(
        "prose prose-slate dark:prose-invert max-w-none",
        "prose-headings:font-semibold prose-headings:tracking-tight",
        "prose-h1:text-3xl prose-h2:text-2xl prose-h3:text-xl",
        "prose-p:leading-7 prose-p:my-4",
        "prose-a:text-primary prose-a:underline-offset-4 hover:prose-a:underline",
        "prose-code:bg-muted prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:font-mono prose-code:text-sm",
        "prose-pre:bg-muted prose-pre:border prose-pre:rounded-lg",
        "prose-blockquote:border-l-4 prose-blockquote:border-primary/50 prose-blockquote:pl-4 prose-blockquote:italic",
        "prose-ul:list-disc prose-ol:list-decimal",
        "prose-li:my-1",
        "focus:outline-none",
        className
      )}
    />
  );
}
