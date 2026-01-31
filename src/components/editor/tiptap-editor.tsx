"use client";

import { useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import Typography from "@tiptap/extension-typography";
import Link from "@tiptap/extension-link";
import Highlight from "@tiptap/extension-highlight";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import CodeBlockLowlight from "@tiptap/extension-code-block-lowlight";
import { common, createLowlight } from "lowlight";
import { useEffect, useRef } from "react";
import { EditorContent } from "./editor-content";
import { EditorToolbar } from "./editor-toolbar";
import { useEditorStore } from "@/stores/editor-store";

// Create lowlight instance with common languages
const lowlight = createLowlight(common);

interface TiptapEditorProps {
  onUpdate?: (content: string) => void;
  autosaveDelay?: number;
}

export function TiptapEditor({
  onUpdate,
  autosaveDelay = 2000,
}: TiptapEditorProps) {
  const { currentDocContent, updateContent } = useEditorStore();
  const autosaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        codeBlock: false, // We use CodeBlockLowlight instead
      }),
      Placeholder.configure({
        placeholder: "开始写作...",
        emptyEditorClass: "is-editor-empty",
      }),
      Typography,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-primary underline underline-offset-4",
        },
      }),
      Highlight.configure({
        multicolor: true,
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      CodeBlockLowlight.configure({
        lowlight,
        defaultLanguage: "javascript",
        HTMLAttributes: {
          class: "not-prose bg-muted border rounded-lg p-4 my-4 overflow-x-auto",
        },
      }),
    ],
    content: currentDocContent || "",
    editorProps: {
      attributes: {
        class: "min-h-[calc(100vh-14rem)] outline-none",
      },
    },
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      
      // Update store
      updateContent(html);
      
      // Trigger autosave with debounce
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
      
      autosaveTimerRef.current = setTimeout(() => {
        onUpdate?.(html);
      }, autosaveDelay);
    },
  });

  // Sync content from store to editor when document changes
  useEffect(() => {
    if (editor && currentDocContent !== editor.getHTML()) {
      editor.commands.setContent(currentDocContent || "");
    }
  }, [editor, currentDocContent]);

  // Cleanup autosave timer
  useEffect(() => {
    return () => {
      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="w-full border rounded-lg overflow-hidden">
      <EditorToolbar editor={editor} />
      <div className="p-4">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
