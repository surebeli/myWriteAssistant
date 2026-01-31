"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Editor } from "@tiptap/react";

interface EditorContextType {
  editor: Editor | null;
  setEditor: (editor: Editor | null) => void;
}

const EditorContext = createContext<EditorContextType | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const [editor, setEditor] = useState<Editor | null>(null);

  return (
    <EditorContext.Provider value={{ editor, setEditor }}>
      {children}
    </EditorContext.Provider>
  );
}

export function useEditorContext() {
  const context = useContext(EditorContext);
  if (!context) {
    // 返回一个空的上下文，用于非编辑器页面
    return { editor: null, setEditor: () => {} };
  }
  return context;
}
